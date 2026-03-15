import { TRANSLATIONS, getTranslations, getChapterCount, getVerses, getVerse, preload } from './db.js';
import { t, getLocale } from './i18n.js';

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

const defaults = getDefaults();
let activeTranslations = new Set(defaults.activeTranslations);
let activeTab = defaults.activeTab;
let currentBook = 0;
let currentChapter = 1;
let currentVerse = 1;
let topVersePerTab = {};

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
  });

  restoreScrollPosition();
  updatePaging();
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

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// --- Start ---
init();
