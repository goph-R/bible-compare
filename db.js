// Database abstraction layer
// Loads Bible translation JSON files and provides query methods

const TRANSLATIONS = {
  kjv: { id: 'kjv', name: 'KJV', fullName: 'King James Version', file: 'data/kjv.json' },
  bbe: { id: 'bbe', name: 'BBE', fullName: 'Bible in Basic English', file: 'data/bbe.json' },
  hunkar: { id: 'hunkar', name: 'Károli', fullName: 'Károli Gáspár (1590)', file: 'data/hunkar.json' },
  original: { id: 'original', name: 'Original', fullName: 'Hebrew OT + Greek NT', composite: true },
};

// Composite source files for the "Original" merged translation
const COMPOSITE_SOURCES = {
  original: {
    hebrew: { file: 'data/hebrew.json', books: [0, 38] },   // Genesis–Malachi (indices 0–38)
    greek:  { file: 'data/greek.json',  books: [39, 65] },   // Matthew–Revelation (indices 39–65)
  },
};

// Cache: translationId -> parsed JSON data
const cache = {};

async function loadTranslation(id) {
  if (cache[id]) return cache[id];
  const t = TRANSLATIONS[id];
  if (!t) throw new Error(`Unknown translation: ${id}`);

  if (t.composite) {
    const data = await loadComposite(id);
    cache[id] = data;
    return data;
  }

  const resp = await fetch(t.file);
  if (!resp.ok) throw new Error(`Failed to load ${t.file}: ${resp.status}`);
  const data = await resp.json();
  cache[id] = data;
  return data;
}

async function loadComposite(id) {
  const sources = COMPOSITE_SOURCES[id];
  const parts = await Promise.all(
    Object.values(sources).map(async (src) => {
      const resp = await fetch(src.file);
      if (!resp.ok) throw new Error(`Failed to load ${src.file}: ${resp.status}`);
      const data = await resp.json();
      return { data, start: src.books[0], end: src.books[1] };
    })
  );

  // Build a merged books array — take books from each source for its range
  const books = new Array(66);
  for (const { data, start, end } of parts) {
    for (let i = start; i <= end; i++) {
      books[i] = data.books[i] || { name: '', chapters: [] };
    }
  }
  return { books };
}

/** Get list of available translations */
function getTranslations() {
  return Object.values(TRANSLATIONS);
}

/** Get number of chapters for a book (0-indexed bookIndex) */
async function getChapterCount(translationId, bookIndex) {
  const data = await loadTranslation(translationId);
  const book = data.books[bookIndex];
  return book ? book.chapters.length : 0;
}

/** Get all verses for a chapter */
async function getVerses(translationId, bookIndex, chapter) {
  const data = await loadTranslation(translationId);
  const book = data.books[bookIndex];
  if (!book) return [];
  const ch = book.chapters.find(c => c.chapter === chapter);
  return ch ? ch.verses : [];
}

/** Get a single verse */
async function getVerse(translationId, bookIndex, chapter, verse) {
  const verses = await getVerses(translationId, bookIndex, chapter);
  return verses.find(v => v.verse === verse) || null;
}

/** Preload a set of translations (for showing loading progress) */
async function preload(translationIds, onProgress) {
  let loaded = 0;
  for (const id of translationIds) {
    await loadTranslation(id);
    loaded++;
    if (onProgress) onProgress(loaded, translationIds.length);
  }
}

export { TRANSLATIONS, getTranslations, getChapterCount, getVerses, getVerse, preload, loadTranslation };
