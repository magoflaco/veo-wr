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
  browser.storage.local.get(['autoProcess'], s => {
    autoProcess = s.autoProcess !== false;
    window.postMessage({ type: 'VEO_WR_UPDATE_AUTOPROCESS', value: autoProcess }, '*');
  });
  browser.storage.onChanged.addListener(c => {
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
        browser.runtime.sendMessage({ action: 'OPEN_DASHBOARD_TAB' }).catch(() => { });
      });

      header.appendChild(label);
      header.appendChild(btn);

      badge._label = label;
      badge._btn = btn;

      badge._body = document.createElement('div');
      badge._body.style.cssText = 'font-size:11px;line-height:1.5';

      badge.appendChild(header);
      badge.appendChild(badge._body);
      document.body.appendChild(badge);
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

  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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

      // We return a Promise to keep the sendResponse channel open
      return new Promise((resolve) => {
        // Set a timeout just in case it's not our tab
        const timeout = setTimeout(() => {
          pendingRequests.delete(id);
          resolve({ ok: false, error: 'Timeout' });
        }, 3000);

        // Save the resolver map
        pendingRequests.set(id, { resolve, timeout });

        // Ask the injected script
        window.postMessage({
          type: 'VEO_WR_REQUEST',
          id: id,
          url: msg.url
        }, '*');
      });
    }
  });

  // ── Page-Context Injector ───────────────────────────────────────────
  const pageScript = `
    (function() {
      if (window.__veoInterceptInstalled) return;
      window.__veoInterceptInstalled = true;

      const _createObjectURL = URL.createObjectURL;
      const blobCache = new Map();
      window.__veoWRAutoProcess = true;
      
      window.addEventListener('message', (e) => {
        if (e.source !== window || !e.data) return;
        if (e.data.type === 'VEO_WR_UPDATE_AUTOPROCESS') {
           window.__veoWRAutoProcess = e.data.value;
        }
      });
      
      URL.createObjectURL = function(obj) {
        const url = _createObjectURL.apply(this, arguments);
        if (obj instanceof Blob) {
          // If it's a video, or large enough to reasonably be a video
          if (obj.type.startsWith('video/') || obj.size > 100000) {
            blobCache.set(url, obj);
            console.log('[VeoWR Inject] Cached Blob:', url.substring(0, 50));
            if (blobCache.size > 50) blobCache.delete(Array.from(blobCache.keys())[0]);
          }
        }
        return url;
      };

      const _aClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        const isImage = this.download && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(this.download);
        if (window.__veoWRAutoProcess && !isImage && this.download && this.href && this.href.startsWith('blob:')) {
            console.log('[VeoWR Inject] Intercepted a.click() ->', this.download);
            window.postMessage({ type: 'VEO_WR_DOWNLOAD', url: this.href, filename: this.download }, '*');
            return; 
        }
        return _aClick.apply(this, arguments);
      };

      // Also listen for fetch requests just in case the app doesn't use createObjectURL
      // (Gemini and Flow DO use createObjectURL though)
      
      // Listen for requests FROM the content script
      window.addEventListener('message', async (e) => {
        if (e.source !== window || !e.data || e.data.type !== 'VEO_WR_REQUEST') return;
        
        const id = e.data.id;
        const url = e.data.url;
        
        try {
          let buffer;
          if (blobCache.has(url)) {
            console.log('[VeoWR Inject] Cache HIT for', url);
            buffer = await blobCache.get(url).arrayBuffer();
          } else {
            console.log('[VeoWR Inject] Cache MISS. Trying direct fetch...');
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            buffer = await (await resp.blob()).arrayBuffer();
          }

          window.postMessage({ type: 'VEO_WR_RESPONSE', id: id, ok: true, data: buffer }, '*');
        } catch (err) {
          console.error('[VeoWR Inject] Read failed:', err);
          window.postMessage({ type: 'VEO_WR_RESPONSE', id: id, ok: false }, '*');
        }
      });
      
      console.log('[VeoWR] Page-context interceptor installed.');
    })();
  `;

  const scriptTag = document.createElement('script');
  scriptTag.textContent = pageScript;
  (document.head || document.documentElement).appendChild(scriptTag);
  scriptTag.remove();

  // ── Receive messages FROM the injected script ───────────────────────
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data) return;

    if (e.data.type === 'VEO_WR_DOWNLOAD') {
      showBadge(__t('toast_intercepting'), '#e8ff47');
      const id = ++msgIdCounter;
      const downloadUrl = e.data.url;
      pendingRequests.set(id, {
        resolve: (res) => {
          if (res.ok) {
            browser.runtime.sendMessage({ action: 'PROCESS_VIDEO', videoData: res.videoData, filename: e.data.filename, url: downloadUrl });
          } else {
            showBadge(__t('toast_error_buffer'), '#ff6060');
          }
        },
        timeout: setTimeout(() => pendingRequests.delete(id), 5000)
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
          resolve({ ok: true, videoData: e.data.data }); // arrayBuffer natively supported in sendResponse across contexts
        } else {
          resolve({ ok: false });
        }
      }
    }
  });

})();
