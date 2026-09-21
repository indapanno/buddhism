// Навигационная страница: алфавитный список терминов из манифеста поиска
// (json/index_<lang>.json), с постраничным разбиением через ?page=N.
//
// ВАЖНО: это черновая, клиентская (JS) пагинация — только для проверки UX.
// Она не даёт полноценного SEO (содержимое страниц 2+ не попадает в исходный
// HTML-код). SEO-безопасная версия появится позже вместе со сборочным
// скриптом, который будет генерировать настоящие отдельные статичные файлы
// для каждой страницы пагинации.

var NAV_PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', function () {
  var list = document.getElementById('term-list');
  if (!list) return;

  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);
  var match = filename.match(/_(ru|thai)\.html$/);
  var lang = match ? match[1] : 'ru';
  var dir = path.substring(0, path.lastIndexOf('/') + 1);

  function nameOf(term) { return lang === 'thai' ? term.term_thai : term.term_ru; }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function getCurrentPage() {
    var params = new URLSearchParams(window.location.search);
    var p = parseInt(params.get('page'), 10);
    return (p && p > 0) ? p : 1;
  }

  function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) return '';
    var parts = [];
    if (currentPage > 1) parts.push('<a href="?page=' + (currentPage - 1) + '" class="page-link">← Назад</a>');
    for (var p = 1; p <= totalPages; p++) {
      parts.push(p === currentPage
        ? '<span class="page-current">' + p + '</span>'
        : '<a href="?page=' + p + '" class="page-link">' + p + '</a>');
    }
    if (currentPage < totalPages) parts.push('<a href="?page=' + (currentPage + 1) + '" class="page-link">Далее →</a>');
    return '<nav class="pagination" aria-label="Страницы">' + parts.join('') + '</nav>';
  }

  fetch(dir + 'json/index_' + lang + '.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var terms = (data.terms || []).slice().sort(function (a, b) {
        return (nameOf(a) || '').localeCompare(nameOf(b) || '', lang === 'thai' ? 'th' : 'ru');
      });

      var totalPages = Math.ceil(terms.length / NAV_PAGE_SIZE) || 1;
      var currentPage = Math.min(getCurrentPage(), totalPages);
      var start = (currentPage - 1) * NAV_PAGE_SIZE;
      var pageTerms = terms.slice(start, start + NAV_PAGE_SIZE);

      var itemsHtml = pageTerms.map(function (term) {
        var name = escapeHtml(nameOf(term));
        var badge = (term.later_count && term.later_count > 0)
          ? ' <span class="count-badge">+' + term.later_count + '</span>'
          : '';
        return '<li><a href="' + term.id + '_' + lang + '.html">' + name + badge + '</a></li>';
      }).join('');

      list.innerHTML = itemsHtml;
      list.insertAdjacentHTML('afterend', renderPagination(currentPage, totalPages));
    })
    .catch(function () {
      list.innerHTML = '<li>Не удалось загрузить список терминов.</li>';
    });
});
