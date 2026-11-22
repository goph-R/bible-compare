# Bible Compare

## Overview
Offline Bible verse comparison app. Vanilla JS/HTML/CSS, no framework, no build step for web. Capacitor.js for Android/iOS native builds.

## Tech Stack
- Vanilla JS (ES modules), HTML, CSS with custom properties
- Capacitor.js 6.x for native mobile
- Android: target/compile SDK 37 (Android 17), minSdk 24, Android Gradle Plugin 8.13.1, Gradle 8.14.3, JDK 21. Current release: 0.9.8 (versionCode 9)
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
- `android/` — Capacitor Android project. Tracked in git (versionCode/versionName and SDK config in `android/app/build.gradle` + `android/variables.gradle` are committed). `cap sync` refreshes web assets/plugins but does not overwrite these build files.

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
export ANDROID_SDK_ROOT="C:/Users/gopher/AppData/Local/Android/Sdk"
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
npx cap sync android
cd android && ./gradlew assembleDebug
```

Release bundle for Google Play (signed via `keystore.properties` + `bible-compare.jks`, both gitignored):
```bash
cd android && ./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab (rename to app-release-<version>.aab)
```
Bump `versionCode` and `versionName` in `android/app/build.gradle` before every Play upload, and add a `CHANGELOG.md` entry. `android/local.properties` (gitignored) must point `sdk.dir` at the local SDK; on the Linux box that is `/home/gopher/Android/Sdk` and no `JAVA_HOME` export is needed (system JDK 21).

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
