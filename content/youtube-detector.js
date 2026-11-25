/**
 * YouTube Focus Mode - YouTube Detector
 * Accurately detects YouTube pages and handles Single Page Application (SPA) navigation.
 */

(function () {
  'use strict';

  class YouTubeDetector {
    constructor() {
      this.currentRoute = null;
      this.currentUrl = window.location.href;
      this.routeListeners = [];
      this.urlPollInterval = null;

      this.init();
    }

    /**
     * Determines page type based on URL path and search params.
     * @param {string} urlString
     * @returns {'home'|'search'|'watch'|'shorts'|'feed'|'channel'|'other'}
     */
    detectRoute(urlString = window.location.href) {
      try {
        const url = new URL(urlString, window.location.origin);
        const path = url.pathname;

        if (path === '/' || path === '') {
          // If there's a search_query on root, it might be search, otherwise home
          return url.searchParams.has('search_query') ? 'search' : 'home';
        }

        if (path === '/results') {
          return 'search';
        }

        if (path === '/watch') {
          return 'watch';
        }

        if (path.startsWith('/shorts')) {
          return 'shorts';
        }

        if (path.startsWith('/feed') || path.startsWith('/explore') || path.startsWith('/trending')) {
          return 'feed';
        }

        if (path.startsWith('/@') || path.startsWith('/channel/') || path.startsWith('/c/') || path.startsWith('/user/')) {
          return 'channel';
        }

        return 'other';
      } catch (e) {
        return 'other';
      }
    }

    /**
     * Tracks allowed video IDs initiated from search during this session.
     */
    markSearchVideo(videoId) {
      if (!videoId) return;
      try {
        const stored = JSON.parse(sessionStorage.getItem('yfm_searched_videos') || '[]');
        if (!stored.includes(videoId)) {
          stored.push(videoId);
          // Keep up to 200 items in session
          if (stored.length > 200) stored.shift();
          sessionStorage.setItem('yfm_searched_videos', JSON.stringify(stored));
        }
      } catch (e) {
        // sessionStorage might be restricted in some iframes
      }
    }

    isSearchVideo(videoId) {
      if (!videoId) return false;
      try {
        // Check if referrer is search
        if (document.referrer && document.referrer.includes('/results')) {
          this.markSearchVideo(videoId);
          return true;
        }

        const stored = JSON.parse(sessionStorage.getItem('yfm_searched_videos') || '[]');
        return stored.includes(videoId);
      } catch (e) {
        return false;
      }
    }

    /**
     * Extracts video ID if currently on a Shorts or Watch page.
     */
    getVideoId(urlString = window.location.href) {
      try {
        const url = new URL(urlString, window.location.origin);
        if (url.pathname.startsWith('/shorts/')) {
          const parts = url.pathname.split('/');
          return parts[2] || null;
        }
        if (url.pathname === '/watch') {
          return url.searchParams.get('v');
        }
      } catch (e) {
        // ignore
      }
      return null;
    }

    /**
     * Registers a callback for SPA route changes.
     * @param {Function} callback (newRoute, oldRoute, url)
     */
    onRouteChange(callback) {
      if (typeof callback === 'function') {
        this.routeListeners.push(callback);
      }
    }

    notifyRouteListeners(newRoute, oldRoute, url) {
      for (const listener of this.routeListeners) {
        try {
          listener(newRoute, oldRoute, url);
        } catch (err) {
          console.error('[YouTube Focus Mode] Error in route listener:', err);
        }
      }
    }

    checkUrlChange() {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        const oldRoute = this.currentRoute;
        const newRoute = this.detectRoute(newUrl);
        this.currentUrl = newUrl;
        this.currentRoute = newRoute;

        this.notifyRouteListeners(newRoute, oldRoute, newUrl);
      }
    }

    setupSpaListeners() {
      // 1. YouTube specific custom events fired by YouTube's Polymer framework
      const ytEvents = [
        'yt-navigate-start',
        'yt-navigate-finish',
        'yt-page-data-updated',
        'yt-action',
        'spfdone'
      ];

      ytEvents.forEach((eventName) => {
        window.addEventListener(eventName, () => {
          this.checkUrlChange();
        });
      });

      // 2. Browser History API events
      window.addEventListener('popstate', () => this.checkUrlChange());
      window.addEventListener('hashchange', () => this.checkUrlChange());

      // 3. Monkey-patch pushState & replaceState to capture programmatic navigation immediately
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        const result = originalPushState.apply(history, args);
        this.checkUrlChange();
        return result;
      };

      history.replaceState = (...args) => {
        const result = originalReplaceState.apply(history, args);
        this.checkUrlChange();
        return result;
      };

      // 4. Polling fallback (lightweight, every 350ms) to ensure no edge-case SPA navigation is missed
      this.urlPollInterval = setInterval(() => {
        this.checkUrlChange();
      }, 350);
    }

    init() {
      this.currentRoute = this.detectRoute();
      this.currentUrl = window.location.href;
      this.setupSpaListeners();
    }

    destroy() {
      if (this.urlPollInterval) {
        clearInterval(this.urlPollInterval);
      }
    }
  }

  // Export to window for extension scripts
  window.YFM_YouTubeDetector = YouTubeDetector;
})();
