// background.js — Veo WR v2.8 (webRequest interception for Gemini)
// Flow (labs.google)  → blob has valid origin → page-context blobCache works ✅
// Gemini             → blob:null (sandboxed/worker origin) → blob is unreachable ❌
//                      Fix: webRequest.onHeadersReceived catches the original HTTP
//                      video request BEFORE Gemini wraps it in a blob, so when
//                      fix: webRequest.onHeadersReceived catches the original HTTP
//                      video request BEFORE Gemini wraps it in a blob.
'use strict';

initI18n().then(() => {
    console.log(__t('bg_loaded'));
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'https://veowr.pages.dev/' }).catch(() => { });
    }
});

let settings = { blurRadius: 2, fps: -1, format: 'mp4', autoProcess: true };
chrome.storage.local.get(['blurRadius', 'fps', 'format', 'autoProcess'], s => {
    for (const k of ['blurRadius', 'fps', 'format']) if (s[k] != null) settings[k] = s[k];
    if (s.autoProcess != null) settings.autoProcess = s.autoProcess;
});
chrome.storage.onChanged.addListener(c => {
    for (const k of ['blurRadius', 'fps', 'format', 'autoProcess'])
        if (c[k]) settings[k] = c[k].newValue;
});

let pendingVideos = new Map(); // processorTabId -> { videoSource, settings, filename, originTabId, ... }

const claimedUrls = new Set();
const processedUrls = new Set();
function markAsProcessed(url) {
    if (!url) return false;
    if (processedUrls.has(url)) return true;
    processedUrls.add(url);
    setTimeout(() => processedUrls.delete(url), 30000);
    return false;
}

function setBadge(text, color = '#e8ff47') {
    chrome.action.setBadgeText({ text: String(text) });
    chrome.action.setBadgeBackgroundColor({ color });
}
function clearBadge() { chrome.action.setBadgeText({ text: '' }); }

function broadcastState() {
    const stateObj = {};
    for (const [id, data] of pendingVideos.entries()) {
        stateObj[id] = {
            filename: data.filename,
            status: data.status || 'processing',
            pct: data.pct || 0,
            label: data.label || ''
        };
    }
    chrome.runtime.sendMessage({ action: 'STATE_UPDATE', state: stateObj }).catch(() => { });
}
function notifyTab(tabId, msg) {
    if (tabId && tabId > 0) chrome.tabs.sendMessage(tabId, msg).catch(() => { });
}

let videoQueue = [];
let isProcessing = false;

async function processNextInQueue() {
    if (videoQueue.length === 0) {
        isProcessing = false;
        if (pendingVideos.size === 0) clearBadge();
        return;
    }
    isProcessing = true;
    const item = videoQueue.shift();
    await launchProcessor(item.videoSource, item.cleanName, item.originTabId);
}

function enqueueVideo(videoSource, cleanName, originTabId) {
    videoQueue.push({ videoSource, cleanName, originTabId });
    if (!isProcessing) {
        processNextInQueue();
    } else {
        notifyTab(originTabId, { action: 'PROCESSING_PROGRESS', pct: 0, label: 'En cola...' });
        setBadge('⏳', '#ffaa00');
        broadcastState();
    }
}

const TARGET_PAGES = /gemini\.google\.com|labs\.google|aistudio\.google\.com/i;

// ── webRequest: cache original video HTTP URLs before they become blobs ────────
// Keyed by tabId so we can match them to the download that fires shortly after.
// Ring buffer of up to 10 entries per tab, each expires after 60 s.
const recentVideoUrls = new Map(); // tabId -> [{url, timestamp}, ...]

chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.tabId < 0) return;

        // Only care about requests originating from our target pages
        const origin = details.initiator || details.documentUrl || details.originUrl || details.url || '';
        if (!TARGET_PAGES.test(origin)) return;

        const contentType = (details.responseHeaders || [])
            .find(h => h.name.toLowerCase() === 'content-type')?.value || '';

        const isVideoMime = contentType.startsWith('video/');
        const isVideoUrl = /\.(mp4|webm|mov|mkv)(\?|#|$)/i.test(details.url);
        if (!isVideoMime && !isVideoUrl) return;

        const tabId = details.tabId;
        if (!recentVideoUrls.has(tabId)) recentVideoUrls.set(tabId, []);
        const list = recentVideoUrls.get(tabId);
        list.push({ url: details.url, timestamp: Date.now() });
        if (list.length > 10) list.shift();

        console.log('[VeoWR] 📡 Intercepted video URL on tab', tabId, '→', details.url.substring(0, 100));
    },
    {
        urls: [
            '*://*.googleapis.com/*',
            '*://*.google.com/*',
            '*://*.googleusercontent.com/*',
            '*://*.gstatic.com/*'
        ],
        types: ['xmlhttprequest', 'media', 'other']
    },
    ['responseHeaders']
);

