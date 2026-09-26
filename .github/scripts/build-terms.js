const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const TERMS_DIR = path.join(REPO_ROOT, 'share/terms');
const JSON_DIR = path.join(TERMS_DIR, 'json');
const SITE_BASE_URL = 'https://indapanno.github.io/buddhism/share/terms/';
const PAGE_SIZE = 10;
const LANGS = ['ru', 'thai'];

const {
  renderTimeline, renderMissingTranslation, boldTerm, escapeHtml, capitalize, TERM_UI_STRINGS
} = require(path.join(TERMS_DIR, 'js/render-term.js'));
const { toThaiNumerals } = require(path.join(TERMS_DIR, 'js/thai-numerals.js'));

function readTemplate(name) {
  return fs.readFileSync(path.join(TERMS_DIR, name), 'utf8');
}

const TEMPLATES = { ru: readTemplate('_template_ru.html'), thai: readTemplate('_template_thai.html') };
const NAV_TEMPLATES = { ru: readTemplate('_template_nav_ru.html'), thai: readTemplate('_template_nav_thai.html') };
const LOADING_TEXT = { ru: 'Загрузка…', thai: 'กำลังโหลด…' };
const TITLE_PLACEHOLDER = {
  ru: '<title>История и значение термина</title>',
  thai: '<title>ประวัติและความหมายของคำศัพท์</title>'
};
const NAV_TITLE_TEXT = { ru: 'Навигатор по палийским терминам', thai: 'นำทางคำศัพท์บาลี' };
const IAST_PLACEHOLDER = {
  ru: '<h2 id="term-iast-btn" class="term-iast-btn" hidden role="button" tabindex="0" aria-label="Скопировать транслитерацию IAST"></h2>',
  thai: '<h2 id="term-iast-btn" class="term-iast-btn" hidden role="button" tabindex="0" aria-label="คัดลอกอักษรโรมัน IAST"></h2>'
};

function replaceOnce(html, oldStr, newStr, id, label) {
  const count = html.split(oldStr).length - 1;
  if (count !== 1) {
    throw new Error('Не найден или не уникален якорь "' + label + '" для ' + id + ' (совпадений: ' + count + ')');
  }
  return html.split(oldStr).join(newStr);
}

// 1. Читаем JSON по каждому языку
function loadTerms(lang) {
  const suffix = '_' + lang + '.json';
  const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith(suffix) && !f.startsWith('index'));
  const map = {};
  files.forEach(filename => {
    const id = filename.slice(0, -suffix.length);
    map[id] = JSON.parse(fs.readFileSync(path.join(JSON_DIR, filename), 'utf8'));
  });
  return map;
}

const dataByLang = { ru: loadTerms('ru'), thai: loadTerms('thai') };
const allIds = Array.from(new Set([...Object.keys(dataByLang.ru), ...Object.keys(dataByLang.thai)])).sort();
console.log('Всего терминов (любой язык):', allIds.length);

// 2. index_<lang>.json — только реально переведённые на этот язык термины
LANGS.forEach(lang => {
  const nameKey = lang === 'thai' ? 'term_thai' : 'term_ru';
  const ids = Object.keys(dataByLang[lang]).sort();
  const indexTerms = ids.map(id => ({
    id: id,
    [nameKey]: capitalize(dataByLang[lang][id][nameKey]),
    later_count: (dataByLang[lang][id].later_mentions || []).length
  }));
  fs.writeFileSync(path.join(JSON_DIR, 'index_' + lang + '.json'), JSON.stringify({ terms: indexTerms }, null, 2) + '\n', 'utf8');
  console.log('index_' + lang + '.json обновлён:', indexTerms.length, 'терминов');
});

// 3. Сниппет для навигации
function buildSnippet(data) {
  const parts = [data.interpretation, data.reason_introduced].filter(Boolean);
  let text = parts.join(' ');
  if (!text) return '';
  text = capitalize(text);
  const MAX = 130;
  if (text.length > MAX) text = text.slice(0, MAX).replace(/\s+\S*$/, '') + '…';
  return text;
}

