const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const TERMS_DIR = path.join(REPO_ROOT, 'share/terms');
const JSON_DIR = path.join(TERMS_DIR, 'json');
const SITE_BASE_URL = 'https://indapanno.github.io/buddhism/share/terms/';
const PAGE_SIZE = 10;

const {
  renderTimeline, boldTerm, escapeHtml, capitalize, TERM_UI_STRINGS
} = require(path.join(TERMS_DIR, 'js/render-term.js'));

function readTemplate(name) {
  return fs.readFileSync(path.join(TERMS_DIR, name), 'utf8');
}

const CARD_TEMPLATE = readTemplate('_template_ru.html');
const NAV_TEMPLATE = readTemplate('_template_nav_ru.html');
const strings = TERM_UI_STRINGS.ru;

function replaceOnce(html, oldStr, newStr, id, label) {
  const count = html.split(oldStr).length - 1;
  if (count !== 1) {
    throw new Error('Не найден или не уникален якорь "' + label + '" для ' + id + ' (совпадений: ' + count + ')');
  }
  return html.split(oldStr).join(newStr);
}

// 1. Читаем все *_ru.json (кроме index_ru.json)
const jsonFiles = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('_ru.json') && !f.startsWith('index'));
const terms = jsonFiles.map(filename => {
  const id = filename.replace(/_ru\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(JSON_DIR, filename), 'utf8'));
  return { id, data };
});
terms.sort((a, b) => a.id.localeCompare(b.id));

// 2. index_ru.json
const indexTerms = terms.map(t => ({
  id: t.id,
  term_ru: t.data.term_ru,
  later_count: (t.data.later_mentions || []).length
}));
fs.writeFileSync(path.join(JSON_DIR, 'index_ru.json'), JSON.stringify({ terms: indexTerms }, null, 2) + '\n', 'utf8');
console.log('index_ru.json обновлён:', indexTerms.length, 'терминов');

// 3. Сниппет для навигации (обрезанные толкование + причина введения)
function buildSnippet(data) {
  const parts = [data.interpretation, data.reason_introduced].filter(Boolean);
  let text = parts.join(' ');
  if (!text) return '';
  text = capitalize(text);
  const MAX = 130;
  if (text.length > MAX) {
    text = text.slice(0, MAX).replace(/\s+\S*$/, '') + '…';
  }
  return text;
}

// 4. Карточки терминов
function buildCardHtml(id, data) {
  const termName = data.term_ru || id;
  const iast = data.term_iast || '';
  let html = CARD_TEMPLATE;

  html = replaceOnce(html,
    '<title>История и значение термина</title>',
    '<title>' + escapeHtml(strings.titlePrefix + ' ' + termName + (iast ? ' (' + iast + ')' : '')) + '</title>',
    id, 'title');

  html = replaceOnce(html,
    '<h1 id="page-title">Загрузка…</h1>',
    '<h1 id="page-title">' + boldTerm(termName) + '</h1>',
    id, 'h1');

  const iastOld = '<h2 id="term-iast-btn" class="term-iast-btn" hidden role="button" tabindex="0" aria-label="Скопировать транслитерацию IAST"></h2>';
  const iastNew = iast
    ? '<h2 id="term-iast-btn" class="term-iast-btn" role="button" tabindex="0" aria-label="Скопировать транслитерацию IAST" data-copy-text="' + escapeHtml(iast) + '">' + escapeHtml(iast) + '</h2>'
    : iastOld;
  html = replaceOnce(html, iastOld, iastNew, id, 'iast');

  html = replaceOnce(html,
    '<p class="header-intro" id="header-intro">Загрузка…</p>',
    '<p class="header-intro" id="header-intro">' + strings.headerIntro(boldTerm(termName)) + '</p>',
    id, 'header-intro');

  html = replaceOnce(html,
    '<span class="current" id="breadcrumb-current"></span>',
    '<span class="current" id="breadcrumb-current">' + boldTerm(termName) + '</span>',
    id, 'breadcrumb');

  html = replaceOnce(html,
    '<div id="term-content">\n    <p id="loading">Загрузка…</p>\n  </div>',
    '<div id="term-content">' + renderTimeline(strings, data) + '</div>',
    id, 'term-content');

  return html;
}

let cardCount = 0;
for (const { id, data } of terms) {
  const html = buildCardHtml(id, data);
  fs.writeFileSync(path.join(TERMS_DIR, id + '_ru.html'), html, 'utf8');
  cardCount++;
}
console.log('Карточек собрано:', cardCount);

