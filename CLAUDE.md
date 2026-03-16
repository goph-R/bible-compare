# Bible Compare

## Overview
Offline Bible verse comparison app. Vanilla JS/HTML/CSS, no framework, no build step for web. Capacitor.js for Android/iOS native builds.

## Tech Stack
- Vanilla JS (ES modules), HTML, CSS with custom properties
- Capacitor.js 6.x for native mobile
- Bible data: JSON files from scrollmapper/bible_databases

## Project Structure
- `index.html` — Single page entry point
- `app.js` — UI logic, event handlers, rendering, theme toggle
- `db.js` — Data layer: lazy-loads translation JSON, caching, query methods. `TRANSLATIONS` object is the registry
- `i18n.js` — Internationalization. `t('key')` for all UI strings. Currently EN + HU
- `search.js` — Full-text search with accent-insensitive matching
- `styles.css` — All styling, dark/light via `[data-theme]` and CSS custom properties
- `sw.js` — Service worker, bump `CACHE_NAME` version when assets change
- `data/` — Translation JSON files (~11MB each)
- `www/` — Generated: copy of web files for Capacitor (gitignored)
- `android/` — Generated: Capacitor Android project (gitignored)

## Key Patterns
- Adding a translation: drop JSON in `data/`, add entry to `TRANSLATIONS` in `db.js`, add to `sw.js` cache list
- Adding a UI language: add locale object to `STRINGS` in `i18n.js`
- The "Original" translation is a composite: Hebrew OT (books 0-38) + Greek NT (books 39-65), merged in `loadComposite()`
- Theme: system `prefers-color-scheme` on first visit, then `localStorage('theme')`
- Locale-based defaults: HU users get Károli as first tab, others get KJV

## Building

### Web
```bash
npx serve .
```

### Android
```bash
mkdir -p www && cp index.html app.js db.js i18n.js styles.css sw.js www/ && cp -r data www/
export ANDROID_SDK_ROOT="C:/Users/gopher/Apps/AndroidSDK"
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
npx cap sync android
cd android && ./gradlew assembleDebug
```

### iOS (not yet tested)
```bash
npm install @capacitor/ios && npx cap add ios && npx cap sync ios && npx cap open ios
```

## Conventions
- No frameworks, no build tools — just static files
- All colors through CSS custom properties (support dark/light)
- All UI strings through `i18n.js` `t()` function
- Mobile-first: no right-click/context menu interactions
- Service worker cache version must be bumped when files change