// 4. Карточки терминов — для КАЖДОГО известного id на КАЖДОМ языке
// (если данных для языка нет — страница "перевод отсутствует")
function buildCardHtml(lang, id, data) {
  const strings = TERM_UI_STRINGS[lang];
  const loading = LOADING_TEXT[lang];
  let html = TEMPLATES[lang];

  const termName = data ? capitalize(data.term_ru || data.term_thai || id) : id;
  const iast = data ? (data.term_iast || '') : '';

  html = replaceOnce(html, TITLE_PLACEHOLDER[lang],
    '<title>' + escapeHtml(strings.titlePrefix + ' ' + termName + (iast ? ' (' + iast + ')' : '')) + '</title>',
    lang + '/' + id, 'title');

  html = replaceOnce(html, '<h1 id="page-title">' + loading + '</h1>',
    '<h1 id="page-title">' + boldTerm(termName) + '</h1>', lang + '/' + id, 'h1');

  const iastOld = IAST_PLACEHOLDER[lang];
  const iastNew = iast
    ? iastOld.replace(' hidden', '').replace('></h2>', ' data-copy-text="' + escapeHtml(iast) + '">' + escapeHtml(iast) + '</h2>')
    : iastOld;
  html = replaceOnce(html, iastOld, iastNew, lang + '/' + id, 'iast');

  html = replaceOnce(html, '<p class="header-intro" id="header-intro">' + loading + '</p>',
    '<p class="header-intro" id="header-intro">' + strings.headerIntro(boldTerm(termName)) + '</p>', lang + '/' + id, 'header-intro');

  html = replaceOnce(html, '<span class="current" id="breadcrumb-current"></span>',
    '<span class="current" id="breadcrumb-current">' + boldTerm(termName) + '</span>', lang + '/' + id, 'breadcrumb');

  const contentHtml = data
    ? renderTimeline(strings, data)
    : renderMissingTranslation(strings, id, strings.langNameOfSelf, 'how-to-translate-term_' + lang + '.html');

  html = replaceOnce(html, '<div id="term-content">\n    <p id="loading">' + loading + '</p>\n  </div>',
    '<div id="term-content">' + contentHtml + '</div>', lang + '/' + id, 'term-content');

  return html;
}

const cardCounts = { ru: 0, thai: 0 };
allIds.forEach(id => {
  LANGS.forEach(lang => {
    const data = dataByLang[lang][id];
    const html = buildCardHtml(lang, id, data);
    fs.writeFileSync(path.join(TERMS_DIR, id + '_' + lang + '.html'), html, 'utf8');
    cardCounts[lang]++;
  });
});
console.log('Карточек собрано: ru=' + cardCounts.ru + ', thai=' + cardCounts.thai);

// 5. Навигационные страницы — по каждому языку, только реально переведённые термины
function navFilename(lang, page) {
  const base = 'nav_' + lang;
  return page === 1 ? base + '.html' : base + '_' + page + '.html';
}

function buildPaginationHtml(lang, page, totalPages) {
  if (totalPages <= 1) return '';
  const backText = lang === 'thai' ? '← ย้อนกลับ' : '← Назад';
  const nextText = lang === 'thai' ? 'ถัดไป →' : 'Далее →';
  const digits = n => (lang === 'thai' ? toThaiNumerals(n) : String(n));
  const parts = [];
  if (page > 1) parts.push('<a href="' + navFilename(lang, page - 1) + '" class="page-link">' + backText + '</a>');
  for (let p = 1; p <= totalPages; p++) {
    parts.push(p === page
      ? '<span class="page-current">' + digits(p) + '</span>'
      : '<a href="' + navFilename(lang, p) + '" class="page-link">' + digits(p) + '</a>');
  }
  if (page < totalPages) parts.push('<a href="' + navFilename(lang, page + 1) + '" class="page-link">' + nextText + '</a>');
  return '<nav class="pagination" aria-label="Страницы">' + parts.join('') + '</nav>';
}

const totalPagesByLang = {};

