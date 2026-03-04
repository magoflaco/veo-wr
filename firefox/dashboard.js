// dashboard.js
'use strict';

const downloadsContainer = document.getElementById('downloadsContainer');
const emptyState = document.getElementById('emptyState');
const optionsLink = document.getElementById('optionsLink');

// Open options page
optionsLink.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
});

// Initialize i18n
initI18n().then(() => {
    applyTranslations();

    // Get current state from background
    browser.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
        if (state) applyState(state);
    });
});

// Listen for state updates
browser.runtime.onMessage.addListener((msg) => {
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

        const card = document.createElement('div');
        card.className = 'card';

        // Header (Filename + Badge)
        const header = document.createElement('div');
        header.className = 'card-header';

        const filename = document.createElement('div');
        filename.className = 'filename';
        filename.textContent = item.filename ? item.filename : 'Video de Veo';

        const badge = document.createElement('div');
        badge.className = `status-badge ${item.status || 'processing'}`;

        if (item.status === 'processing') badge.textContent = __t('badge_processing');
        else if (item.status === 'done') badge.textContent = __t('badge_done');
        else if (item.status === 'error') badge.textContent = __t('badge_error');

        header.appendChild(filename);
        header.appendChild(badge);
        card.appendChild(header);

        // Progress Section
        const progressSection = document.createElement('div');
        progressSection.className = 'progress-section';

        const label = document.createElement('div');
        label.className = `status-message ${item.status || 'processing'}`;

        const barFrame = document.createElement('div');
        barFrame.className = 'progress-bar-bg';

        const barFill = document.createElement('div');
        barFill.className = 'progress-bar-fill';

        if (item.status === 'processing') {
            label.textContent = item.label || __t('toast_processing').replace('...', `... ${item.pct}%`);
            barFill.style.width = (item.pct || 0) + '%';
        } else if (item.status === 'done') {
            label.textContent = __t('status_done');
            barFill.style.width = '100%';
            barFill.style.background = 'var(--ok)';
        } else if (item.status === 'error') {
            label.textContent = __t('error') + (item.error || __t('see_console'));
            barFrame.style.display = 'none';
        }

        barFrame.appendChild(barFill);

        progressSection.appendChild(label);
        if (item.status !== 'error' && item.status !== 'done') {
            progressSection.appendChild(barFrame);
        }

        card.appendChild(progressSection);
        downloadsContainer.appendChild(card);
    }
}
