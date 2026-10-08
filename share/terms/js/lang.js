// Язык страницы + переключатель языка.
//
// ЕДИНСТВЕННЫЙ источник истины о языке страницы — атрибут <html lang>,
// который ставит сборка (ru -> "ru", тайский -> "th"). Имя файла для
// определения языка НЕ используется, поэтому страницы вида nav_thai_2.html
// и любые будущие имена не ломают язык.
//
// Остальные скрипты берут язык отсюда: TermsLang.get() -> 'ru' | 'thai'.
//
// Корень сайта: TermsLang.url('json/index_ru.json') -> абсолютный адрес файла
// от папки share/terms/. Корень считается по адресу самого lang.js, поэтому
// пути работают на страницах любой глубины (html/, bundle/html/).
// Новый язык добавляется в одном месте — в LANG_BY_HTML_LANG ниже.
//
// Переключатель: группа ссылок #lang-switch.
// Явный выбор языка пишется в localStorage ('terms-lang') — читает только 404.html.
// У карточки термина ведёт на <id>_<язык>.html, у любой
// страницы навигатора (nav_<язык>.html, nav_<язык>_N.html) — на первую
// страницу навигатора другого языка (страницы 2+ у языков не соответствуют
// друг другу).

(function () {
  var LANG_BY_HTML_LANG = { ru: 'ru', th: 'thai' };
  var DEFAULT_LANG = 'ru';

  function getLang() {
    var attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    var code = attr.split('-')[0];
    return LANG_BY_HTML_LANG[code] || DEFAULT_LANG;
  }

  // Корень (папка share/terms/) = адрес lang.js без хвоста «js/lang.js».
  function findRoot() {
    var el = document.currentScript || document.querySelector('script[src$="js/lang.js"]');
    var src = el && el.src ? el.src : '';
    return src.replace(/js\/lang\.js(?:[?#].*)?$/, '');
  }
  var ROOT = findRoot();

  function siteUrl(rel) { return ROOT + rel; }

  window.TermsLang = { get: getLang, url: siteUrl };

  function buildTargetUrl(targetLang) {
    var path = window.location.pathname;
    var dir = path.substring(0, path.lastIndexOf('/') + 1);
    var filename = path.substring(path.lastIndexOf('/') + 1);

    if (/^nav_(ru|thai)(?:_\d+)?\.html$/.test(filename)) {
      return dir + 'nav_' + targetLang + '.html';
    }
    var bundles = filename.match(/^bundles_(?:ru|thai)(?:_\d+)?\.html$/);
    if (bundles) return dir + 'bundles_' + targetLang + '.html';
    var bundle = filename.match(/^bundle_(\d+)_(?:ru|thai)(?:_\d+)?\.html$/);
    if (bundle) return dir + 'bundle_' + bundle[1] + '_' + targetLang + '.html';
    var card = filename.match(/^(.+)_(ru|thai)\.html$/);
    if (card) return dir + card[1] + '_' + targetLang + '.html';
    return null;
  }

  var STORAGE_KEY = 'terms-lang';

  // Явный выбор языка запоминается (используется только страницей 404).
  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var current = getLang();

    // Новая разметка: группа ссылок #lang-switch с data-lang-value.
    var group = document.getElementById('lang-switch');
    if (group) {
      var links = group.querySelectorAll('[data-lang-value]');
      for (var i = 0; i < links.length; i++) {
        (function (a) {
          var lang = a.getAttribute('data-lang-value');
          if (lang === current) {
            a.setAttribute('aria-current', 'true');
            a.setAttribute('href', window.location.pathname);
            a.addEventListener('click', function (e) {
              e.preventDefault();
              saveLang(lang);
            });
            return;
          }
          a.removeAttribute('aria-current');
          var url = buildTargetUrl(lang);
          if (url) {
            a.setAttribute('href', url);
            a.addEventListener('click', function () { saveLang(lang); });
          } else {
            a.removeAttribute('href');
            a.setAttribute('aria-disabled', 'true');
          }
        })(links[i]);
      }
    }
  });
})();