LANGS.forEach(lang => {
  const nameKey = lang === 'thai' ? 'term_thai' : 'term_ru';
  const items = Object.keys(dataByLang[lang]).map(id => ({ id, data: dataByLang[lang][id] }));
  const sorted = items.slice().sort((a, b) => (a.data[nameKey] || '').localeCompare(b.data[nameKey] || '', lang === 'thai' ? 'th' : 'ru'));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  totalPagesByLang[lang] = totalPages;

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * PAGE_SIZE;
    const pageTerms = sorted.slice(start, start + PAGE_SIZE);

    const liHtml = pageTerms.map(({ id, data }) => {
      const name = escapeHtml(capitalize(data[nameKey] || id));
      const laterCount = (data.later_mentions || []).length;
      const badgeNum = lang === 'thai' ? toThaiNumerals(laterCount) : laterCount;
      const badge = laterCount > 0 ? ' <span class="count-badge">+' + badgeNum + '</span>' : '';
      const snippet = buildSnippet(data);
      const snippetHtml = snippet ? '<div class="nav-snippet">' + escapeHtml(snippet) + '</div>' : '';
      return '<li><a href="' + id + '_' + lang + '.html">' + name + badge + snippetHtml + '</a></li>';
    }).join('');

    let html = NAV_TEMPLATES[lang];
    const loadingLi = '<li>' + LOADING_TEXT[lang] + '</li>';
    html = replaceOnce(html,
      '<ul id="term-list" class="term-list">\n    ' + loadingLi + '\n  </ul>',
      '<ul id="term-list" class="term-list">' + liHtml + '</ul>' + buildPaginationHtml(lang, page, totalPages),
      lang + ' nav p' + page, 'term-list');

    const canonicalUrl = SITE_BASE_URL + navFilename(lang, page);
    let linkTags = '<link rel="canonical" href="' + canonicalUrl + '">';
    if (page > 1) linkTags += '\n<link rel="prev" href="' + SITE_BASE_URL + navFilename(lang, page - 1) + '">';
    if (page < totalPages) linkTags += '\n<link rel="next" href="' + SITE_BASE_URL + navFilename(lang, page + 1) + '">';
    html = replaceOnce(html, '<link rel="stylesheet" href="css/style.css">',
      '<link rel="stylesheet" href="css/style.css">\n' + linkTags, lang + ' nav p' + page, 'canonical');

    if (page > 1) {
      const pageSuffix = lang === 'thai' ? (' — หน้า ' + toThaiNumerals(page)) : (' — страница ' + page);
      html = replaceOnce(html, '<title>' + NAV_TITLE_TEXT[lang] + '</title>',
        '<title>' + NAV_TITLE_TEXT[lang] + pageSuffix + '</title>', lang + ' nav p' + page, 'title');
    }

    fs.writeFileSync(path.join(TERMS_DIR, navFilename(lang, page)), html, 'utf8');
  }
  console.log('Навигационных страниц (' + lang + ') собрано:', totalPages);
});

// 6. Уборка: осиротевшие карточки и лишние страницы пагинации
LANGS.forEach(lang => {
  const suffix = '_' + lang + '.html';
  const existingHtmlFiles = fs.readdirSync(TERMS_DIR).filter(f =>
    f.endsWith(suffix) && !f.startsWith('nav_') && !f.startsWith('_template') && !f.startsWith('how-to-')
  );
  let removedCards = 0;
  existingHtmlFiles.forEach(file => {
    const id = file.slice(0, -suffix.length);
    if (!allIds.includes(id)) {
      fs.unlinkSync(path.join(TERMS_DIR, file));
      removedCards++;
      console.log('Удалён осиротевший файл:', file);
    }
  });
  if (removedCards) console.log('Удалено осиротевших карточек (' + lang + '):', removedCards);

  const existingNavFiles = fs.readdirSync(TERMS_DIR).filter(f => new RegExp('^nav_' + lang + '(_\\d+)?\\.html$').test(f));
  let removedNavPages = 0;
  existingNavFiles.forEach(file => {
    const m = file.match(new RegExp('^nav_' + lang + '(?:_(\\d+))?\\.html$'));
    const pageNum = m[1] ? parseInt(m[1], 10) : 1;
    if (pageNum > totalPagesByLang[lang]) {
      fs.unlinkSync(path.join(TERMS_DIR, file));
      removedNavPages++;
      console.log('Удалена устаревшая страница пагинации:', file);
    }
  });
  if (removedNavPages) console.log('Удалено устаревших страниц пагинации (' + lang + '):', removedNavPages);
});