chrome.tabs.onRemoved.addListener((tabId) => {
    recentVideoUrls.delete(tabId);
    if (pendingVideos.has(tabId)) {
        console.log('[VeoWR] Processor tab was manually closed.');
        pendingVideos.delete(tabId);
        broadcastState();
        setTimeout(processNextInQueue, 1000);
    }
});

// Pop the most recent (< 60 s old) cached video URL for a tab
function popRecentVideoUrl(tabId) {
    const list = recentVideoUrls.get(tabId);
    if (!list) return null;
    for (let i = list.length - 1; i >= 0; i--) {
        const entry = list[i];
        if (Date.now() - entry.timestamp < 60000) {
            list.splice(i, 1);
            return entry.url;
        }
    }
    return null;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function buildCleanName(fname) {
    let name = (fname || '').replace(/\.[^.]+$/, '') || 'video';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(name)) name = 'veo_video';
    return name;
}

async function launchProcessor(videoSource, cleanName, originTabId) {
    setBadge('⚙', '#e8ff47');
    console.log('[VeoWR] Creating processor tab for:', cleanName);
    const procTab = await chrome.tabs.create({
        url: chrome.runtime.getURL('processor.html'),
        active: true
    });
    pendingVideos.set(procTab.id, {
        videoSource,
        settings: { ...settings },
        filename: cleanName,
        originTabId,
        status: 'processing',
        pct: 3,
        label: __t('bg_opening_processor')
    });
    broadcastState();
}

