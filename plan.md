# Bible Compare — Offline Verse Comparison App

## Context
Build an offline Bible comparison app using vanilla JS/HTML/CSS + Capacitor.js for mobile. The app lets users browse and compare verses across multiple translations side-by-side. Data comes from scrollmapper/bible_databases (SQLite files). sql.js (WASM) handles SQLite in the browser; @capacitor-community/sqlite handles it on native.

## Project Structure

```
bible-compare/
  index.html              # Single page: nav + toggles + comparison grid
  app.js                  # UI logic, event handlers, rendering
  db.js                   # Database abstraction (sql.js web / native SQLite)
  styles.css              # Responsive grid layout
  sw.js                   # Service worker for offline web
  data/
    t_kjv.db              # ~1.5 MB each, 5 public domain translations
    t_asv.db
    t_web.db
    t_bbe.db
    t_ylt.db
  lib/
    sql-wasm.js           # Vendored from sql.js GitHub release
    sql-wasm.wasm
  package.json            # Capacitor deps only
  capacitor.config.json
```

5 authored files, 2 vendored libs, 5 data files, 2 configs. No build step for web.

## Implementation Phases

### Phase 1 — Data Preparation
1. Clone `scrollmapper/bible_databases` (shallow clone)
2. Copy 5 `.db` files into `data/`
3. Inspect schema with `sqlite3 data/t_kjv.db ".schema"` — verify table name and columns (expected: `b`, `c`, `v`, `t`)
4. Download sql.js release files (`sql-wasm.js` + `sql-wasm.wasm`) into `lib/`

### Phase 2 — Core Web App
5. **`db.js`** — Database abstraction layer:
   - `init()` — detect platform, load all 5 databases via sql.js (fetch .db → `new SQL.Database(buffer)`)
   - `getChapters(translationId, bookId)` → `[number]`
   - `getVerses(translationId, bookId, chapter)` → `[{verse, text}]`
   - `getVerse(translationId, book, chapter, verse)` → `{text}`
   - Platform detection: `window.Capacitor?.isNativePlatform()` picks backend

6. **`index.html`** — Three-zone single page:
   - Navigation bar: Book / Chapter / Verse `<select>` dropdowns
   - Translation toggles: checkboxes for each translation
   - Comparison grid: `.compare-grid` container for verse cards

7. **`app.js`** — Wire everything together:
   - On load: `db.init()`, populate book dropdown (hardcoded 66-book array), populate translation checkboxes
   - `onBookChange()` → populate chapters dropdown
   - `onChapterChange()` → populate verses dropdown
   - `onVerseChange()` / `onTranslationToggle()` → `renderComparison()`
   - `renderComparison()` — query each active translation, render cards into grid

8. **`styles.css`** — Responsive layout:
   - `.compare-grid`: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
   - `.verse-card`: bordered card with translation name header + verse text
   - Mobile-friendly: cards stack vertically on narrow screens

9. Test with `npx serve .` (needs proper HTTP server for WASM)

### Phase 3 — Polish
10. **`sw.js`** — Service worker caching all assets + .db files for offline web
11. Chapter-level view: show all verses in a chapter, highlight selected verse
12. URL hash routing: `#book=1&ch=1&v=1&t=kjv,web` for back-button support
13. Loading spinner during initial database load (~7.5MB total)

### Phase 4 — Capacitor Mobile Build
14. `npm install` (Capacitor core + CLI + sqlite plugin)
15. `npx cap init` + configure `capacitor.config.json`
16. Add native SQLite backend to `db.js` (`initNative()` path using `@capacitor-community/sqlite`)
17. `npx cap add android` / `npx cap add ios`
18. Copy `.db` files to platform assets directories
19. `npx cap sync && npx cap open android` to test

## Key Design Decisions
- **Hardcoded 66-book array** in app.js — universal across translations, avoids extra DB query
- **Translation registry object** — adding a new translation = one config line + dropping in a .db file
- **sql.js loads all DBs into memory** — 5 × ~1.5MB = ~7.5MB, perfectly fine
- **No framework, no build step** — just files served statically

## Verification
1. Serve with `npx serve .` and open in browser
2. Select a book → chapters populate, select chapter → verses populate
3. Check 2+ translations → verse cards appear side-by-side
4. Disconnect network → app still works (service worker)
5. For mobile: `npx cap sync android && npx cap open android` → test in emulator
