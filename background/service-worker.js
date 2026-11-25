/**
 * YouTube Focus Mode - Background Service Worker
 * Handles installation defaults, storage migration, and icon/badge updates.
 */

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

// Set initial storage defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const storage = chrome.storage.sync || chrome.storage.local;

  storage.get(null, (existing) => {
    const toSave = {};
    for (const key in DEFAULT_SETTINGS) {
      if (existing[key] === undefined) {
        toSave[key] = DEFAULT_SETTINGS[key];
      }
    }

    if (Object.keys(toSave).length > 0) {
      storage.set(toSave, () => {
        console.log('[YouTube Focus Mode] Initialized default settings:', toSave);
      });
    }

    updateBadge(existing.focusModeEnabled ?? DEFAULT_SETTINGS.focusModeEnabled);
  });
});

// Update badge when focus mode or complete block mode changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (changes.focusModeEnabled || changes.completeBlockMode) {
    const storage = chrome.storage.sync || chrome.storage.local;
    storage.get(['focusModeEnabled', 'completeBlockMode'], (data) => {
      updateBadge(data.focusModeEnabled ?? DEFAULT_SETTINGS.focusModeEnabled, data.completeBlockMode ?? DEFAULT_SETTINGS.completeBlockMode);
    });
  }
});

function updateBadge(isEnabled, isCompleteBlock) {
  if (!isEnabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748B' }); // Slate gray
  } else if (isCompleteBlock) {
    chrome.action.setBadgeText({ text: 'STRICT' });
    chrome.action.setBadgeBackgroundColor({ color: '#DC2626' }); // Red for strict mode
  } else {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' }); // Vibrant Indigo
  }
}

// Initial badge check on service worker wake
chrome.storage.sync?.get(['focusModeEnabled', 'completeBlockMode'], (data) => {
  if (data) {
    updateBadge(data.focusModeEnabled ?? DEFAULT_SETTINGS.focusModeEnabled, data.completeBlockMode ?? DEFAULT_SETTINGS.completeBlockMode);
  }
});
