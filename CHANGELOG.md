# Changelog

## [0.9.2] - 2026-03-16

### Fixed
- Content no longer draws behind Android status bar and navigation buttons
- Added CSS safe area insets for header and paging bar

### Changed
- Android package name set to `net.dynart.bible`
- Target Android API 35 (required by Google Play)
- Custom app icon

## [0.9.1] - 2026-03-16

### Changed
- Target Android API 35
- Removed unused `lib/` folder (vendored sql-wasm)

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
- Screenshots for README
- iOS build (untested)
