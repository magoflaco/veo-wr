// inject.js — Veo WR v3.0 Main World Execution
(function () {
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

    URL.createObjectURL = function (obj) {
        const url = _createObjectURL.apply(this, arguments);
        if (obj instanceof Blob) {
            if (obj.type.startsWith('video/') || obj.size > 100000) {
                blobCache.set(url, obj);
                console.log('[VeoWR Inject] Cached Blob:', url.substring(0, 50));
                if (blobCache.size > 50) blobCache.delete(Array.from(blobCache.keys())[0]);
            }
        }
        return url;
    };

    const _aClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
        const isImage = this.download && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(this.download);
        if (window.__veoWRAutoProcess && !isImage && this.download && this.href && this.href.startsWith('blob:')) {
            console.log('[VeoWR Inject] Intercepted a.click() ->', this.download);
            window.postMessage({ type: 'VEO_WR_DOWNLOAD', url: this.href, filename: this.download }, '*');
            return;
        }
        return _aClick.apply(this, arguments);
    };

    window.addEventListener('message', async (e) => {
        if (e.source !== window || !e.data || e.data.type !== 'VEO_WR_REQUEST') return;

        const id = e.data.id;
        const url = e.data.url;

        try {
            let blob;
            if (blobCache.has(url)) {
                console.log('[VeoWR Inject] Cache HIT for', url);
                blob = blobCache.get(url);
            } else {
                console.log('[VeoWR Inject] Cache MISS. Trying direct fetch...');
                const resp = await fetch(url);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                blob = await resp.blob();
            }

            const reader = new FileReader();
            reader.onload = () => {
                window.postMessage({ type: 'VEO_WR_RESPONSE', id: id, ok: true, dataUrl: reader.result }, '*');
            };
            reader.onerror = () => {
                console.error('[VeoWR Inject] FileReader failed');
                window.postMessage({ type: 'VEO_WR_RESPONSE', id: id, ok: false }, '*');
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('[VeoWR Inject] Read failed:', err);
            window.postMessage({ type: 'VEO_WR_RESPONSE', id: id, ok: false }, '*');
        }
    });

    console.log('[VeoWR] Page-context interceptor installed natively via MAIN world.');
})();
