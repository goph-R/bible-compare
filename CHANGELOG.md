# Changelog

## [0.9.0] - 2026-03-16

### Added
- **Bookmarks** — save favourite verses with a star button in the selector row, browse and navigate from a fullscreen bookmarks overlay, delete with confirmation, persisted in localStorage
- **Full-text search** — accent-insensitive search within the active translation with highlighted matches and paged results
- **Version picker** — toggle translations on/off via a popup (mobile-friendly, no right-click needed)
- **Dark/light theme** — follows system preference on first visit, toggleable, persisted in localStorage
- **i18n** — English and Hungarian UI with auto-detection from browser language
- **Offline support** — service worker caches all assets for offline use
- **RTL support** — Hebrew text renders right-to-left automatically
- **URL hash routing** — bookmarkable state for book, chapter, verse, and active translations
- **4 bundled translations** — KJV, BBE, Karoli (Hungarian), Original (Hebrew OT + Greek NT)
- **Android build** — Capacitor.js configuration for native Android APK/AAB

### Missing for 1.0.0
- App icon
- App description / meta tags
- Screenshots for README
- iOS build (untested)
