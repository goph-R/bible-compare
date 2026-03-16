function foldDiacritics(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function searchTranslation(data, query, bookNames) {
  const q = foldDiacritics(query.trim());
  if (q.length < 2) return [];

  const results = [];
  for (let bi = 0; bi < data.books.length; bi++) {
    const book = data.books[bi];
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (foldDiacritics(v.text).includes(q)) {
          results.push({
            bookIndex: bi,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
            bookName: bookNames[bi],
            ref: `${bookNames[bi]} ${v.chapter}:${v.verse}`,
          });
        }
      }
    }
  }
  return results;
}
