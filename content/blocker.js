/**
 * YouTube Focus Mode - Blocker
 * Coordinates DOM attributes and dynamic element tagging for surgical blocking.
 */

(function () {
  'use strict';

  class Blocker {
    constructor() {
      this.settings = null;
      this.currentRoute = null;
    }

    /**
     * Updates HTML element dataset flags to instantly activate/deactivate CSS rules.
     */
    applyAttributes(settings, currentRoute) {
      this.settings = settings;
      this.currentRoute = currentRoute;

      const root = document.documentElement;
      if (!root) return;

      const isEnabled = Boolean(settings && settings.focusModeEnabled);
      const isCompleteBlock = isEnabled && Boolean(settings.completeBlockMode);

      root.setAttribute('data-yfm-enabled', isEnabled ? 'true' : 'false');
      root.setAttribute('data-yfm-complete-block', isCompleteBlock ? 'true' : 'false');
      root.setAttribute('data-yfm-page', currentRoute || 'other');

      if (!isEnabled) {
        // Clear all sub-attributes when master toggle is off
        root.removeAttribute('data-yfm-block-home');
        root.removeAttribute('data-yfm-block-search-shorts');
        root.removeAttribute('data-yfm-block-search-shelves');
        root.removeAttribute('data-yfm-block-watch-sidebar');
        root.removeAttribute('data-yfm-block-watch-endscreen');
        root.removeAttribute('data-yfm-block-shorts');
        root.removeAttribute('data-yfm-hide-comments');
        root.removeAttribute('data-yfm-hide-description');
        return;
      }

      if (isCompleteBlock) {
        // Complete Block Mode overrides all individual sub-settings
        root.setAttribute('data-yfm-block-home', 'true');
        root.setAttribute('data-yfm-block-search-shorts', 'true');
        root.setAttribute('data-yfm-block-search-shelves', 'true');
        root.setAttribute('data-yfm-block-watch-sidebar', 'true');
        root.setAttribute('data-yfm-block-watch-endscreen', 'true');
        root.setAttribute('data-yfm-block-shorts', 'true');
        root.setAttribute('data-yfm-hide-comments', 'true');
        root.setAttribute('data-yfm-hide-description', settings.hideDescription ? 'true' : 'false');
      } else {
        root.setAttribute('data-yfm-block-home', settings.blockHomeFeed ? 'true' : 'false');
        root.setAttribute('data-yfm-block-search-shorts', settings.blockSearchShorts ? 'true' : 'false');
        root.setAttribute('data-yfm-block-search-shelves', settings.blockSearchShelves ? 'true' : 'false');
        root.setAttribute('data-yfm-block-watch-sidebar', settings.blockWatchSidebar ? 'true' : 'false');
        root.setAttribute('data-yfm-block-watch-endscreen', settings.blockWatchEndscreen ? 'true' : 'false');
        root.setAttribute('data-yfm-block-shorts', settings.blockShorts ? 'true' : 'false');
        root.setAttribute('data-yfm-hide-comments', settings.hideComments ? 'true' : 'false');
        root.setAttribute('data-yfm-hide-description', settings.hideDescription ? 'true' : 'false');
      }
    }

    /**
     * Tags any search result items or grid items that link to Shorts.
     */
    tagSearchShorts(container = document) {
      if (!this.settings?.focusModeEnabled || !this.settings?.blockSearchShorts) return;

      const videoRenderers = container.querySelectorAll(
        'ytd-video-renderer:not([data-yfm-checked]), ytd-grid-video-renderer:not([data-yfm-checked])'
      );

      for (let i = 0; i < videoRenderers.length; i++) {
        const item = videoRenderers[i];
        item.setAttribute('data-yfm-checked', 'true');

        // Check if thumbnail or title links to /shorts/
        const link = item.querySelector('a[href*="/shorts/"]');
        if (link) {
          item.setAttribute('data-yfm-is-shorts', 'true');
        }
      }
    }

    /**
     * Tags left navigation / drawer Shorts buttons for backward compatibility with older browsers.
     */
    tagGuideShorts(container = document) {
      if (!this.settings?.focusModeEnabled || !this.settings?.blockShorts) return;

      const guideEntries = container.querySelectorAll(
        'ytd-guide-entry-renderer:not(.yfm-guide-checked), ytd-mini-guide-entry-renderer:not(.yfm-guide-checked)'
      );

      for (let i = 0; i < guideEntries.length; i++) {
        const entry = guideEntries[i];
        entry.classList.add('yfm-guide-checked');

        const link = entry.querySelector('a[href^="/shorts"], a[title*="Shorts" i]');
        if (link || entry.getAttribute('title')?.toLowerCase().includes('shorts')) {
          entry.classList.add('yfm-hide-guide-shorts');
        }
      }
    }

    /**
     * Disables the native Autoplay / Auto-nav toggle on YouTube watch page if configured.
     */
    handleAutoplayToggle() {
      if (!this.settings?.focusModeEnabled || !this.settings?.blockWatchAutoplay) return;
      if (this.currentRoute !== 'watch') return;

      try {
        const autonavToggle = document.querySelector(
          '.ytp-autonav-toggle-button[aria-checked="true"], button[data-tooltip-target-id="ytp-autonav-toggle-button"][aria-checked="true"]'
        );

        if (autonavToggle) {
          // Native click to trigger YouTube player's internal state machine
          autonavToggle.click();
        }
      } catch (e) {
        // Silently handle if player not fully ready
      }
    }

    /**
     * Dynamic scan pass called by the observer.
     */
    scanAndTag(container = document) {
      if (!this.settings?.focusModeEnabled) return;

      this.tagSearchShorts(container);
      this.tagGuideShorts(container);

      if (this.currentRoute === 'watch' && this.settings.blockWatchAutoplay) {
        this.handleAutoplayToggle();
      }
    }
  }

  // Export to window for extension scripts
  window.YFM_Blocker = Blocker;
})();
