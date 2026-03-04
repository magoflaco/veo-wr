// content.js — Veo WR v2.6 (Hybrid Interception)
// Injects interceptor into page to hijack URL.createObjectURL, keeping references
// to raw video blobs. When background detects a download for a blob url, it asks
// us for the actual data.
'use strict';

(async function () {
  if (window.__veoWRInjected) return;
  window.__veoWRInjected = true;

  await initI18n();

  console.log('[VeoWR] Content script loaded v3.0');

  let autoProcess = true;
  chrome.storage.local.get(['autoProcess'], s => {
    autoProcess = s.autoProcess !== false;
    window.postMessage({ type: 'VEO_WR_UPDATE_AUTOPROCESS', value: autoProcess }, '*');
  });
  chrome.storage.onChanged.addListener(c => {
    if (c.autoProcess) {
      autoProcess = c.autoProcess.newValue;
      window.postMessage({ type: 'VEO_WR_UPDATE_AUTOPROCESS', value: autoProcess }, '*');
    }
    if (c.lang) {
      initI18n().then(() => {
        if (badge && badge._label) badge._label.textContent = __t('toast_title');
        if (badge && badge._btn) badge._btn.textContent = __t('toast_btn_view');
      });
    }
  });

  // ── Toast UI ────────────────────────────────────────────────────────
  let badge = null, hideTimer = null;
  function showBadge(msg, color = '#e8ff47') {
    if (!badge) {
      badge = document.createElement('div');
      badge.style.cssText = [
        'position:fixed',
        'bottom:24px',
        'right:24px',
        'z-index:2147483647',
        'background:#0d0d0d',
        'border:1px solid #2a2a2a',
        'border-radius:8px',
        'box-shadow:0 4px 32px rgba(0,0,0,.8)',
        'font-family:monospace',
        'font-size:12px',
        'padding:10px 14px 10px 14px',
        'max-width:300px',
        'transition:opacity .3s',
        'pointer-events:auto',
      ].join(';');

      // Header row: label + popup button
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:10px';

      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#444;white-space:nowrap';
      label.textContent = __t('toast_title');

      // Yellow popup-opener button
      const btn = document.createElement('button');
      btn.title = 'Ver progreso';
      btn.style.cssText = [
        'background:#e8ff47',
        'color:#000',
        'border:none',
        'border-radius:4px',
        'font-family:monospace',
        'font-size:9px',
        'font-weight:bold',
        'letter-spacing:.1em',
        'text-transform:uppercase',
        'padding:3px 7px',
        'cursor:pointer',
        'line-height:1.4',
        'flex-shrink:0',
        'transition:opacity .15s',
      ].join(';');
      btn.textContent = __t('toast_btn_view');
      btn.addEventListener('mouseenter', () => { btn.style.opacity = '.75'; });
      btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD_TAB' }).catch(() => { });
      });

      header.appendChild(label);
      header.appendChild(btn);

      badge._label = label;
      badge._btn = btn;

      badge._body = document.createElement('div');
      badge._body.style.cssText = 'font-size:11px;line-height:1.5';

      badge.appendChild(header);
      badge.appendChild(badge._body);
      (document.body || document.documentElement).appendChild(badge);
    }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    badge._body.style.color = color;
    badge._body.textContent = msg;
    badge.style.opacity = '1';
  }
  function hideBadge(ms = 3000) { hideTimer = setTimeout(() => { if (badge) badge.style.opacity = '0'; }, ms); }

  // ── Listen for background progress AND blob requests ────────────────
  const pendingRequests = new Map();
  let msgIdCounter = 0;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'PROCESSING_PROGRESS') {
      showBadge(`${msg.label || __t('toast_processing')} ${msg.pct > 0 ? msg.pct + '%' : ''}`.trim());
    } else if (msg.action === 'PROCESSING_DONE') {
      showBadge(__t('toast_done'), '#47ffaa'); hideBadge(4000);
    } else if (msg.action === 'PROCESSING_ERROR') {
      showBadge(__t('error') + (msg.error || 'unknown'), '#ff6060'); hideBadge(6000);
    }

    // Background detected a download and needs the raw blob data for this URL
    else if (msg.action === 'FETCH_CACHED_BLOB') {
      console.log('[VeoWR] Background requested blob for:', msg.url);

      const id = ++msgIdCounter;

      // We return true to keep the sendResponse channel open in Chrome natively
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        sendResponse({ ok: false, error: 'Timeout' });
      }, 60000);

      // Save the resolver map pointing directly to sendResponse
      pendingRequests.set(id, { resolve: sendResponse, timeout });

      // Ask the injected script
      window.postMessage({
        type: 'VEO_WR_REQUEST',
        id: id,
        url: msg.url
      }, '*');

      return true;
    }
  });

  // ── Receive messages FROM the injected script (inject.js) ────────────
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data) return;

    if (e.data.type === 'VEO_WR_DOWNLOAD') {
      showBadge(__t('toast_intercepting'), '#e8ff47');
      const id = ++msgIdCounter;
      const downloadUrl = e.data.url;
      pendingRequests.set(id, {
        resolve: (res) => {
          if (res.ok) {
            chrome.runtime.sendMessage({ action: 'PROCESS_VIDEO', videoDataUrl: res.videoDataUrl, filename: e.data.filename, url: downloadUrl });
          } else {
            showBadge(__t('toast_error_buffer'), '#ff6060');
          }
        },
        timeout: setTimeout(() => pendingRequests.delete(id), 60000)
      });
      window.postMessage({ type: 'VEO_WR_REQUEST', id: id, url: downloadUrl }, '*');
      return;
    }

    if (e.data.type === 'VEO_WR_RESPONSE') {
      const id = e.data.id;
      if (pendingRequests.has(id)) {
        const { resolve, timeout } = pendingRequests.get(id);
        clearTimeout(timeout);
        pendingRequests.delete(id);

        if (e.data.ok) {
          showBadge(__t('toast_sending'), '#e8ff47');
          resolve({ ok: true, videoDataUrl: e.data.dataUrl });
        } else {
          resolve({ ok: false });
        }
      }
    }
  });

})();