// ── 1. Detection via downloads.onCreated ──────────────────────────────────────
chrome.downloads.onCreated.addListener(async (item) => {
    console.log('[VeoWR] 🔴 EVENTO onCreated:', item.id, item.filename, item.mime,
        item.url ? item.url.substring(0, 80) : 'no-url');

    if (!settings.autoProcess) { console.log(__t('bg_auto_disabled')); return; }

    const fname = (item.filename || '').replace(/.*[\\\/]/, '');
    const isImageFile = /\.(png|jpg|jpeg|gif|webp|svg)/i.test(fname);
    const isImageMime = item.mime && item.mime.startsWith('image/');

    if (isImageFile || isImageMime) {
        console.log(__t('bg_ignored_image'), fname);
        return;
    }

    const isVideoFile = /\.(mp4|webm|mov|mkv|avi)/i.test(fname);
    const isVideoMime = item.mime && item.mime.startsWith('video/');

    if (!isVideoFile && !isVideoMime) {
        console.log(__t('bg_ignored_not_video'), fname, item.mime);
        return;
    }

    // Origin/Referrer verification — ONLY process if coming from Google
    const itemOrigin = item.url || '';
    const itemReferrer = item.referrer || '';

    // We allow blob:null/ since it's Gemini's sandboxed iframe
    const isFromGoogle = TARGET_PAGES.test(itemOrigin) || TARGET_PAGES.test(itemReferrer) || item.url.startsWith('blob:null/');

    if (!isFromGoogle) {
        console.log(__t('bg_ignored_external'), itemOrigin.substring(0, 50));
        return;
    }

    // Support older 'sin_marca_' strings for backwards-compat during downloads + the dynamic ones
    if (fname.startsWith('sin_marca_') || fname.startsWith('no_watermark_')) {
        console.log(__t('bg_ignored_processed'));
        return;
    }

    const tabs = await chrome.tabs.query({});
    let tabId = null;
    for (const tab of tabs) {
        if (tab.url && TARGET_PAGES.test(tab.url)) { tabId = tab.id; break; }
    }
    if (!tabId) return;

    // ── blob:null/ branch — Gemini sandboxed/worker origin ────────────────────
    if (item.url && item.url.startsWith('blob:null/')) {
        console.log(__t('bg_gemini_detect'));

        try { await chrome.downloads.cancel(item.id); } catch (e) { }
        try { await chrome.downloads.erase({ id: item.id }); } catch (e) { }

        setBadge('⬇', '#e8ff47');
        notifyTab(tabId, { action: 'PROCESSING_PROGRESS', pct: 0, label: __t('bg_fetching_video') });

        // Search all target tabs for a webRequest-cached URL
        let videoUrl = null;
        let actualTabId = tabId;
        for (const tab of tabs) {
            if (!TARGET_PAGES.test(tab.url)) continue;
            const url = popRecentVideoUrl(tab.id);
            if (url) { videoUrl = url; actualTabId = tab.id; break; }
        }

        if (videoUrl) {
            // ✅ Happy path: we have the original HTTP URL
            console.log('[VeoWR] Re-fetching from original URL:', videoUrl.substring(0, 100));
            try {
                notifyTab(actualTabId, { action: 'PROCESSING_PROGRESS', pct: 2, label: __t('bg_downloading_video') });
                enqueueVideo({ url: videoUrl }, __t('prefix_no_watermark') + buildCleanName(fname), actualTabId);
            } catch (err) {
                console.error(__t('bg_error_fetching'), err);
                clearBadge();
                notifyTab(actualTabId, { action: 'PROCESSING_ERROR', error: err.message });
            }
        } else {
            // ⚠️ Fallback: webRequest didn't catch it (e.g. served from SW cache).
            // Ask the content script to try fetching blob:null directly — this can
            // work in Firefox when the CS runs in the same browsing context as the blob.
            console.log(__t('bg_fallback_blob'));
            let found = false;
            for (const tab of tabs) {
                if (!TARGET_PAGES.test(tab.url)) continue;
                try {
                    const resp = await chrome.tabs.sendMessage(tab.id, {
                        action: 'FETCH_CACHED_BLOB',
                        url: item.url
                    });
                    if (resp && resp.ok && resp.videoDataUrl) {
                        console.log('[VeoWR] Content script fetched blob:null on tab', tab.id);
                        enqueueVideo({ dataUrl: resp.videoDataUrl }, __t('prefix_no_watermark') + buildCleanName(fname), tab.id);
                        found = true;
                        break;
                    }
                } catch (e) { /* CS not injectable in this tab */ }
            }
            if (!found) {
                const err = __t('bg_blob_fallback_failed');
                console.error('[VeoWR]', err);
                clearBadge();
                notifyTab(tabId, { action: 'PROCESSING_ERROR', error: err });
            }
        }
        return;
    }

    // ── Normal blob (Flow/labs.google) and direct-URL downloads ───────────────
    if (item.url && claimedUrls.has(item.url)) {
        console.log('[VeoWR] Ignorado: URL reclamada por content.js');
        return;
    }
    if (markAsProcessed(item.url)) {
        console.log('[VeoWR] Ignorado: ya en proceso.');
        return;
    }

    console.log('[VeoWR] Download detected:', fname, item.url.substring(0, 100));

    try { await chrome.downloads.cancel(item.id); } catch (e) { }
    try { await chrome.downloads.erase({ id: item.id }); } catch (e) { }

    setBadge('⬇', '#e8ff47');
    notifyTab(tabId, { action: 'PROCESSING_PROGRESS', pct: 0, label: __t('bg_searching_cache') });

    try {
        let videoSource = null;
        let actualOriginTabId = tabId;

        if (item.url.startsWith('blob:')) {
            console.log('[VeoWR] Requesting FETCH_CACHED_BLOB for', item.url);

            // Try catching HTTP URL first from webRequest (Flow HTTP video)
            let found = false;
            let originalVideoUrl = null;
            for (const tab of tabs) {
                if (!TARGET_PAGES.test(tab.url)) continue;
                const url = popRecentVideoUrl(tab.id);
                if (url) { originalVideoUrl = url; actualOriginTabId = tab.id; break; }
            }

            if (originalVideoUrl) {
                videoSource = { url: originalVideoUrl };
                found = true;
                console.log('[VeoWR] Found original HTTP video for Flow blob:', originalVideoUrl);
            } else {
                for (const tab of tabs) {
                    if (!TARGET_PAGES.test(tab.url)) continue;
                    try {
                        const resp = await chrome.tabs.sendMessage(tab.id, {
                            action: 'FETCH_CACHED_BLOB',
                            url: item.url
                        });
                        if (resp && resp.ok && resp.videoDataUrl) {
                            videoSource = { dataUrl: resp.videoDataUrl };
                            actualOriginTabId = tab.id;
                            found = true;
                            console.log(__t('bg_cache_hit'), tab.id);
                            break;
                        }
                    } catch (e) { }
                }
            }
            if (!found) throw new Error(__t('bg_cache_miss_error'));
        } else {
            videoSource = { url: item.url };
        }

        notifyTab(actualOriginTabId, { action: 'PROCESSING_PROGRESS', pct: 3, label: __t('bg_opening_processor') });
        enqueueVideo(videoSource, __t('prefix_no_watermark') + buildCleanName(fname), actualOriginTabId);

    } catch (err) {
        console.error('[VeoWR] Interception failed:', err);
        clearBadge();
        broadcastState();
        notifyTab(tabId, { action: 'PROCESSING_ERROR', error: err.message });
    }
});

