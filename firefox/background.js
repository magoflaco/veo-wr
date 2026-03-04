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

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        browser.tabs.create({ url: 'https://veowr.pages.dev/' }).catch(() => { });
    }
});

let settings = { blurRadius: 2, fps: -1, format: 'mp4', autoProcess: true };
browser.storage.local.get(['blurRadius', 'fps', 'format', 'autoProcess'], s => {
    for (const k of ['blurRadius', 'fps', 'format']) if (s[k] != null) settings[k] = s[k];
    if (s.autoProcess != null) settings.autoProcess = s.autoProcess;
});
browser.storage.onChanged.addListener(c => {
    for (const k of ['blurRadius', 'fps', 'format', 'autoProcess'])
        if (c[k]) settings[k] = c[k].newValue;
});

let pendingVideos = new Map(); // processorTabId -> { videoData, settings, filename, originTabId, ... }

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
    browser.browserAction.setBadgeText({ text: String(text) });
    browser.browserAction.setBadgeBackgroundColor({ color });
}
function clearBadge() { browser.browserAction.setBadgeText({ text: '' }); }

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
    browser.runtime.sendMessage({ action: 'STATE_UPDATE', state: stateObj }).catch(() => { });
}
function notifyTab(tabId, msg) {
    if (tabId && tabId > 0) browser.tabs.sendMessage(tabId, msg).catch(() => { });
}

const TARGET_PAGES = /gemini\.google\.com|labs\.google|aistudio\.google\.com/i;

// ── webRequest: cache original video HTTP URLs before they become blobs ────────
// Keyed by tabId so we can match them to the download that fires shortly after.
// Ring buffer of up to 10 entries per tab, each expires after 60 s.
const recentVideoUrls = new Map(); // tabId -> [{url, timestamp}, ...]

browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.tabId < 0) return;

        // Only care about requests originating from our target pages
        const origin = details.documentUrl || details.originUrl || '';
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

browser.tabs.onRemoved.addListener((tabId) => { recentVideoUrls.delete(tabId); });

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

async function launchProcessor(videoData, cleanName, originTabId) {
    setBadge('⚙', '#e8ff47');
    console.log('[VeoWR] Creating processor tab for:', cleanName);
    const procTab = await browser.tabs.create({
        url: browser.runtime.getURL('processor.html'),
        active: false
    });
    pendingVideos.set(procTab.id, {
        videoData,
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
browser.downloads.onCreated.addListener(async (item) => {
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

    const tabs = await browser.tabs.query({});
    let tabId = null;
    for (const tab of tabs) {
        if (tab.url && TARGET_PAGES.test(tab.url)) { tabId = tab.id; break; }
    }
    if (!tabId) return;

    // ── blob:null/ branch — Gemini sandboxed/worker origin ────────────────────
    if (item.url && item.url.startsWith('blob:null/')) {
        console.log(__t('bg_gemini_detect'));

        try { await browser.downloads.cancel(item.id); } catch (e) { }
        try { await browser.downloads.erase({ id: item.id }); } catch (e) { }

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
                const resp = await fetch(videoUrl);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const videoData = await resp.arrayBuffer();
                await launchProcessor(videoData, __t('prefix_no_watermark') + buildCleanName(fname), actualTabId);
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
                    const resp = await browser.tabs.sendMessage(tab.id, {
                        action: 'FETCH_CACHED_BLOB',
                        url: item.url
                    });
                    if (resp && resp.ok && resp.videoData) {
                        console.log('[VeoWR] Content script fetched blob:null on tab', tab.id);
                        await launchProcessor(resp.videoData, __t('prefix_no_watermark') + buildCleanName(fname), tab.id);
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

    try { await browser.downloads.cancel(item.id); } catch (e) { }
    try { await browser.downloads.erase({ id: item.id }); } catch (e) { }

    setBadge('⬇', '#e8ff47');
    notifyTab(tabId, { action: 'PROCESSING_PROGRESS', pct: 0, label: __t('bg_searching_cache') });

    try {
        let videoData = null;
        let actualOriginTabId = tabId;

        if (item.url.startsWith('blob:')) {
            console.log('[VeoWR] Requesting FETCH_CACHED_BLOB for', item.url);
            let found = false;
            for (const tab of tabs) {
                if (!TARGET_PAGES.test(tab.url)) continue;
                try {
                    const resp = await browser.tabs.sendMessage(tab.id, {
                        action: 'FETCH_CACHED_BLOB',
                        url: item.url
                    });
                    if (resp && resp.ok && resp.videoData) {
                        videoData = resp.videoData;
                        actualOriginTabId = tab.id;
                        found = true;
                        console.log(__t('bg_cache_hit'), tab.id);
                        break;
                    }
                } catch (e) { }
            }
            if (!found) throw new Error(__t('bg_cache_miss_error'));
        } else {
            const resp = await fetch(item.url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            videoData = await resp.arrayBuffer();
        }

        notifyTab(actualOriginTabId, { action: 'PROCESSING_PROGRESS', pct: 3, label: __t('bg_opening_processor') });
        await launchProcessor(videoData, __t('prefix_no_watermark') + buildCleanName(fname), actualOriginTabId);

    } catch (err) {
        console.error('[VeoWR] Interception failed:', err);
        clearBadge();
        broadcastState();
        notifyTab(tabId, { action: 'PROCESSING_ERROR', error: err.message });
    }
});

// ── 2. Message handler ────────────────────────────────────────────────────────
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.action === 'OPEN_DASHBOARD_TAB') {
        browser.tabs.create({ url: browser.runtime.getURL('dashboard.html'), active: true }).catch(() => { });
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
            await launchProcessor(msg.videoData, cleanName, originTabId);
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
        if (procTabId) { pendingVideos.delete(procTabId); browser.tabs.remove(procTabId).catch(() => { }); }
        if (pendingVideos.size === 0) clearBadge();
        broadcastState();
        return false;
    }

    if (msg.action === 'PROCESSOR_ERROR') {
        const procTabId = sender.tab ? sender.tab.id : null;
        const data = pendingVideos.get(procTabId);
        if (data?.originTabId) notifyTab(data.originTabId, { action: 'PROCESSING_ERROR', error: msg.error });
        if (procTabId) { pendingVideos.delete(procTabId); browser.tabs.remove(procTabId).catch(() => { }); }
        if (pendingVideos.size === 0) clearBadge();
        broadcastState();
        return false;
    }

    return false;
});
