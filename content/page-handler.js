/**
 * YouTube Focus Mode - Page Handler
 * Manages clean minimal UI states for Shorts, Direct Video URLs, and Complete Block Mode.
 * Homepage main feed area remains completely blank without custom messages or cards.
 */

(function () {
  'use strict';

  class PageHandler {
    constructor(detector) {
      this.detector = detector;
      this.settings = null;
      this.currentRoute = null;
      this.shortsTempAllowedId = null;
      this.directVideoAllowedId = null;
      this.videoEndedAttached = false;
    }

    setSettings(settings) {
      this.settings = settings;
      this.handleRouteChange(this.currentRoute);
    }

    handleRouteChange(route) {
      this.currentRoute = route;

      if (!this.settings?.focusModeEnabled) {
        this.cleanupAllOverlays();
        return;
      }

      const isCompleteBlock = Boolean(this.settings.completeBlockMode);

      if (route === 'home') {
        this.removeShortsBlockerOverlay();
        this.removeDirectVideoBlocker();
        this.removeFeedBlocker();
        this.removeVideoEndedOverlay();
        this.removeLegacyHomeBanner();
        // Main feed area remains completely blank (hidden via CSS) with header and sidebar intact.
      } else if (route === 'shorts') {
        this.removeDirectVideoBlocker();
        this.removeFeedBlocker();
        this.removeVideoEndedOverlay();
        this.removeLegacyHomeBanner();

        if (this.settings.blockShorts || isCompleteBlock) {
          this.ensureShortsBlockerOverlay();
        } else {
          this.removeShortsBlockerOverlay();
        }
      } else if (route === 'feed') {
        this.removeShortsBlockerOverlay();
        this.removeDirectVideoBlocker();
        this.removeVideoEndedOverlay();
        this.removeLegacyHomeBanner();

        if (isCompleteBlock) {
          // Block all subscription/trending/explore feeds in Complete Block Mode
          this.ensureFeedBlockerOverlay();
        } else {
          this.removeFeedBlocker();
        }
      } else if (route === 'watch') {
        this.removeShortsBlockerOverlay();
        this.removeFeedBlocker();
        this.removeLegacyHomeBanner();

        if (isCompleteBlock) {
          this.checkDirectVideoPolicy();
        } else {
          this.removeDirectVideoBlocker();
        }

        // Attach video ended listener for "Video completed. Search for your next topic."
        this.setupVideoEndedHandler(isCompleteBlock);
      } else {
        // Search or channel or other routes
        this.removeShortsBlockerOverlay();
        this.removeDirectVideoBlocker();
        this.removeFeedBlocker();
        this.removeVideoEndedOverlay();
        this.removeLegacyHomeBanner();
      }
    }

    cleanupAllOverlays() {
      this.removeShortsBlockerOverlay();
      this.removeDirectVideoBlocker();
      this.removeFeedBlocker();
      this.removeVideoEndedOverlay();
      this.removeLegacyHomeBanner();
    }

    removeLegacyHomeBanner() {
      const existing = document.getElementById('yfm-home-focus-container');
      if (existing) {
        existing.remove();
      }
    }

    // =========================================================================
    // Direct Video URL Policy (Complete Block Mode)
    // =========================================================================

    checkDirectVideoPolicy() {
      if (!this.settings?.completeBlockMode) return;
      if (this.settings?.directVideoPolicy === 'allow') return;

      const videoId = this.detector.getVideoId();
      if (!videoId) return;

      if (this.directVideoAllowedId === videoId) return;

      const isSearchInitiated = this.detector.isSearchVideo(videoId);

      if (!isSearchInitiated) {
        this.pauseAllVideos();
        this.showDirectVideoBlocker(videoId);
      } else {
        this.removeDirectVideoBlocker();
      }
    }

    showDirectVideoBlocker(videoId) {
      if (document.getElementById('yfm-direct-video-blocker')) return;

      const overlay = document.createElement('div');
      overlay.id = 'yfm-direct-video-blocker';
      overlay.innerHTML = `
        <div class="yfm-blocker-card">
          <div class="yfm-blocker-icon-wrap" style="background: rgba(220, 38, 38, 0.15); border-color: rgba(220, 38, 38, 0.3); color: #f87171;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 class="yfm-blocker-title">Direct Video Link Blocked</h2>
          <p class="yfm-blocker-message">
            <strong>Complete Block Mode</strong> is active. To prevent accidental rabbit holes and external distraction loops, only videos opened from an intentional search result are permitted.
          </p>
          <div class="yfm-blocker-actions">
            <a href="/results?search_query=" id="yfm-btn-search-topic" class="yfm-btn yfm-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              Search for this Topic on YouTube
            </a>
            <button type="button" class="yfm-btn yfm-btn-ghost" id="yfm-btn-allow-direct">
              Allow this specific video anyway
            </button>
            <a href="/" class="yfm-btn yfm-btn-secondary">
              Go to Focused Search
            </a>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const allowBtn = overlay.querySelector('#yfm-btn-allow-direct');
      if (allowBtn) {
        allowBtn.addEventListener('click', () => {
          this.directVideoAllowedId = videoId;
          this.detector.markSearchVideo(videoId);
          this.removeDirectVideoBlocker();
          const video = document.querySelector('video');
          if (video) video.play();
        });
      }

      const searchBtn = overlay.querySelector('#yfm-btn-search-topic');
      if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.focusSearchBar();
          this.removeDirectVideoBlocker();
        });
      }
    }

    removeDirectVideoBlocker() {
      const existing = document.getElementById('yfm-direct-video-blocker');
      if (existing) {
        existing.remove();
      }
    }

    // =========================================================================
    // Feed Blocker (Subscriptions / Trending / Explore in Complete Block Mode)
    // =========================================================================

    ensureFeedBlockerOverlay() {
      if (document.getElementById('yfm-feed-blocker-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'yfm-feed-blocker-overlay';
      overlay.innerHTML = `
        <div class="yfm-blocker-card">
          <div class="yfm-blocker-icon-wrap" style="background: rgba(220, 38, 38, 0.15); border-color: rgba(220, 38, 38, 0.3); color: #f87171;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <h2 class="yfm-blocker-title">Feed Blocked in Strict Mode</h2>
          <p class="yfm-blocker-message">
            In <strong>Complete Block Mode</strong>, all feed browsing (Subscriptions, Trending, Explore, History) is disabled. Search for the specific content or lecture you wish to watch.
          </p>
          <div class="yfm-blocker-actions">
            <button type="button" class="yfm-btn yfm-btn-primary" id="yfm-btn-feed-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              Search YouTube
            </button>
            <a href="/" class="yfm-btn yfm-btn-secondary">
              Go to Home Search
            </a>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const searchBtn = overlay.querySelector('#yfm-btn-feed-search');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          this.focusSearchBar();
          this.removeFeedBlocker();
        });
      }
    }

    removeFeedBlocker() {
      const existing = document.getElementById('yfm-feed-blocker-overlay');
      if (existing) {
        existing.remove();
      }
    }

    // =========================================================================
    // Video Ended Handler ("Video completed. Search for your next topic.")
    // =========================================================================

    setupVideoEndedHandler(isCompleteBlock) {
      const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
      if (!video) return;

      if (!video.dataset.yfmEndedListening) {
        video.dataset.yfmEndedListening = 'true';

        video.addEventListener('ended', () => {
          if (this.settings?.completeBlockMode) {
            this.showVideoEndedOverlay();
          }
        });

        video.addEventListener('play', () => {
          this.removeVideoEndedOverlay();
        });

        video.addEventListener('seeked', () => {
          if (video.currentTime < video.duration - 1) {
            this.removeVideoEndedOverlay();
          }
        });
      }
    }

    showVideoEndedOverlay() {
      if (document.getElementById('yfm-video-ended-overlay')) return;

      const playerContainer =
        document.querySelector('#movie_player') ||
        document.querySelector('#ytd-player') ||
        document.querySelector('#player');

      if (!playerContainer) return;

      const overlay = document.createElement('div');
      overlay.id = 'yfm-video-ended-overlay';
      overlay.innerHTML = `
        <div class="yfm-video-ended-card">
          <div class="yfm-ended-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <h2 class="yfm-ended-title">Video completed.</h2>
          <p class="yfm-ended-sub">Search for your next topic.</p>
          <div class="yfm-ended-actions">
            <button type="button" class="yfm-btn yfm-btn-primary" id="yfm-btn-ended-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              Search New Topic
            </button>
            <button type="button" class="yfm-btn yfm-btn-secondary" id="yfm-btn-ended-replay">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Replay Video
            </button>
          </div>
        </div>
      `;

      playerContainer.appendChild(overlay);

      const searchBtn = overlay.querySelector('#yfm-btn-ended-search');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          this.focusSearchBar();
        });
      }

      const replayBtn = overlay.querySelector('#yfm-btn-ended-replay');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          this.removeVideoEndedOverlay();
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = 0;
            video.play();
          }
        });
      }
    }

    removeVideoEndedOverlay() {
      const existing = document.getElementById('yfm-video-ended-overlay');
      if (existing) {
        existing.remove();
      }
    }

    focusSearchBar() {
      const searchInput =
        document.querySelector('ytd-searchbox input#search') ||
        document.querySelector('input#search') ||
        document.querySelector('input[name="search_query"]');

      if (searchInput) {
        searchInput.focus();
        searchInput.select();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.href = '/';
      }
    }

    // =========================================================================
    // Shorts Blocker Overlay Experience
    // =========================================================================

    ensureShortsBlockerOverlay() {
      const videoId = this.detector.getVideoId();
      if (this.shortsTempAllowedId && this.shortsTempAllowedId === videoId) {
        return; // Temporarily permitted by user
      }

      this.pauseAllVideos();

      if (document.getElementById('yfm-shorts-blocker-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'yfm-shorts-blocker-overlay';

      const regularWatchUrl = videoId ? `/watch?v=${videoId}` : null;

      overlay.innerHTML = `
        <div class="yfm-blocker-card">
          <div class="yfm-blocker-icon-wrap">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 class="yfm-blocker-title">Shorts Feed Blocked</h2>
          <p class="yfm-blocker-message">
            YouTube Shorts feeds are engineered for dopamine loops and continuous distraction. Focus Mode has paused and shielded this content.
          </p>
          <div class="yfm-blocker-actions">
            ${
              regularWatchUrl
                ? `<a href="${regularWatchUrl}" class="yfm-btn yfm-btn-primary" id="yfm-btn-watch-regular">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch as Regular Video
                  </a>`
                : ''
            }
            <a href="/" class="yfm-btn yfm-btn-secondary" id="yfm-btn-go-home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Go to Home Search
            </a>
            ${
              videoId && !this.settings?.completeBlockMode
                ? `<button type="button" class="yfm-btn yfm-btn-ghost" id="yfm-btn-temp-allow">
                    Temporarily allow this Short once
                  </button>`
                : ''
            }
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const tempAllowBtn = overlay.querySelector('#yfm-btn-temp-allow');
      if (tempAllowBtn && videoId) {
        tempAllowBtn.addEventListener('click', () => {
          this.shortsTempAllowedId = videoId;
          this.removeShortsBlockerOverlay();
          const video = document.querySelector('video');
          if (video) video.play();
        });
      }
    }

    pauseAllVideos() {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach((v) => {
          if (!v.paused) {
            v.pause();
          }
        });
      } catch (e) {
        // ignore
      }
    }

    removeShortsBlockerOverlay() {
      const existing = document.getElementById('yfm-shorts-blocker-overlay');
      if (existing) {
        existing.remove();
      }
    }
  }

  // Export to window for extension scripts
  window.YFM_PageHandler = PageHandler;
})();
