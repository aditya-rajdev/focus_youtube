/**
 * YouTube Focus Mode - Options Page Controller
 * Manages full configuration, persistence, real-time feedback, and reset actions.
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

  const settingMap = {
    'opt-master-toggle': 'focusModeEnabled',
    'opt-complete-block': 'completeBlockMode',
    'opt-block-home': 'blockHomeFeed',
    'opt-block-search-shorts': 'blockSearchShorts',
    'opt-block-search-shelves': 'blockSearchShelves',
    'opt-block-watch-sidebar': 'blockWatchSidebar',
    'opt-block-watch-endscreen': 'blockWatchEndscreen',
    'opt-block-watch-autoplay': 'blockWatchAutoplay',
    'opt-hide-comments': 'hideComments',
    'opt-hide-description': 'hideDescription',
    'opt-block-shorts': 'blockShorts',
    'opt-hide-sidebar-shorts': 'hideSidebarShorts'
  };

  let toastTimer = null;

  async function init() {
    await loadSettings();
    bindEvents();
    setupNavScrollSpy();
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      const storage = chrome.storage.sync || chrome.storage.local;
      storage.get(DEFAULT_SETTINGS, (stored) => {
        const settings = { ...DEFAULT_SETTINGS, ...stored };
        applyToInputs(settings);
        resolve();
      });
    });
  }

  function applyToInputs(settings) {
    for (const [elementId, key] of Object.entries(settingMap)) {
      const input = document.getElementById(elementId);
      if (input && input.type === 'checkbox') {
        input.checked = Boolean(settings[key]);
      }
    }

    const policySelect = document.getElementById('opt-direct-video-policy');
    if (policySelect) {
      policySelect.value = settings.directVideoPolicy || 'block';
    }
  }

  function bindEvents() {
    // Attach change listener to all setting checkboxes
    for (const [elementId, key] of Object.entries(settingMap)) {
      const input = document.getElementById(elementId);
      if (input) {
        input.addEventListener('change', (e) => {
          saveSetting(key, e.target.checked);
        });
      }
    }

    // Direct video policy dropdown
    const policySelect = document.getElementById('opt-direct-video-policy');
    if (policySelect) {
      policySelect.addEventListener('change', (e) => {
        saveSetting('directVideoPolicy', e.target.value);
      });
    }

    // Reset to defaults button
    const btnReset = document.getElementById('btn-reset-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset all YouTube Focus Mode settings to their default values?')) {
          resetDefaults();
        }
      });
    }
  }

  function saveSetting(key, value) {
    const storage = chrome.storage.sync || chrome.storage.local;
    const payload = { [key]: value };

    storage.set(payload, () => {
      showToast('Setting saved');
      notifyYouTubeTabs(payload);
    });
  }

  function resetDefaults() {
    const storage = chrome.storage.sync || chrome.storage.local;
    storage.set(DEFAULT_SETTINGS, () => {
      applyToInputs(DEFAULT_SETTINGS);
      showToast('All settings reset to defaults');
      notifyYouTubeTabs(DEFAULT_SETTINGS);
    });
  }

  function notifyYouTubeTabs(updatedSettings) {
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      if (!tabs) return;
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'YFM_APPLY_SETTINGS',
          settings: updatedSettings
        }).catch(() => {
          // Tab may not have injected content script yet
        });
      });
    });
  }

  function showToast(message) {
    const toast = document.getElementById('save-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function setupNavScrollSpy() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.settings-section');

    window.addEventListener('scroll', () => {
      let currentSection = '';
      const scrollPos = window.scrollY + 100;

      sections.forEach((section) => {
        if (section.offsetTop <= scrollPos) {
          currentSection = section.getAttribute('id');
        }
      });

      navItems.forEach((item) => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${currentSection}`) {
          item.classList.add('active');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
