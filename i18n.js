const STRINGS = {
  en: {
    appTitle: 'Bible Compare',
    book: 'Book',
    chapter: 'Chapter',
    verse: 'Verse',
    loading: 'Loading...',
    loadingTranslations: 'Loading translations...',
    loadingN: (n, total) => `Loading translations... (${n}/${total})`,
    loadingName: (name) => `Loading ${name}...`,
    selectVersions: 'Select versions',
    close: 'Close',
    previous: '\u2190 Previous',
    next: 'Next \u2192',
    chapterOf: (book, ch, max) => `${book} ${ch} / ${max}`,
    verseNotFound: 'Verse not found',
    emptyMessage: 'Select at least one translation.',
    books: [
      'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
      'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
      '1 Kings','2 Kings','1 Chronicles','2 Chronicles',
      'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs',
      'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations',
      'Ezekiel','Daniel','Hosea','Joel','Amos',
      'Obadiah','Jonah','Micah','Nahum','Habakkuk',
      'Zephaniah','Haggai','Zechariah','Malachi',
      'Matthew','Mark','Luke','John','Acts',
      'Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians',
      'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
      '1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
      'James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
    ],
  },
  hu: {
    appTitle: 'Biblia \u00d6sszehasonl\u00edt\u00f3',
    book: 'K\u00f6nyv',
    chapter: 'Fejezet',
    verse: 'Vers',
    loading: 'Bet\u00f6lt\u00e9s...',
    loadingTranslations: 'Ford\u00edt\u00e1sok bet\u00f6lt\u00e9se...',
    loadingN: (n, total) => `Ford\u00edt\u00e1sok bet\u00f6lt\u00e9se... (${n}/${total})`,
    loadingName: (name) => `${name} bet\u00f6lt\u00e9se...`,
    selectVersions: 'Verzi\u00f3k kiv\u00e1laszt\u00e1sa',
    close: 'Bez\u00e1r\u00e1s',
    previous: '\u2190 El\u0151z\u0151',
    next: 'K\u00f6vetkez\u0151 \u2192',
    chapterOf: (book, ch, max) => `${book} ${ch} / ${max}`,
    verseNotFound: 'Vers nem tal\u00e1lhat\u00f3',
    emptyMessage: 'V\u00e1lassz legal\u00e1bb egy ford\u00edt\u00e1st.',
    books: [
      '1 M\u00f3zes','2 M\u00f3zes','3 M\u00f3zes','4 M\u00f3zes','5 M\u00f3zes',
      'J\u00f3zsu\u00e9','B\u00edr\u00e1k','Ruth','1 S\u00e1muel','2 S\u00e1muel',
      '1 Kir\u00e1lyok','2 Kir\u00e1lyok','1 Kr\u00f3nik\u00e1k','2 Kr\u00f3nik\u00e1k',
      'Ezdr\u00e1s','Nehemi\u00e1s','Eszter','J\u00f3b','Zsolt\u00e1rok','P\u00e9ldabesz\u00e9dek',
      'Pr\u00e9dik\u00e1tor','\u00c9nekek \u00c9neke','\u00c9zsai\u00e1s','Jeremi\u00e1s','Siralmak',
      'Ez\u00e9kiel','D\u00e1niel','H\u00f3se\u00e1s','J\u00f3el','\u00c1m\u00f3s',
      'Abdi\u00e1s','J\u00f3n\u00e1s','Mike\u00e1s','N\u00e1hum','Habakuk',
      'Sofoni\u00e1s','Aggeus','Zakari\u00e1s','Malaki\u00e1s',
      'M\u00e1t\u00e9','M\u00e1rk','Luk\u00e1cs','J\u00e1nos','Apostolok Cselekedetei',
      'R\u00f3maiakhoz','1 Korinthusiakhoz','2 Korinthusiakhoz','Galat\u00e1khoz','Ef\u00e9zusiakhoz',
      'Filippiekhez','Koloss\u00e9iakhoz','1 Thesszalonikaiakhoz','2 Thesszalonikaiakhoz',
      '1 Tim\u00f3teushoz','2 Tim\u00f3teushoz','Tituszhoz','Filemonhoz','Zsid\u00f3khoz',
      'Jakab','1 P\u00e9ter','2 P\u00e9ter','1 J\u00e1nos','2 J\u00e1nos','3 J\u00e1nos','J\u00fad\u00e1s','Jelent\u00e9sek'
    ],
  },
};

function detectLocale() {
  const langs = navigator.languages || [navigator.language || 'en'];
  for (const lang of langs) {
    const code = lang.toLowerCase().split('-')[0];
    if (STRINGS[code]) return code;
  }
  return 'en';
}

let currentLocale = detectLocale();

function t(key, ...args) {
  const val = STRINGS[currentLocale]?.[key] ?? STRINGS.en[key];
  if (typeof val === 'function') return val(...args);
  return val;
}

function getLocale() {
  return currentLocale;
}

function setLocale(code) {
  if (STRINGS[code]) currentLocale = code;
}

function getAvailableLocales() {
  return Object.keys(STRINGS);
}

export { t, getLocale, setLocale, getAvailableLocales, detectLocale };
