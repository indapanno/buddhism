// Число терминов в навигаторе — для футера. Определяет язык страницы
// по её имени файла и подгружает соответствующий манифест поиска
// (json/index_<lang>.json), где уже ведётся полный список терминов.

document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('term-count');
  if (!el) return;

  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);
  var match = filename.match(/_(ru|thai)\.html$/);
  var lang = match ? match[1] : 'ru';
  var dir = path.substring(0, path.lastIndexOf('/') + 1);

  fetch(dir + 'json/index_' + lang + '.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var terms = data.terms || [];
      el.textContent = lang === 'thai' && window.toThaiNumerals ? window.toThaiNumerals(terms.length) : terms.length;
    })
    .catch(function () {
      el.textContent = '';
    });
});
