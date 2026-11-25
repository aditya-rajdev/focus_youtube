/**
 * YouTube Focus Mode - Content Script Coordinator
 * Entry point that wires the detector, blocker, observer, and page handler together.
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

  class ContentCoordinator {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.detector = new window.YFM_YouTubeDetector();
      this.blocker = new window.YFM_Blocker();
      this.pageHandler = new window.YFM_PageHandler(this.detector);
      this.observer = new window.YFM_DOMObserver(() => this.handleDomMutation());

      this.init();
    }

    async init() {
      // 1. Optimistically apply defaults at document_start to prevent content flash
      const initialRoute = this.detector.detectRoute();
      this.blocker.applyAttributes(this.settings, initialRoute);

      // 2. Load persisted settings from storage
      await this.loadSettings();

      // 3. Track search result video clicks
      this.setupSearchClickTracking();

      // 4. Apply stored settings and initialize page state
      this.updateState(initialRoute);

      // 5. Hook up route change detection
      this.detector.onRouteChange((newRoute, oldRoute, url) => {
        // If navigating from search to watch, mark video as search initiated
        if (oldRoute === 'search' && newRoute === 'watch') {
          const videoId = this.detector.getVideoId(url);
          if (videoId) {
            this.detector.markSearchVideo(videoId);
          }
        }
        this.updateState(newRoute);
      });

      // 5. Start DOM mutation observer
      this.observer.start();

      // 6. Listen for settings updates across tabs and from popup
      this.setupStorageAndMessageListeners();

      // 7. Initial scan once DOM is interactive / loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.blocker.scanAndTag(document);
          this.pageHandler.handleRouteChange(this.detector.detectRoute());
        });
      } else {
        this.blocker.scanAndTag(document);
        this.pageHandler.handleRouteChange(this.detector.detectRoute());
      }
    }

    async loadSettings() {
      return new Promise((resolve) => {
        const storage = chrome.storage.sync || chrome.storage.local;
        storage.get(DEFAULT_SETTINGS, (stored) => {
          if (chrome.runtime.lastError) {
            console.warn('[YouTube Focus Mode] Storage get error, using defaults:', chrome.runtime.lastError);
            resolve();
            return;
          }
          this.settings = { ...DEFAULT_SETTINGS, ...stored };
          resolve();
        });
      });
    }

    setupSearchClickTracking() {
      // Capture clicks on video links while on search page
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="/watch?v="]');
        if (link) {
          try {
            const url = new URL(link.href, window.location.origin);
            const videoId = url.searchParams.get('v');
            if (videoId) {
              const currentRoute = this.detector.detectRoute();
              if (currentRoute === 'search') {
                this.detector.markSearchVideo(videoId);
              }
            }
          } catch (err) {
            // ignore
          }
        }
      }, true);
    }

    updateState(route) {
      this.blocker.applyAttributes(this.settings, route);
      this.pageHandler.setSettings(this.settings);
      this.pageHandler.handleRouteChange(route);
      this.blocker.scanAndTag(document);
    }

    handleDomMutation() {
      this.blocker.scanAndTag(document);

      const route = this.detector.detectRoute();
      if (route === 'home') {
        this.pageHandler.removeLegacyHomeBanner();
      } else if (route === 'shorts' && this.settings.focusModeEnabled && (this.settings.blockShorts || this.settings.completeBlockMode)) {
        this.pageHandler.ensureShortsBlockerOverlay();
      } else if (route === 'watch') {
        if (this.settings.completeBlockMode) {
          this.pageHandler.checkDirectVideoPolicy();
        }
        this.pageHandler.setupVideoEndedHandler(this.settings.completeBlockMode);
      }
    }

    setupStorageAndMessageListeners() {
      // Listen for Chrome Storage changes (syncs options and popup in real-time)
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' || areaName === 'local') {
          let hasRelevantChange = false;
          for (const key in changes) {
            if (key in this.settings) {
              this.settings[key] = changes[key].newValue;
              hasRelevantChange = true;
            }
          }

          if (hasRelevantChange) {
            const currentRoute = this.detector.detectRoute();
            this.updateState(currentRoute);
          }
        }
      });

      // Listen for direct messages from extension popup or background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type === 'YFM_GET_PAGE_STATUS') {
          sendResponse({
            success: true,
            route: this.detector.detectRoute(),
            url: window.location.href,
            settings: this.settings
          });
          return true;
        }

        if (message?.type === 'YFM_APPLY_SETTINGS') {
          this.settings = { ...this.settings, ...message.settings };
          const currentRoute = this.detector.detectRoute();
          this.updateState(currentRoute);
          sendResponse({ success: true });
          return true;
        }
      });
    }
  }

  // Initialize on YouTube
  new ContentCoordinator();
})();