// 5. Навигационные страницы (постраничные, настоящие отдельные файлы)
const sortedForNav = terms.slice().sort((a, b) => (a.data.term_ru || '').localeCompare(b.data.term_ru || '', 'ru'));
const totalPages = Math.max(1, Math.ceil(sortedForNav.length / PAGE_SIZE));

function navFilename(page) {
  return page === 1 ? 'nav_ru.html' : 'nav_ru_' + page + '.html';
}

function buildPaginationHtml(page) {
  if (totalPages <= 1) return '';
  const parts = [];
  if (page > 1) parts.push('<a href="' + navFilename(page - 1) + '" class="page-link">← Назад</a>');
  for (let p = 1; p <= totalPages; p++) {
    parts.push(p === page
      ? '<span class="page-current">' + p + '</span>'
      : '<a href="' + navFilename(p) + '" class="page-link">' + p + '</a>');
  }
  if (page < totalPages) parts.push('<a href="' + navFilename(page + 1) + '" class="page-link">Далее →</a>');
  return '<nav class="pagination" aria-label="Страницы">' + parts.join('') + '</nav>';
}

for (let page = 1; page <= totalPages; page++) {
  const start = (page - 1) * PAGE_SIZE;
  const pageTerms = sortedForNav.slice(start, start + PAGE_SIZE);

  const items = pageTerms.map(({ id, data }) => {
    const name = escapeHtml(data.term_ru || id);
    const laterCount = (data.later_mentions || []).length;
    const badge = laterCount > 0 ? ' <span class="count-badge">+' + laterCount + '</span>' : '';
    const snippet = buildSnippet(data);
    const snippetHtml = snippet ? '<div class="nav-snippet">' + escapeHtml(snippet) + '</div>' : '';
    return '<li><a href="' + id + '_ru.html">' + name + badge + snippetHtml + '</a></li>';
  }).join('');

  let html = NAV_TEMPLATE;

  html = replaceOnce(html,
    '<ul id="term-list" class="term-list">\n    <li>Загрузка…</li>\n  </ul>',
    '<ul id="term-list" class="term-list">' + items + '</ul>' + buildPaginationHtml(page),
    'nav p' + page, 'term-list');

  const canonicalUrl = SITE_BASE_URL + navFilename(page);
  let linkTags = '<link rel="canonical" href="' + canonicalUrl + '">';
  if (page > 1) linkTags += '\n<link rel="prev" href="' + SITE_BASE_URL + navFilename(page - 1) + '">';
  if (page < totalPages) linkTags += '\n<link rel="next" href="' + SITE_BASE_URL + navFilename(page + 1) + '">';
  html = replaceOnce(html,
    '<link rel="stylesheet" href="css/style.css">',
    '<link rel="stylesheet" href="css/style.css">\n' + linkTags,
    'nav p' + page, 'canonical');

  if (page > 1) {
    html = replaceOnce(html,
      '<title>Навигатор по палийским терминам</title>',
      '<title>Навигатор по палийским терминам — страница ' + page + '</title>',
      'nav p' + page, 'title');
  }

  fs.writeFileSync(path.join(TERMS_DIR, navFilename(page)), html, 'utf8');
}
console.log('Навигационных страниц собрано:', totalPages);

// 6. Уборка: удаляем осиротевшие карточки (JSON удалён) и лишние страницы пагинации
const knownIds = new Set(terms.map(t => t.id));
const existingHtmlFiles = fs.readdirSync(TERMS_DIR).filter(f =>
  f.endsWith('_ru.html') && !f.startsWith('nav_ru') && !f.startsWith('_template') && !f.startsWith('how-to-')
);
let removedCards = 0;
for (const file of existingHtmlFiles) {
  const id = file.replace(/_ru\.html$/, '');
  if (!knownIds.has(id)) {
    fs.unlinkSync(path.join(TERMS_DIR, file));
    removedCards++;
    console.log('Удалён осиротевший файл:', file);
  }
}
if (removedCards) console.log('Удалено осиротевших карточек:', removedCards);

const existingNavFiles = fs.readdirSync(TERMS_DIR).filter(f => /^nav_ru(_\d+)?\.html$/.test(f));
let removedNavPages = 0;
for (const file of existingNavFiles) {
  const m = file.match(/^nav_ru(?:_(\d+))?\.html$/);
  const pageNum = m[1] ? parseInt(m[1], 10) : 1;
  if (pageNum > totalPages) {
    fs.unlinkSync(path.join(TERMS_DIR, file));
    removedNavPages++;
    console.log('Удалена устаревшая страница пагинации:', file);
  }
}
if (removedNavPages) console.log('Удалено устаревших страниц пагинации:', removedNavPages);