// ── 2. Message handler ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.action === 'OPEN_DASHBOARD_TAB') {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html'), active: true }).catch(() => { });
        return false;
    }

    if (msg.action === 'CLAIM_DOWNLOAD') {
        if (msg.url) { claimedUrls.add(msg.url); setTimeout(() => claimedUrls.delete(msg.url), 15000); }
        return false;
    }

    if (msg.action === 'PROCESS_VIDEO') {
        if (!settings.autoProcess) return false;
        if (msg.url && markAsProcessed(msg.url)) return false;
        (async () => {
            const originTabId = sender.tab ? sender.tab.id : null;
            const cleanName = buildCleanName((msg.filename || '').replace(/.*[\\\/]/, ''));
            enqueueVideo({ dataUrl: msg.videoDataUrl }, cleanName, originTabId);
        })();
        return false;
    }

    if (msg.action === 'GET_VIDEO_BLOB') {
        const procTabId = sender.tab ? sender.tab.id : null;
        if (!procTabId || !pendingVideos.has(procTabId)) { sendResponse({ error: 'No video pending' }); return false; }
        sendResponse(pendingVideos.get(procTabId));
        return false;
    }

    if (msg.action === 'GET_STATE') {
        const stateObj = {};
        for (const [id, data] of pendingVideos.entries())
            stateObj[id] = { filename: data.filename, status: data.status, pct: data.pct, label: data.label };
        sendResponse(stateObj);
        return false;
    }

    if (msg.action === 'PROCESSOR_PROGRESS') {
        const procTabId = sender.tab ? sender.tab.id : null;
        const data = pendingVideos.get(procTabId);
        if (data) { data.pct = msg.pct; data.label = msg.label; data.status = 'processing'; broadcastState(); }
        setBadge(msg.pct + '%', '#e8ff47');
        if (data?.originTabId) notifyTab(data.originTabId, { action: 'PROCESSING_PROGRESS', pct: msg.pct, label: msg.label });
        return false;
    }

    if (msg.action === 'PROCESSOR_DONE') {
        const procTabId = sender.tab ? sender.tab.id : null;
        const data = pendingVideos.get(procTabId);
        if (data?.originTabId) notifyTab(data.originTabId, { action: 'PROCESSING_DONE' });
        if (procTabId) { pendingVideos.delete(procTabId); chrome.tabs.remove(procTabId).catch(() => { }); }
        broadcastState();
        setTimeout(processNextInQueue, 1000);
        return false;
    }

    if (msg.action === 'PROCESSOR_ERROR') {
        const procTabId = sender.tab ? sender.tab.id : null;
        const data = pendingVideos.get(procTabId);
        if (data?.originTabId) notifyTab(data.originTabId, { action: 'PROCESSING_ERROR', error: msg.error });
        if (procTabId) { pendingVideos.delete(procTabId); chrome.tabs.remove(procTabId).catch(() => { }); }
        broadcastState();
        setTimeout(processNextInQueue, 1000);
        return false;
    }

    return false;
});
