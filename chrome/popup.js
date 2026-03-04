// popup.js
'use strict';

const downloadsContainer = document.getElementById('downloadsContainer');
const emptyState = document.getElementById('emptyState');
const autoToggle = document.getElementById('autoToggle');
const optionsLink = document.getElementById('optionsLink');

// Load auto-process setting
chrome.storage.local.get(['autoProcess'], ({ autoProcess }) => {
    autoToggle.checked = autoProcess !== false; // default true
});

// Save auto-process setting on toggle
autoToggle.addEventListener('change', () => {
    chrome.storage.local.set({ autoProcess: autoToggle.checked });
});

// Open options page
optionsLink.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
});

// Initialize i18n
window.initI18n().then(() => {
    window.applyTranslations();

    // Get current state from background
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
        if (state) applyState(state);
    });
});

// Listen for state updates while popup is open
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'STATE_UPDATE') applyState(msg.state);
});

function applyState(stateMap) {
    // stateMap is an object: { "tabId_or_uuid": { status, pct, label, filename }, ... }
    downloadsContainer.innerHTML = '';

    const keys = Object.keys(stateMap || {});
    if (keys.length === 0) {
        downloadsContainer.appendChild(emptyState);
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    for (const key of keys) {
        const item = stateMap[key];

        const row = document.createElement('div');
        row.className = 'status-row';

        const lbl = document.createElement('div');
        lbl.className = 'status-label';
        lbl.textContent = item.filename ? truncateString(item.filename, 25) : 'Video';

        const txt = document.createElement('div');
        txt.className = `status-text ${item.status || 'processing'}`;

        const barFrame = document.createElement('div');
        barFrame.className = 'progress-bar';

        const barFill = document.createElement('div');
        barFill.className = 'progress-fill';

        if (item.status === 'processing') {
            txt.textContent = item.label || __t('toast_processing').replace('...', `... ${item.pct}%`);
            barFill.style.width = (item.pct || 0) + '%';
        } else if (item.status === 'done') {
            txt.textContent = __t('status_done');
            txt.classList.add('idle');
            barFrame.style.display = 'none';
        } else if (item.status === 'error') {
            txt.textContent = __t('error') + (item.error || __t('see_console'));
            barFrame.style.display = 'none';
        }

        row.appendChild(lbl);
        row.appendChild(txt);
        barFrame.appendChild(barFill);
        row.appendChild(barFrame);

        downloadsContainer.appendChild(row);
    }
}

function truncateString(str, num) {
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
}
