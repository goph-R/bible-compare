# Bible Compare

An offline Bible verse comparison app built with vanilla JS/HTML/CSS. Browse and compare verses across multiple translations in a tabbed interface. Works in the browser and as a native Android/iOS app via Capacitor.

## Features

- **Tabbed translation view** — switch between translations, verse position is preserved across tabs
- **4 bundled translations** — KJV, BBE (Bible in Basic English), Karoli (Hungarian), Original (Hebrew OT + Greek NT)
- **Full chapter reading** with clickable verse highlighting
- **Previous/Next chapter paging** at the bottom of the view
- **Version picker** — toggle translations on/off via the book icon button
- **Dark/light theme** — follows system preference, toggleable with the sun/moon button, persisted in localStorage
- **i18n** — UI auto-detects browser language (English and Hungarian supported), including localized book names
- **Offline support** — service worker caches all assets for offline use in the browser
- **RTL support** — Hebrew text renders right-to-left automatically
- **URL hash routing** — `#book=0&ch=1&v=1&t=kjv,hunkar&tab=kjv` for bookmarkable state

## Project Structure

```
bible-compare/
  index.html              # Single page: header, tabs, content panel, paging
  app.js                  # UI logic, event handlers, rendering, theme
  db.js                   # Data layer: loads JSON, provides query methods
  i18n.js                 # Internationalization (EN/HU)
  styles.css              # Responsive layout with dark/light theme
  sw.js                   # Service worker for offline web
  data/
    kjv.json              # King James Version
    bbe.json              # Bible in Basic English
    hunkar.json           # Karoli Gaspar (1590)
    hebrew.json           # Hebrew (Modern) — used for OT in "Original"
    greek.json            # Greek (Byzantine) — used for NT in "Original"
  lib/
    sql-wasm.js           # Vendored sql.js (reserved for future use)
    sql-wasm.wasm
  capacitor.config.json   # Capacitor configuration
  package.json            # Dependencies (Capacitor only)
```

## How It Works

### Data Layer (`db.js`)

Bible data comes from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) as JSON files. Each file contains 66 books with nested chapters and verses:

```json
{ "books": [{ "name": "Genesis", "chapters": [{ "chapter": 1, "verses": [{ "verse": 1, "text": "..." }] }] }] }
```

Translations are lazy-loaded on first access and cached in memory. The "Original" translation is a composite — it merges Hebrew (books 0-38, OT) and Greek (books 39-65, NT) into a single virtual translation.

Adding a new translation requires two steps:
1. Drop a `.json` file in `data/`
2. Add one entry to the `TRANSLATIONS` object in `db.js`

### UI (`app.js`)

The app is a single page with three zones:
- **Header** — book/chapter/verse selects, version picker button, theme toggle
- **Tab bar** — one tab per active translation
- **Content panel** — scrollable chapter text with clickable verses

When switching tabs, the current verse selection is preserved and the new tab scrolls to the same verse. The version picker popup lets users toggle translations without right-clicking (mobile-friendly).

### Internationalization (`i18n.js`)

The UI language is detected from `navigator.languages`. All strings (button labels, book names, loading messages) are looked up via `t('key')`. The default active translation also depends on locale — Hungarian users see Karoli first, others see KJV.

### Theming (`styles.css`)

CSS custom properties define all colors. The `[data-theme="dark"]` selector overrides them. Theme preference is read from `prefers-color-scheme` on first visit, then stored in `localStorage` when toggled.

## Running Locally

Serve the project root with any HTTP server (needed for ES modules and WASM):

```bash
npx serve .
```

Open `http://localhost:3000` in your browser.

## Building for Android

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) with an SDK installed
- Java (bundled with Android Studio at `Android Studio/jbr/`)

### Steps

```bash
# Install dependencies
npm install

# Copy web files to the Capacitor web directory
mkdir -p www
cp index.html app.js db.js i18n.js styles.css sw.js www/
cp -r data lib www/

# Add Android platform (first time only)
npx cap add android

# Sync web assets to the Android project
npx cap sync android

# Set environment variables (adjust paths to your setup)
export ANDROID_SDK_ROOT="/path/to/AndroidSDK"
export JAVA_HOME="/path/to/Android Studio/jbr"

# Build debug APK
cd android
./gradlew assembleDebug

# APK output location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Or open in Android Studio for development/emulator testing:

```bash
npx cap open android
```

### Build Release APK/AAB

```bash
cd android
./gradlew bundleRelease    # AAB for Google Play
./gradlew assembleRelease  # APK
```

You'll need to configure signing in `android/app/build.gradle` for release builds.

## Building for iOS

### Prerequisites

- macOS with [Xcode](https://developer.apple.com/xcode/) installed
- [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`)
- An Apple Developer account (for device testing)

### Steps

```bash
# Install dependencies (if not done already)
npm install

# Prepare web files
mkdir -p www
cp index.html app.js db.js i18n.js styles.css sw.js www/
cp -r data lib www/

# Add iOS platform (first time only)
npm install @capacitor/ios
npx cap add ios

# Sync web assets
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your target device or simulator
2. Set your development team under **Signing & Capabilities**
3. Click **Run** (or `Cmd+R`)

## Bible Data Sources

All translation data is from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (public domain texts):

| ID | Name | Language | Source |
|----|------|----------|--------|
| `kjv` | King James Version | English | Public domain |
| `bbe` | Bible in Basic English | English | Public domain |
| `hunkar` | Karoli Gaspar (1590) | Hungarian | Public domain |
| `hebrew` | Hebrew Modern | Hebrew | OT for "Original" |
| `greek` | Byzantine Textform | Greek | NT for "Original" |

## License

See [LICENSE](LICENSE) for details.
