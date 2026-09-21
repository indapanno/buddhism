// Поиск-подсказка (type-ahead) по названиям терминов.
// Общий компонент для навигационной страницы и карточки термина.
// Ограничивает число подсказок и показывает число "развитий" термина
// (later_count) рядом с названием, если оно больше нуля.

var SEARCH_MAX_SUGGESTIONS = 8;

function getCurrentLang() {
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);
  var match = filename.match(/_(ru|thai)\.html$/);
  return match ? match[1] : 'ru';
}

function getDirPath() {
  var path = window.location.pathname;
  return path.substring(0, path.lastIndexOf('/') + 1);
}

function escapeSearchHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('search-input');
  var suggestions = document.getElementById('search-suggestions');
  if (!input || !suggestions) return;

  var lang = getCurrentLang();
  var dir = getDirPath();
  var terms = [];

  fetch(dir + 'json/index_' + lang + '.json')
    .then(function (res) { return res.json(); })
    .then(function (data) { terms = data.terms || []; })
    .catch(function () { terms = []; });

  function nameOf(term) {
    return lang === 'thai' ? term.term_thai : term.term_ru;
  }

  function render(matches) {
    suggestions.innerHTML = '';
    if (matches.length === 0) {
      suggestions.hidden = true;
      return;
    }
    var shown = matches.slice(0, SEARCH_MAX_SUGGESTIONS);
    suggestions.innerHTML = shown.map(function (term) {
      var name = escapeSearchHtml(nameOf(term));
      var badge = (term.later_count && term.later_count > 0)
        ? ' <span class="count-badge">+' + term.later_count + '</span>'
        : '';
      return '<a href="' + term.id + '_' + lang + '.html">' + name + badge + '</a>';
    }).join('');
    if (matches.length > SEARCH_MAX_SUGGESTIONS) {
      var note = document.createElement('div');
      note.className = 'search-empty';
      note.textContent = 'Показаны первые ' + SEARCH_MAX_SUGGESTIONS + ' из ' + matches.length + ' — уточните запрос';
      suggestions.appendChild(note);
    }
    suggestions.hidden = false;
  }

  input.addEventListener('input', function () {
    var query = input.value.trim().toLowerCase();
    if (query === '') {
      suggestions.hidden = true;
      suggestions.innerHTML = '';
      return;
    }
    var matches = terms.filter(function (term) {
      var name = (nameOf(term) || '').toLowerCase();
      return name.indexOf(query) !== -1;
    });
    render(matches);
  });

  document.addEventListener('click', function (e) {
    if (!suggestions.contains(e.target) && e.target !== input) {
      suggestions.hidden = true;
    }
  });
});
