import { TRANSLATIONS, getTranslations, getChapterCount, getVerses, getVerse, preload, loadTranslation } from './db.js';
import { t, getLocale } from './i18n.js';
import { searchTranslation } from './search.js';

// Determine text direction for a translation + book index
function getDir(tId, bookIndex) {
  if (tId === 'original' && bookIndex <= 38) return 'rtl'; // Hebrew OT
  return 'ltr';
}

// --- Theme ---

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeBtn.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

// --- Locale-based defaults ---

function getDefaults() {
  const isHu = getLocale() === 'hu';
  return {
    activeTranslations: isHu ? ['hunkar', 'kjv'] : ['kjv', 'hunkar'],
    activeTab: isHu ? 'hunkar' : 'kjv',
  };
}

const $ = (sel) => document.querySelector(sel);
const bookSelect = $('#book-select');
const chapterSelect = $('#chapter-select');
const verseSelect = $('#verse-select');
const tabBar = $('#tab-bar');
const contentPanel = $('#content-panel');
const loadingOverlay = $('#loading-overlay');
const loadingText = $('#loading-text');
const versionBtn = $('#version-btn');
const versionPopup = $('#version-popup');
const versionList = $('#version-list');
const versionClose = $('#version-close');
const prevBtn = $('#prev-btn');
const nextBtn = $('#next-btn');
const pagingLabel = $('#paging-label');
const themeBtn = $('#theme-btn');
const searchBtn = $('#search-btn');
const searchOverlay = $('#search-overlay');
const searchInput = $('#search-input');
const searchGoBtn = $('#search-go');
const searchCloseBtn = $('#search-close-btn');
const searchResultsEl = $('#search-results');
const searchStatus = $('#search-status');
const searchPaging = $('#search-paging');
const searchPrevBtn = $('#search-prev');
const searchNextBtn = $('#search-next');
const searchPagingLabel = $('#search-paging-label');
const bookmarksBtn = $('#bookmarks-btn');
const bookmarksOverlay = $('#bookmarks-overlay');
const bookmarksCloseBtn = $('#bookmarks-close-btn');
const bookmarksList = $('#bookmarks-list');
const bookmarksTitle = $('#bookmarks-title');
const bookmarkStar = $('#bookmark-star');

const defaults = getDefaults();
let activeTranslations = new Set(defaults.activeTranslations);
let activeTab = defaults.activeTab;
let currentBook = 0;
let currentChapter = 1;
let currentVerse = 1;
let topVersePerTab = {};
let searchResultsData = [];
let searchPage = 0;
let lastSearchQuery = '';
const SEARCH_PAGE_SIZE = 20;
let bookmarks = loadBookmarks();

// --- Initialization ---

async function init() {
  initTheme();
  themeBtn.addEventListener('click', toggleTheme);

  // Apply static UI translations
  document.title = t('appTitle');
  $('.app-title').textContent = t('appTitle');
  bookSelect.setAttribute('aria-label', t('book'));
  chapterSelect.setAttribute('aria-label', t('chapter'));
  verseSelect.setAttribute('aria-label', t('verse'));
  versionBtn.setAttribute('aria-label', t('selectVersions'));
  searchBtn.setAttribute('aria-label', t('search'));
  versionClose.textContent = t('close');
  prevBtn.innerHTML = t('previous');
  nextBtn.innerHTML = t('next');

  loadingOverlay.classList.remove('hidden');
  loadingText.textContent = t('loadingTranslations');

  await preload([...activeTranslations], (loaded, total) => {
    loadingText.textContent = t('loadingN', loaded, total);
  });

  loadingOverlay.classList.add('hidden');

  populateBooks();
  renderTabs();
  setupVersionPicker();
  readHash();

  bookSelect.addEventListener('change', onBookChange);
  chapterSelect.addEventListener('change', onChapterChange);
  verseSelect.addEventListener('change', onVerseChange);
  prevBtn.addEventListener('click', goBack);
  nextBtn.addEventListener('click', goForward);
  window.addEventListener('hashchange', readHash);

  // Bookmarks
  bookmarksBtn.setAttribute('aria-label', t('bookmarks'));
  bookmarksTitle.textContent = t('bookmarks');
  bookmarksBtn.addEventListener('click', openBookmarks);
  bookmarksCloseBtn.addEventListener('click', closeBookmarks);
  bookmarkStar.addEventListener('click', toggleBookmark);

  // Search
  searchBtn.addEventListener('click', openSearch);
  searchCloseBtn.addEventListener('click', closeSearch);
  searchGoBtn.addEventListener('click', executeSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') executeSearch(); });
  searchPrevBtn.addEventListener('click', () => { searchPage--; renderSearchResults(); });
  searchNextBtn.addEventListener('click', () => { searchPage++; renderSearchResults(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!bookmarksOverlay.classList.contains('hidden')) {
        closeBookmarks();
      } else if (!searchOverlay.classList.contains('hidden')) {
        closeSearch();
      }
    }
  });

  await onBookChange();
}

