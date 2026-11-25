/**
 * YouTube Focus Mode - Observer
 * High-performance, debounced MutationObserver with infinite-loop prevention.
 */

(function () {
  'use strict';

  class DOMObserver {
    constructor(callback) {
      this.callback = callback;
      this.observer = null;
      this.isDebouncePending = false;
      this.isObserving = false;
    }

    start() {
      if (this.isObserving) return;

      this.observer = new MutationObserver((mutations) => {
        this.handleMutations(mutations);
      });

      // Target document.documentElement so it works even before body is parsed
      const target = document.documentElement || document;

      this.observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: false // Don't trigger on attribute changes to prevent loop with data-yfm attributes
      });

      this.isObserving = true;
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.isObserving = false;
      this.isDebouncePending = false;
    }

    handleMutations(mutations) {
      // Check if mutations contain only our own injected UI elements
      let hasExternalNodes = false;

      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.addedNodes.length === 0) continue;

        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === 1) { // Element node
            const id = node.id || '';
            if (id.startsWith('yfm-')) {
              continue; // Skip our own elements
            }
            hasExternalNodes = true;
            break;
          }
        }
        if (hasExternalNodes) break;
      }

      if (!hasExternalNodes) return;

      // Debounce using requestAnimationFrame to batch render updates
      if (!this.isDebouncePending) {
        this.isDebouncePending = true;
        requestAnimationFrame(() => {
          this.isDebouncePending = false;
          if (typeof this.callback === 'function') {
            try {
              this.callback();
            } catch (err) {
              console.error('[YouTube Focus Mode] Observer callback error:', err);
            }
          }
        });
      }
    }
  }

  // Export to window for extension scripts
  window.YFM_DOMObserver = DOMObserver;
})();
