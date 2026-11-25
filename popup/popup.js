/**
 * YouTube Focus Mode - Popup Controller
 * Connects UI toggles with storage and active YouTube tabs, with Complete Block Mode support.
 */

(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    focusModeEnabled: true,
    completeBlockMode: false,
    directVideoPolicy: 'block', // 'block' | 'allow'
    blockHomeFeed: true,
    blockSearchShorts: true,
    blockSearchShelves: true,
    blockWatchSidebar: true,
    blockWatchEndscreen: true,
    blockWatchAutoplay: true,
    hideComments: false,
    hideDescription: false,
    blockShorts: true,
    hideSidebarShorts: true,
    theme: 'system'
  };

  const elements = {
    masterToggle: document.getElementById('toggle-focus-mode'),
    statusIndicator: document.getElementById('status-indicator'),
    masterStatusText: document.getElementById('master-status-text'),
    masterSubText: document.getElementById('master-sub-text'),
    routeBanner: document.getElementById('route-banner'),
    routeText: document.getElementById('route-text'),

    // Complete Block Mode Elements
    completeBlockCard: document.getElementById('complete-block-card'),
    toggleCompleteBlock: document.getElementById('toggle-complete-block'),
    completeBlockStatusBadge: document.getElementById('complete-block-status-badge'),
    overrideBadge: document.getElementById('override-badge'),
    standardTogglesList: document.getElementById('standard-toggles-list'),
    warningModal: document.getElementById('warning-modal'),
    btnConfirmCompleteBlock: document.getElementById('btn-confirm-complete-block'),
    btnCancelCompleteBlock: document.getElementById('btn-cancel-complete-block'),

    // Standard toggles
    toggleHome: document.getElementById('toggle-home'),
    toggleSearch: document.getElementById('toggle-search'),
    toggleWatchSidebar: document.getElementById('toggle-watch-sidebar'),
    toggleShorts: document.getElementById('toggle-shorts'),
    toggleComments: document.getElementById('toggle-comments'),

    btnOpenOptions: document.getElementById('btn-open-options'),
    linkMoreOptions: document.getElementById('link-more-options')
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  async function init() {
    await loadSettings();
    bindEvents();
    queryActiveTab();
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      const storage = chrome.storage.sync || chrome.storage.local;
      storage.get(DEFAULT_SETTINGS, (stored) => {
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };
        applySettingsToUI(currentSettings);
        resolve();
      });
    });
  }

  function applySettingsToUI(settings) {
    const isMasterEnabled = Boolean(settings.focusModeEnabled);
    const isStrict = isMasterEnabled && Boolean(settings.completeBlockMode);

    elements.masterToggle.checked = isMasterEnabled;
    updateMasterStatusUI(isMasterEnabled);

    // Complete Block Mode UI
    elements.toggleCompleteBlock.checked = Boolean(settings.completeBlockMode);
    elements.toggleCompleteBlock.disabled = !isMasterEnabled;

    if (isStrict) {
      elements.completeBlockCard.classList.add('active');
      elements.completeBlockStatusBadge.textContent = 'COMPLETE BLOCK MODE: ON';
      elements.overrideBadge.classList.add('show');
      elements.standardTogglesList.classList.add('overridden');
    } else {
      elements.completeBlockCard.classList.remove('active');
      elements.completeBlockStatusBadge.textContent = 'COMPLETE BLOCK MODE: OFF';
      elements.overrideBadge.classList.remove('show');
      elements.standardTogglesList.classList.remove('overridden');
    }

    // Standard toggles
    elements.toggleHome.checked = Boolean(settings.blockHomeFeed);
    elements.toggleSearch.checked = Boolean(settings.blockSearchShorts);
    elements.toggleWatchSidebar.checked = Boolean(settings.blockWatchSidebar);
    elements.toggleShorts.checked = Boolean(settings.blockShorts);
    elements.toggleComments.checked = Boolean(settings.hideComments);

    // Disable standard sub-toggles if master switch is off OR if complete block mode is overriding
    const disableSubToggles = !isMasterEnabled || isStrict;
    elements.toggleHome.disabled = disableSubToggles;
    elements.toggleSearch.disabled = disableSubToggles;
    elements.toggleWatchSidebar.disabled = disableSubToggles;
    elements.toggleShorts.disabled = disableSubToggles;
    elements.toggleComments.disabled = disableSubToggles;
  }

  function updateMasterStatusUI(isEnabled) {
    if (isEnabled) {
      elements.statusIndicator.classList.remove('disabled');
      elements.masterStatusText.textContent = 'Focus Mode Active';
      elements.masterSubText.textContent = 'Distraction shields active';
    } else {
      elements.statusIndicator.classList.add('disabled');
      elements.masterStatusText.textContent = 'Focus Mode Paused';
      elements.masterSubText.textContent = 'Standard YouTube recommendations visible';
    }
  }

  function bindEvents() {
    // Master toggle
    elements.masterToggle.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      currentSettings.focusModeEnabled = isEnabled;
      updateMasterStatusUI(isEnabled);
      applySettingsToUI(currentSettings);
      saveSettings();
    });

    // Complete Block Mode toggle with Warning Modal
    elements.toggleCompleteBlock.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Show confirmation warning before enabling
        elements.warningModal.classList.add('open');
      } else {
        // Instantly disable and restore previous granular settings
        currentSettings.completeBlockMode = false;
        applySettingsToUI(currentSettings);
        saveSettings();
      }
    });

    // Warning Modal confirm / cancel buttons
    elements.btnConfirmCompleteBlock.addEventListener('click', () => {
      elements.warningModal.classList.remove('open');
      currentSettings.completeBlockMode = true;
      applySettingsToUI(currentSettings);
      saveSettings();
    });

    elements.btnCancelCompleteBlock.addEventListener('click', () => {
      elements.warningModal.classList.remove('open');
      elements.toggleCompleteBlock.checked = false;
      currentSettings.completeBlockMode = false;
      applySettingsToUI(currentSettings);
    });

    // Standard Sub-toggles
    elements.toggleHome.addEventListener('change', (e) => {
      currentSettings.blockHomeFeed = e.target.checked;
      saveSettings();
    });

    elements.toggleSearch.addEventListener('change', (e) => {
      currentSettings.blockSearchShorts = e.target.checked;
      currentSettings.blockSearchShelves = e.target.checked;
      saveSettings();
    });

    elements.toggleWatchSidebar.addEventListener('change', (e) => {
      currentSettings.blockWatchSidebar = e.target.checked;
      saveSettings();
    });

    elements.toggleShorts.addEventListener('change', (e) => {
      currentSettings.blockShorts = e.target.checked;
      currentSettings.hideSidebarShorts = e.target.checked;
      saveSettings();
    });

    elements.toggleComments.addEventListener('change', (e) => {
      currentSettings.hideComments = e.target.checked;
      saveSettings();
    });

    // Options links
    const openOptions = (e) => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options/options.html'));
      }
    };

    elements.btnOpenOptions.addEventListener('click', openOptions);
    elements.linkMoreOptions.addEventListener('click', openOptions);
  }

  function saveSettings() {
    const storage = chrome.storage.sync || chrome.storage.local;
    storage.set(currentSettings, () => {
      // Notify active tabs of instant update
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'YFM_APPLY_SETTINGS',
            settings: currentSettings
          }).catch(() => {
            // Tab might not be youtube.com, ignore
          });
        }
      });
    });
  }

  function queryActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab || !activeTab.url) {
        elements.routeText.textContent = 'Tab not accessible';
        return;
      }

      try {
        const url = new URL(activeTab.url);
        if (!url.hostname.includes('youtube.com')) {
          elements.routeText.textContent = 'Not on YouTube';
          return;
        }

        chrome.tabs.sendMessage(activeTab.id, { type: 'YFM_GET_PAGE_STATUS' }, (res) => {
          if (chrome.runtime.lastError || !res) {
            const path = url.pathname;
            if (path === '/' || path === '') {
              elements.routeText.textContent = 'Active: Homepage';
            } else if (path === '/results') {
              elements.routeText.textContent = 'Active: Search Results';
            } else if (path === '/watch') {
              elements.routeText.textContent = 'Active: Video Watch Page';
            } else if (path.startsWith('/shorts')) {
              elements.routeText.textContent = 'Active: YouTube Shorts';
            } else if (path.startsWith('/feed')) {
              elements.routeText.textContent = 'Active: YouTube Feed';
            } else {
              elements.routeText.textContent = 'Active on YouTube';
            }
            return;
          }

          const routeLabels = {
            home: 'Active: Homepage',
            search: 'Active: Search Results',
            watch: 'Active: Watch Page',
            shorts: 'Active: YouTube Shorts (Shielded)',
            feed: 'Active: YouTube Feed (Shielded in Strict Mode)',
            channel: 'Active: Channel Page',
            other: 'Active: YouTube'
          };

          elements.routeText.textContent = routeLabels[res.route] || 'Active on YouTube';
        });
      } catch (e) {
        elements.routeText.textContent = 'Active on YouTube';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
