# YouTube Focus Mode – Chrome Extension (Manifest V3)

A distraction-free, privacy-preserving browser extension that transforms YouTube into an intentional learning and video-watching platform.

---

## 🌟 Key Features

1. **Complete Block Mode (Strict Search-Only Mode) — *NEW***
   - **Pure Intentional Access**: Enforces that **only** videos discovered via manual YouTube search are accessible.
   - **Zero Homepage Clutter**: Suppresses all recommendation grids, motivational banners, quotes, and quick-access shortcuts. The user sees only the clean YouTube search bar.
   - **Direct URL Shield**: Direct video URLs opened from outside YouTube are paused and blocked with a warning dialog (unless opened from a search result in the current session).
   - **No Auto-Advance / Next Video**: When a video ends, playback stops and displays: *"Video completed. Search for your next topic."*
   - **Feeds Blocked**: Subscriptions, Explore, and Trending feeds are disabled.
   - **Priority Override**: Overrides and locks all granular switches when enabled. When disabled, the previous Focus Mode configuration is restored.

2. **Blank, Distraction-Free Homepage (`/`)**
   - Eliminates the infinite algorithmic recommendation grid, home feeds, Shorts shelves, and trending carousels.
   - Preserves YouTube's top search bar, header (logo, profile icons), and left navigation sidebar (with Shorts hidden).
   - The main content feed area remains completely blank and empty (matching YouTube's native background color), showing no custom messages, cards, or placeholder text.

3. **Clean Search Results (`/results?search_query=...`)**
   - Allows genuine video results matching your exact query.
   - Preserves video thumbnails, titles, channel names, duration, upload dates, view counts, and search filter menus.
   - Removes Shorts horizontal shelves, sponsored recommendations, and unrelated algorithm carousels (*"People also watched"*, *"For you"*, *"Previously watched"*).

3. **Focused Video Watch Page (`/watch?v=...`)**
   - Retains full player functionality: Play/pause, volume, playback speed, quality selector, captions, fullscreen, theater mode, and player controls.
   - Completely removes the related videos sidebar (*"Up Next"* / suggested videos).
   - Blocks distracting end-screen cards, autonav countdowns, and popup recommendation teasers.
   - Auto-disables the autoplay toggle.
   - Configurable toggles for comments and descriptions.

4. **Complete Shorts Feed Shield (`/shorts/...`)**
   - Blocks Shorts carousels and shelves across YouTube.
   - Removes Shorts navigation entries from the sidebar drawer and mini guide.
   - If a direct Shorts URL is opened, the video is instantly paused and a Focus Mode Shield card is displayed offering:
     - **Watch as Regular Video** (`/watch?v=...`) without the infinite loop interface.
     - **Return to Focused Homepage**.
     - Temporarily allow once (if intentional).

5. **Single Page Application (SPA) Resilience**
   - Listens to native YouTube Polymer events (`yt-navigate-start`, `yt-navigate-finish`, `yt-page-data-updated`).
   - Hooks History API (`pushState`, `replaceState`, `popstate`, `hashchange`) and includes a lightweight polling watchdog.
   - Employs zero-flicker CSS root attribute flags (`html[data-yfm-enabled="true"]`) combined with a debounced `MutationObserver`.

6. **100% Private & Lightweight**
   - No external APIs, no tracking, no analytics, no remote script injection.
   - Operates with minimal permissions (`storage` and `*://*.youtube.com/*`).

---

## 📁 Project Structure

```
youtube_extenstion/
├── manifest.json                  # Manifest V3 specification
├── background/
│   └── service-worker.js          # Default settings, storage sync, badge updates
├── content/
│   ├── youtube-detector.js        # Route detection & SPA navigation listener
│   ├── blocker.js                 # Dataset attribute manager & dynamic DOM tagger
│   ├── page-handler.js            # Home focus banner & Shorts shield overlay manager
│   ├── observer.js                # Debounced MutationObserver with loop prevention
│   └── content.js                 # Master content script coordinator
├── styles/
│   ├── global.css                 # Base theme variables, guide hiding, shorts overlay
│   ├── homepage.css               # Home feed recommendation hiding & focus card
│   ├── search.css                 # Shorts shelf & algorithmic shelf removal
│   └── watch.css                  # Sidebar, end-screen & up-next blocking
├── popup/
│   ├── popup.html                 # Minimal, modern popup UI
│   ├── popup.css                  # Dark/light responsive styling
│   └── popup.js                   # Master switch, live status & feature toggles
├── options/
│   ├── options.html               # Comprehensive settings dashboard
│   ├── options.css                # Desktop dashboard layout
│   └── options.js                 # Settings persistence & reset handler
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🚀 Installation & Loading in Chrome (Developer Mode)

1. Open Google Chrome (or Chromium-based browsers like Edge, Brave, Arc).
2. In the URL address bar, navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** in the top-right corner of the page.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the project folder:
   ```text
   C:\Users\aryan\Desktop\youtube_extenstion
   ```
6. The extension **YouTube Focus Mode** will appear in your extensions list.
7. Click the Extensions (puzzle piece) icon in your browser toolbar and pin **YouTube Focus Mode** for easy access.

---

## 🧪 Testing Checklist

Verify all core scenarios to ensure complete functionality:

### Complete Block Mode (Strict Search-Only Mode)
- [ ] **1. Enable Complete Block Mode**: Open popup, toggle "Complete Block Mode", and confirm the warning dialog.
- [ ] **2. Verify Homepage**: Open `https://www.youtube.com/`. Verify that all recommended videos, custom messages, motivational quotes, and quick-links are completely removed. Only the clean search bar is visible.
- [ ] **3. Search for a Topic**: Search for `"clean architecture"`. Verify only relevant search results appear, while Shorts shelves and algorithmic carousels remain blocked.
- [ ] **4. Watch Search-Discovered Video**: Click on a search result. Verify video plays normally with player controls and video information. Verify the related videos sidebar is blocked.
- [ ] **5. Video Completion**: Allow the video to finish. Verify autoplay does not advance to another video, and the overlay *"Video completed. Search for your next topic."* appears.
- [ ] **6. Browser Back Navigation**: Press browser back; verify previous search results are restored cleanly.
- [ ] **7. Direct Video URL Protection**: Manually enter or open a direct YouTube watch link (`/watch?v=...`) not found via search. Verify the Direct Video Blocked overlay pauses playback and prompts you to search.
- [ ] **8. Feeds Shielded**: Navigate to `/feed/subscriptions` or `/feed/trending`; verify the feed blocked card appears with a prompt to return to search.
- [ ] **9. Disable Complete Block Mode**: In the popup, toggle Complete Block Mode off; verify standard Focus Mode behavior is restored without losing any custom settings.

### Standard Focus Mode
- [ ] **10. Blank Homepage Feed**: Open homepage in standard mode; verify that the main content feed area remains completely blank and empty, with the top header (logo, search bar, icons) and sidebar intact and Shorts hidden.
- [ ] **11. Search Cleanliness**: Verify search results are clean and free of Shorts shelves.
- [ ] **12. Direct Shorts URL Shield**: Open `/shorts/...` directly; verify playback is paused with the option to watch as a regular video.
- [ ] **13. Settings Persistence**: Change settings, reload browser; verify settings persist via `chrome.storage.sync`.

---

## 🛡️ Security, Privacy & Permissions

- **Permissions**:
  - `storage`: Required solely to persist user preferences (`chrome.storage.sync` with local fallback).
  - `host_permissions: ["*://*.youtube.com/*"]`: Scoped strictly to YouTube domains.
- **Zero Telemetry**: No third-party network requests, no user profiling, no remote script tags.

---

## 📌 Known Limitations & Maintenance Tips

- **YouTube A/B DOM Experimentation**: YouTube periodically rolls out DOM experiments. YouTube Focus Mode relies on multiple selector layers (Polymer tag names, `page-subtype` attributes, and dynamic JS tagging) to maintain resilience against minor markup updates.
- **Full Browser Restart**: Settings are stored in `chrome.storage.sync`, guaranteeing that all custom options persist across browser sessions and across synced Google accounts.