function populateBooks() {
  const books = t('books');
  bookSelect.innerHTML = books.map((name, i) =>
    `<option value="${i}">${name}</option>`
  ).join('');
  bookSelect.value = currentBook;
}

function renderTabs() {
  const translations = getTranslations();
  tabBar.innerHTML = translations.map(tr => `
    <button class="tab ${activeTranslations.has(tr.id) ? '' : 'tab-hidden'} ${tr.id === activeTab ? 'tab-active' : ''}"
            data-id="${tr.id}">
      ${tr.name}
    </button>
  `).join('');

  tabBar.addEventListener('click', onTabClick);
}

// --- Version Picker ---

function setupVersionPicker() {
  versionBtn.addEventListener('click', () => {
    versionPopup.classList.toggle('hidden');
    if (!versionPopup.classList.contains('hidden')) {
      renderVersionList();
    }
  });

  versionClose.addEventListener('click', () => {
    versionPopup.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.version-picker')) {
      versionPopup.classList.add('hidden');
    }
  });
}

function renderVersionList() {
  const translations = getTranslations();
  versionList.innerHTML = translations.map(tr => `
    <div class="version-item ${activeTranslations.has(tr.id) ? 'selected' : ''}" data-id="${tr.id}">
      <span class="version-check">${activeTranslations.has(tr.id) ? '\u2705' : ''}</span>
      <span class="version-item-name">${tr.name} <span class="version-item-full">${tr.fullName}</span></span>
    </div>
  `).join('');

  versionList.querySelectorAll('.version-item').forEach(item => {
    item.addEventListener('click', () => onVersionToggle(item.dataset.id));
  });
}

async function onVersionToggle(id) {
  if (activeTranslations.has(id)) {
    if (activeTranslations.size <= 1) return;
    activeTranslations.delete(id);
    if (activeTab === id) {
      activeTab = [...activeTranslations][0];
    }
  } else {
    activeTranslations.add(id);
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = t('loadingName', TRANSLATIONS[id].name);
    await preload([id]);
    loadingOverlay.classList.add('hidden');
  }

  renderVersionList();
  updateTabVisibility();
  await renderContent();
  updateHash();
}

function updateTabVisibility() {
  tabBar.querySelectorAll('.tab').forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle('tab-hidden', !activeTranslations.has(id));
    btn.classList.toggle('tab-active', id === activeTab);
  });
}

// --- Event Handlers ---

