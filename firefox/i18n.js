// i18n.js — Veo WR v3.0 Core Localization
'use strict';

const I18N_DICT = {
    en: {
        // Shared / General
        "video": "Video",
        "error": "Error: ",
        "see_console": "See console",

        // Background logs / logic
        "bg_loaded": "[VeoWR] ========== Background script loaded v3.0 ==========",
        "bg_auto_disabled": "[VeoWR] Auto-process disabled.",
        "bg_ignored_image": "[VeoWR] Ignored: is an image.",
        "bg_ignored_not_video": "[VeoWR] Ignored: not a video file or mime type.",
        "bg_ignored_external": "[VeoWR] Ignored: External domain download detected.",
        "bg_ignored_processed": "[VeoWR] Ignored: already processed.",
        "bg_gemini_detect": "[VeoWR] blob:null detected (Gemini). Cancelling and fetching original URL...",
        "bg_fetching_video": "Fetching video...",
        "bg_downloading_video": "Downloading video...",
        "bg_error_fetching": "[VeoWR] Error re-fetching original URL:",
        "bg_fallback_blob": "[VeoWR] No cached URL found. Trying content script fallback for blob:null...",
        "bg_blob_fallback_failed": "Could not get the video. Reload the Gemini page and try again.",
        "bg_cache_hit": "[VeoWR] Cache hit on tab",
        "bg_cache_miss_error": "Video not found in cache. Try reloading the page.",
        "bg_searching_cache": "Searching video in cache...",
        "bg_opening_processor": "Opening processor...",
        "bg_creating_processor": "[VeoWR] Creating processor tab for:",
        "bg_starting_processor": "Starting processor...",
        "prefix_no_watermark": "no_watermark_",

        // Content Script (Toast UI)
        "toast_title": "🎬 VEO WR",
        "toast_btn_view": "⊞ VIEW",
        "toast_processing": "Processing...",
        "toast_done": "✓ Downloaded without watermark",
        "toast_intercepting": "Intercepting download...",
        "toast_error_buffer": "Error reading buffer",
        "toast_sending": "Sending video to processor...",

        // Dashboard / Popup
        "dash_title": "Veo WR",
        "dash_subtitle": "Dashboard · Active Downloads",
        "dash_empty": "No videos are processing right now.",
        "dash_settings": "Settings",
        "badge_processing": "PROCESSING",
        "badge_done": "COMPLETED",
        "badge_error": "ERROR",
        "status_done": "Video saved successfully!",
        "popup_subtitle": "Watermark Remover",
        "popup_status_label": "Status",

        // Processor
        "proc_loading": "Loading video...",
        "proc_starting": "Starting",
        "proc_warning": "Do not close this tab while the video is processing.",
        "proc_req_video": "Requesting video...",
        "proc_processing": "Processing frames...",
        "proc_frame": "Frame",
        "proc_load_ffmpeg": "Loading FFmpeg...",
        "proc_encoding": "Encoding",
        "proc_write_frames": "Writing frames to FFmpeg...",
        "proc_writing": "Writing",
        "proc_encoding_to": "Encoding to",
        "proc_downloading": "Downloading...",
        "proc_done_step": "✓ Downloading...",
        "proc_completed": "Completed",
        "proc_error_novideo": "No video",
        "proc_error_lbl": "Error",

        // Options
        "opt_title": "Veo WR",
        "opt_sub": "Settings · Watermark Remover",
        "opt_pipeline": "Pipeline",
        "opt_blur_label": "Post-process blur radius",
        "opt_blur_tip": "Controls smoothing over affected pixels. <b>1–3</b> is ideal. <b>0</b> = no blur.",
        "opt_fps_label": "Output FPS",
        "opt_fps_tip": "<b>auto</b> uses 30fps. Adjust based on original video.",
        "opt_format_label": "Output Format",
        "opt_format_mp4": "MP4 (H.264)",
        "opt_format_webm": "WebM (VP9) — no conversion",
        "opt_format_tip": "<b>MP4</b> requires conversion via FFmpeg.wasm (~31MB download first time). <b>WebM</b> is instant.",
        "opt_behavior_title": "Behavior",
        "opt_auto_label": "Auto-process video downloads",
        "opt_auto_tip": "When active, any video download on supported pages is processed automatically. If disabled, videos download normally.",
        "opt_lang_label": "Language / Idioma",
        "opt_lang_auto": "System Default",
        "opt_btn_save": "✓ Save",
        "opt_msg_saved": "✓ Saved!"
    },
    es: {
        // Shared / General
        "video": "Video",
        "error": "Error: ",
        "see_console": "Ver consola",

        // Background logs / logic
        "bg_loaded": "[VeoWR] ========== Background script loaded v3.0 ==========",
        "bg_auto_disabled": "[VeoWR] Auto-process deshabilitado.",
        "bg_ignored_image": "[VeoWR] Ignorado: es una imagen.",
        "bg_ignored_not_video": "[VeoWR] Ignorado: no es archivo ni mime de video.",
        "bg_ignored_external": "[VeoWR] Ignorado: Descarga de dominio externo detectada.",
        "bg_ignored_processed": "[VeoWR] Ignorado: ya procesado.",
        "bg_gemini_detect": "[VeoWR] blob:null detected (Gemini). Cancelling and fetching original URL...",
        "bg_fetching_video": "Obteniendo video...",
        "bg_downloading_video": "Descargando video...",
        "bg_error_fetching": "[VeoWR] Error re-fetching original URL:",
        "bg_fallback_blob": "[VeoWR] No cached URL found. Trying content script fallback for blob:null...",
        "bg_blob_fallback_failed": "No se pudo obtener el video. Recarga la página de Gemini e inténtalo de nuevo.",
        "bg_cache_hit": "[VeoWR] Cache hit on tab",
        "bg_cache_miss_error": "Video no encontrado en caché. Intenta recargar la página.",
        "bg_searching_cache": "Buscando video en caché...",
        "bg_opening_processor": "Abriendo procesador...",
        "bg_creating_processor": "[VeoWR] Creating processor tab for:",
        "bg_starting_processor": "Iniciando procesador...",
        "prefix_no_watermark": "sin_marca_",

        // Content Script (Toast UI)
        "toast_title": "🎬 VEO WR",
        "toast_btn_view": "⊞ VER",
        "toast_processing": "Procesando...",
        "toast_done": "✓ Descargado sin marca de agua",
        "toast_intercepting": "Interceptando descarga...",
        "toast_error_buffer": "Error leyendo buffer",
        "toast_sending": "Enviando video al procesador...",

        // Dashboard / Popup
        "dash_title": "Veo WR",
        "dash_subtitle": "Dashboard · Descargas Activas",
        "dash_empty": "No hay videos procesándose en este momento.",
        "dash_settings": "Configuración",
        "badge_processing": "PROCESANDO",
        "badge_done": "COMPLETADO",
        "badge_error": "ERROR",
        "status_done": "¡Video guardado exitosamente!",
        "popup_subtitle": "Removedor de marcas",
        "popup_status_label": "Estado",

        // Processor
        "proc_loading": "Cargando video...",
        "proc_starting": "Iniciando",
        "proc_warning": "No cierres esta pestaña mientras se procesa el video.",
        "proc_req_video": "Solicitando video...",
        "proc_processing": "Procesando frames...",
        "proc_frame": "Frame",
        "proc_load_ffmpeg": "Cargando FFmpeg...",
        "proc_encoding": "Codificando",
        "proc_write_frames": "Escribiendo frames a FFmpeg...",
        "proc_writing": "Escribiendo",
        "proc_encoding_to": "Codificando a",
        "proc_downloading": "Descargando...",
        "proc_done_step": "✓ Descargando...",
        "proc_completed": "Completado",
        "proc_error_novideo": "No hay video",
        "proc_error_lbl": "Error",

        // Options
        "opt_title": "Veo WR",
        "opt_sub": "Configuración · Watermark Remover",
        "opt_pipeline": "Pipeline",
        "opt_blur_label": "Radio de suavizado post-proceso (blur)",
        "opt_blur_tip": "Controla el suavizado sobre los píxeles afectados. <b>1–3</b> es ideal. <b>0</b> = sin blur.",
        "opt_fps_label": "FPS de salida",
        "opt_fps_tip": "<b>auto</b> usa 30fps. Ajusta según el video original.",
        "opt_format_label": "Formato de salida",
        "opt_format_mp4": "MP4 (H.264)",
        "opt_format_webm": "WebM (VP9) — sin conversión",
        "opt_format_tip": "<b>MP4</b> requiere conversión via FFmpeg.wasm (se descarga ~31MB la primera vez). <b>WebM</b> es instantáneo.",
        "opt_behavior_title": "Comportamiento",
        "opt_auto_label": "Auto-procesar descargas de video",
        "opt_auto_tip": "Cuando está activo, cualquier descarga de video en las páginas soportadas se procesa automáticamente. Si está desactivado, los videos se descargan normalmente.",
        "opt_lang_label": "Idioma / Language",
        "opt_lang_auto": "Mismo que el sistema",
        "opt_btn_save": "✓ Guardar",
        "opt_msg_saved": "✓ Guardado!"
    }
};

