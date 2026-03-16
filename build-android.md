# Building for Android — Notes

## Prerequisites

- Node.js (v18+)
- Android Studio with SDK installed
- npm dependencies installed (`npm install`)

## Steps

```bash
# 1. Install dependencies (must be done first — Capacitor CLI comes from npm)
npm install

# 2. Copy web files to www/
mkdir -p www
cp index.html app.js db.js i18n.js search.js styles.css sw.js .htaccess www/
cp -r data www/

# 3. Set environment variables
export ANDROID_SDK_ROOT="C:/Users/gopher/AppData/Local/Android/Sdk"
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"

# 4. Add Android platform (first time only) then sync
npx cap add android
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

## Issues encountered

### 1. `npx cap` fails with "could not determine executable to run"

`npm install` had not been run, so `@capacitor/cli` was not in `node_modules`. Capacitor is a devDependency — unlike the web app itself, the Android build needs `npm install` first.

### 2. `npx cap sync android` fails with "android platform has not been added yet"

The `android/` directory is gitignored, so on a fresh clone it doesn't exist. Must run `npx cap add android` before `npx cap sync android`.

### 3. Don't forget `search.js` when copying to `www/`

The original CLAUDE.md build command only listed the initial set of files. When new JS files are added (like `search.js`), the copy command must be updated to include them.