async function onBookChange() {
  currentBook = parseInt(bookSelect.value);
  const firstT = [...activeTranslations][0] || 'kjv';
  const count = await getChapterCount(firstT, currentBook);
  chapterSelect.innerHTML = Array.from({ length: count }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('');
  currentChapter = 1;
  chapterSelect.value = 1;
  topVersePerTab = {};
  await onChapterChange();
}

async function onChapterChange() {
  currentChapter = parseInt(chapterSelect.value);
  const firstT = [...activeTranslations][0] || 'kjv';
  const verses = await getVerses(firstT, currentBook, currentChapter);
  verseSelect.innerHTML = verses.map(v =>
    `<option value="${v.verse}">${v.verse}</option>`
  ).join('');
  currentVerse = 1;
  verseSelect.value = 1;
  topVersePerTab = {};
  await renderContent();
}

function onVerseChange() {
  currentVerse = parseInt(verseSelect.value);
  topVersePerTab = {};
  renderContent();
}

async function onTabClick(e) {
  const btn = e.target.closest('.tab');
  if (!btn || btn.classList.contains('tab-hidden')) return;

  saveScrollPosition();

  activeTab = btn.dataset.id;
  updateTabVisibility();

  if (!TRANSLATIONS[activeTab]) return;
  loadingOverlay.classList.remove('hidden');
  loadingText.textContent = t('loadingName', TRANSLATIONS[activeTab].name);
  await preload([activeTab]);
  loadingOverlay.classList.add('hidden');

  await renderContent();
}

// --- Scroll Position Tracking ---

function saveScrollPosition() {
  const panel = contentPanel;
  const verses = panel.querySelectorAll('.chapter-verse');
  for (const v of verses) {
    if (v.offsetTop >= panel.scrollTop) {
      topVersePerTab[activeTab] = parseInt(v.dataset.verse);
      return;
    }
  }
}

function restoreScrollPosition() {
  const el = contentPanel.querySelector(`.chapter-verse[data-verse="${currentVerse}"]`);
  if (el) {
    contentPanel.scrollTop = el.offsetTop - contentPanel.offsetTop;
  }
}

// --- Rendering ---

async function renderContent() {
  updateHash();

  if (activeTranslations.size === 0) {
    contentPanel.innerHTML = `<p class="empty-message">${t('emptyMessage')}</p>`;
    return;
  }

  const dir = getDir(activeTab, currentBook);
  const verses = await getVerses(activeTab, currentBook, currentChapter);

  contentPanel.setAttribute('data-dir', dir);
  contentPanel.innerHTML = verses.map(v => `
    <p class="chapter-verse ${v.verse === currentVerse ? 'highlight' : ''}" data-verse="${v.verse}">
      <span class="verse-num">${v.verse}</span> ${v.text}
    </p>
  `).join('');

  contentPanel.addEventListener('click', (e) => {
    const verseEl = e.target.closest('.chapter-verse');
    if (!verseEl) return;
    const v = parseInt(verseEl.dataset.verse);
    contentPanel.querySelector('.highlight')?.classList.remove('highlight');
    verseEl.classList.add('highlight');
    currentVerse = v;
    verseSelect.value = v;
    updateHash();
    updateBookmarkStar();
  });

  restoreScrollPosition();
  updatePaging();
  updateBookmarkStar();
}

// --- Paging ---

function updatePaging() {
  const books = t('books');
  const maxChapter = chapterSelect.options.length;
  pagingLabel.textContent = t('chapterOf', books[currentBook], currentChapter, maxChapter);
  prevBtn.disabled = (currentBook === 0 && currentChapter === 1);
  nextBtn.disabled = (currentBook === books.length - 1 && currentChapter === maxChapter);
}

async function goBack() {
  if (currentChapter > 1) {
    currentChapter--;
    chapterSelect.value = currentChapter;
    currentVerse = 1;
    await onChapterChange();
  } else if (currentBook > 0) {
    currentBook--;
    bookSelect.value = currentBook;
    currentVerse = 1;
    await onBookChange();
    const lastCh = chapterSelect.options.length;
    currentChapter = lastCh;
    chapterSelect.value = lastCh;
    await onChapterChange();
  }
  contentPanel.scrollTop = 0;
}

async function goForward() {
  const books = t('books');
  const maxChapter = chapterSelect.options.length;
  if (currentChapter < maxChapter) {
    currentChapter++;
    chapterSelect.value = currentChapter;
    currentVerse = 1;
    await onChapterChange();
  } else if (currentBook < books.length - 1) {
    currentBook++;
    bookSelect.value = currentBook;
    currentVerse = 1;
    await onBookChange();
  }
  contentPanel.scrollTop = 0;
}

// --- URL Hash Routing ---

function updateHash() {
  const tr = [...activeTranslations].join(',');
  const hash = `#book=${currentBook}&ch=${currentChapter}&v=${currentVerse}&t=${tr}&tab=${activeTab}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash);
  }
}

function readHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);

  if (params.has('book')) {
    currentBook = parseInt(params.get('book'));
    bookSelect.value = currentBook;
  }
  if (params.has('ch')) {
    currentChapter = parseInt(params.get('ch'));
  }
  if (params.has('v')) {
    currentVerse = parseInt(params.get('v'));
  }
  if (params.has('t')) {
    activeTranslations = new Set(params.get('t').split(',').filter(Boolean));
  }
  if (params.has('tab')) {
    activeTab = params.get('tab');
  }
  updateTabVisibility();
}

// --- Search ---

function openSearch() {
  searchOverlay.classList.remove('hidden');
  searchInput.placeholder = t('searchPlaceholder', TRANSLATIONS[activeTab].name);
  searchInput.value = '';
  searchResultsEl.innerHTML = '';
  searchStatus.textContent = '';
  searchPaging.classList.add('hidden');
  searchInput.focus();
}

function closeSearch() {
  searchOverlay.classList.add('hidden');
}

async function executeSearch() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchStatus.textContent = t('searchMinChars');
    searchResultsEl.innerHTML = '';
    searchPaging.classList.add('hidden');
    return;
  }
  const data = await loadTranslation(activeTab);
  searchResultsData = searchTranslation(data, query, t('books'));
  searchPage = 0;
  lastSearchQuery = query;
  renderSearchResults();
}

function highlightMatch(text, query) {
  // Fold diacritics for matching positions, but preserve original text
  const foldedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const foldedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const parts = [];
  let lastEnd = 0;
  let pos = foldedText.indexOf(foldedQuery);

  // Map folded positions back to original text positions
  // Build a mapping: original index -> folded index
  const orig = text;
  const norm = text.normalize('NFD');
  // Map from normalized index to original index
  const normToOrig = [];
  let oi = 0;
  for (let ni = 0; ni < norm.length; ni++) {
    // Combining marks (0300-036f) were stripped in folded, skip them
    const code = norm.charCodeAt(ni);
    if (code >= 0x0300 && code <= 0x036f) {
      normToOrig.push(normToOrig[ni - 1]); // same original char
    } else {
      normToOrig.push(oi);
      oi++;
    }
  }
  // Build folded-index to original-index mapping
  // foldedText = norm stripped of combining marks, lowercased
  // We need: for each index in foldedText, what's the original text index?
  const foldedToOrig = [];
  for (let ni = 0; ni < norm.length; ni++) {
    const code = norm.charCodeAt(ni);
    if (!(code >= 0x0300 && code <= 0x036f)) {
      foldedToOrig.push(normToOrig[ni]);
    }
  }

  while (pos !== -1) {
    const origStart = foldedToOrig[pos];
    const origEnd = pos + foldedQuery.length < foldedToOrig.length
      ? foldedToOrig[pos + foldedQuery.length]
      : orig.length;

    if (origStart > lastEnd) {
      parts.push(escapeHtml(orig.slice(lastEnd, origStart)));
    }
    parts.push(`<mark>${escapeHtml(orig.slice(origStart, origEnd))}</mark>`);
    lastEnd = origEnd;
    pos = foldedText.indexOf(foldedQuery, pos + foldedQuery.length);
  }
  if (lastEnd < orig.length) {
    parts.push(escapeHtml(orig.slice(lastEnd)));
  }
  return parts.join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSearchResults() {
  const total = searchResultsData.length;
  if (total === 0) {
    searchStatus.textContent = t('searchNoResults');
    searchResultsEl.innerHTML = '';
    searchPaging.classList.add('hidden');
    return;
  }

  searchStatus.textContent = t('searchResults', total);
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE);
  const start = searchPage * SEARCH_PAGE_SIZE;
  const pageResults = searchResultsData.slice(start, start + SEARCH_PAGE_SIZE);

  searchResultsEl.innerHTML = pageResults.map((r, i) => `
    <div class="search-result-item" data-idx="${start + i}">
      <div class="search-result-ref">${escapeHtml(r.ref)}</div>
      <div class="search-result-text">${highlightMatch(r.text, lastSearchQuery)}</div>
    </div>
  `).join('');

  searchResultsEl.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.idx);
      navigateToResult(searchResultsData[idx]);
    });
  });

  if (totalPages > 1) {
    searchPaging.classList.remove('hidden');
    searchPagingLabel.textContent = t('searchPageOf', searchPage + 1, totalPages);
    searchPrevBtn.disabled = searchPage === 0;
    searchNextBtn.disabled = searchPage >= totalPages - 1;
  } else {
    searchPaging.classList.add('hidden');
  }

  searchResultsEl.scrollTop = 0;
}

async function navigateToResult(result) {
  closeSearch();
  currentBook = result.bookIndex;
  bookSelect.value = currentBook;

  // Populate chapter select without resetting
  const firstT = [...activeTranslations][0] || 'kjv';
  const count = await getChapterCount(firstT, currentBook);
  chapterSelect.innerHTML = Array.from({ length: count }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('');
  currentChapter = result.chapter;
  chapterSelect.value = currentChapter;

  // Populate verse select without resetting
  const verses = await getVerses(firstT, currentBook, currentChapter);
  verseSelect.innerHTML = verses.map(v =>
    `<option value="${v.verse}">${v.verse}</option>`
  ).join('');
  currentVerse = result.verse;
  verseSelect.value = currentVerse;

  topVersePerTab = {};
  await renderContent();
}

// --- Bookmarks ---

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('bookmarks')) || [];
  } catch {
    return [];
  }
}

function saveBookmarks() {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function isBookmarked(bookIndex, chapter, verse) {
  return bookmarks.some(bm => bm.bookIndex === bookIndex && bm.chapter === chapter && bm.verse === verse);
}

function toggleBookmark() {
  const idx = bookmarks.findIndex(bm => bm.bookIndex === currentBook && bm.chapter === currentChapter && bm.verse === currentVerse);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    const books = t('books');
    bookmarks.push({
      bookIndex: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      tab: activeTab,
      label: `${books[currentBook]} ${currentChapter}:${currentVerse}`
    });
  }
  saveBookmarks();
  updateBookmarkStar();
}

function updateBookmarkStar() {
  const active = isBookmarked(currentBook, currentChapter, currentVerse);
  bookmarkStar.textContent = active ? '\u2605' : '\u2606';
  bookmarkStar.classList.toggle('active', active);
}

function openBookmarks() {
  bookmarksOverlay.classList.remove('hidden');
  renderBookmarksList();
}

function closeBookmarks() {
  bookmarksOverlay.classList.add('hidden');
}

function renderBookmarksList() {
  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `<p class="bookmarks-empty">${t('noBookmarks')}</p>`;
    return;
  }
  // Sort by canonical order
  const sorted = [...bookmarks].sort((a, b) => a.bookIndex - b.bookIndex || a.chapter - b.chapter || a.verse - b.verse);
  bookmarksList.innerHTML = sorted.map((bm, i) => `
    <div class="bookmark-item" data-idx="${bookmarks.indexOf(bm)}">
      <span class="bookmark-label">${escapeHtml(bm.label)}</span>
      <button class="bookmark-delete" data-delete="${bookmarks.indexOf(bm)}">&times;</button>
    </div>
  `).join('');

  bookmarksList.querySelectorAll('.bookmark-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-delete')) {
        const delIdx = parseInt(e.target.closest('.bookmark-delete').dataset.delete);
        deleteBookmark(delIdx);
        return;
      }
      const idx = parseInt(item.dataset.idx);
      navigateToBookmark(bookmarks[idx]);
    });
  });
}

function deleteBookmark(idx) {
  if (!confirm(t('confirmDeleteBookmark', bookmarks[idx].label))) return;
  bookmarks.splice(idx, 1);
  saveBookmarks();
  renderBookmarksList();
  updateBookmarkStar();
}

async function navigateToBookmark(bm) {
  closeBookmarks();

  // Switch to the bookmarked tab if it's active
  if (activeTranslations.has(bm.tab)) {
    activeTab = bm.tab;
    updateTabVisibility();
  }

  currentBook = bm.bookIndex;
  bookSelect.value = currentBook;

  const firstT = [...activeTranslations][0] || 'kjv';
  const count = await getChapterCount(firstT, currentBook);
  chapterSelect.innerHTML = Array.from({ length: count }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('');
  currentChapter = bm.chapter;
  chapterSelect.value = currentChapter;

  const verses = await getVerses(firstT, currentBook, currentChapter);
  verseSelect.innerHTML = verses.map(v =>
    `<option value="${v.verse}">${v.verse}</option>`
  ).join('');
  currentVerse = bm.verse;
  verseSelect.value = currentVerse;

  topVersePerTab = {};
  await renderContent();
}

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// --- Start ---
init();