let __veoLang = 'en';

// Helper to translate a key
const __t = function (key) {
    if (I18N_DICT[__veoLang] && I18N_DICT[__veoLang][key]) {
        return I18N_DICT[__veoLang][key];
    }
    // Fallback to English
    if (I18N_DICT['en'][key]) {
        return I18N_DICT['en'][key];
    }
    return key;
};

// Applies translations to the DOM
const applyTranslations = function () {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        // if the element is an input value
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = __t(key);
        } else {
            el.innerHTML = __t(key);
        }
    });
};

function determineLanguage(prefLang) {
    if (prefLang === 'es' || prefLang === 'en') {
        return prefLang;
    }
    // Auto detect from navigator
    const sysLang = navigator.language || navigator.userLanguage;
    if (sysLang && sysLang.toLowerCase().startsWith('es')) {
        return 'es';
    }
    return 'en';
}

// Initialize Language synchronously for content scripts / isolated contexts that might need it right away, 
// but also fetch the actual preference asynchronously.
const initI18n = async function () {
    return new Promise(resolve => {
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            browser.storage.local.get(['lang'], result => {
                __veoLang = determineLanguage(result.lang);
                if (typeof document !== 'undefined' && document.documentElement) {
                    document.documentElement.lang = __veoLang;
                }
                resolve(__veoLang);
            });
        } else {
            __veoLang = determineLanguage('auto');
            resolve(__veoLang);
        }
    });
};

// Make sure to load the language as soon as possible
if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
    browser.storage.local.get(['lang'], result => {
        __veoLang = determineLanguage(result.lang);
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = __veoLang;
        }
    });

    // Listen for runtime language changes from settings
    if (browser.runtime && browser.runtime.onMessage) {
        browser.runtime.onMessage.addListener(msg => {
            if (msg.action === 'LANGUAGE_CHANGED') {
                __veoLang = determineLanguage(msg.lang);
                if (typeof applyTranslations === 'function' && typeof document !== 'undefined') {
                    applyTranslations();
                }
                if (typeof document !== 'undefined' && document.documentElement) {
                    document.documentElement.lang = __veoLang;
                }
            }
        });
    }
}

// Ensure global scope linkage for modules dynamically
if (typeof window !== 'undefined') {
    window.__veoLang = __veoLang;
    window.__t = __t;
    window.initI18n = initI18n;
    window.applyTranslations = applyTranslations;
} else if (typeof globalThis !== 'undefined') {
    globalThis.__veoLang = __veoLang;
    globalThis.__t = __t;
    globalThis.initI18n = initI18n;
    globalThis.applyTranslations = applyTranslations;
}
