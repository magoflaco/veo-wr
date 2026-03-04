// options.js
'use strict';

const blurSlider = document.getElementById('blurRadius');
const blurVal = document.getElementById('blurVal');
const fpsSlider = document.getElementById('fps');
const fpsVal = document.getElementById('fpsVal');
const formatSel = document.getElementById('format');
const autoCheck = document.getElementById('autoProcess');
const langSel = document.getElementById('langSelect');
const saveBtn = document.getElementById('saveBtn');
const savedMsg = document.getElementById('savedMsg');

// Initialize I18n and UI
initI18n().then(() => {
    applyTranslations();

    // Load stored settings
    chrome.storage.local.get(['blurRadius', 'fps', 'format', 'autoProcess', 'lang'], (stored) => {
        blurSlider.value = stored.blurRadius ?? 2;
        blurVal.textContent = blurSlider.value + 'px';

        fpsSlider.value = stored.fps ?? -1;
        fpsVal.textContent = fpsSlider.value == -1 ? __t('opt_fps_label').split(' ')[0] || 'auto' : fpsSlider.value + ' fps'; // Quick hack for 'auto'

        formatSel.value = stored.format ?? 'mp4';
        autoCheck.checked = stored.autoProcess !== false;
        if (stored.lang) {
            langSel.value = stored.lang;
        }
    });
});

// Live preview of slider values
blurSlider.addEventListener('input', () => {
    blurVal.textContent = blurSlider.value + 'px';
});

fpsSlider.addEventListener('input', () => {
    fpsVal.textContent = fpsSlider.value == -1 ? 'auto' : fpsSlider.value + ' fps';
});

// Save settings
saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({
        blurRadius: parseFloat(blurSlider.value),
        fps: parseInt(fpsSlider.value),
        format: formatSel.value,
        autoProcess: autoCheck.checked,
        lang: langSel.value
    }, () => {
        // Broadcast the language change immediately so other layers like Background and Dashboard update LIVE
        chrome.runtime.sendMessage({ action: 'LANGUAGE_CHANGED', lang: langSel.value }).catch(() => { });
        window.postMessage({ type: 'VEO_WR_UPDATE_LANG', value: langSel.value }, '*');

        // Re-apply in this very tab
        initI18n().then(() => applyTranslations());

        savedMsg.classList.add('visible');
        setTimeout(() => savedMsg.classList.remove('visible'), 2500);
    });
});
