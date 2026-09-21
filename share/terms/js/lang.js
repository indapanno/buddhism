// Переключатель языка. Определяет текущий язык и "базовое имя" страницы
// по её собственному имени файла (например, anapanasati_ru.html -> base:
// "anapanasati", lang: "ru") и строит URL страницы-пары на другом языке.
// Работает одинаково для карточек терминов и для навигационной страницы.

(function () {
  function getCurrentLangAndBase() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const match = filename.match(/^(.+)_(ru|thai)\.html$/);
    if (!match) return null;
    return { base: match[1], lang: match[2] };
  }

  function buildTargetUrl(targetLang) {
    const info = getCurrentLangAndBase();
    if (!info) return null;
    const path = window.location.pathname;
    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    return dir + info.base + '_' + targetLang + '.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('lang-select');
    if (!select) return;

    const info = getCurrentLangAndBase();
    if (!info) return;

    select.value = info.lang;
    select.addEventListener('change', function () {
      const url = buildTargetUrl(select.value);
      if (url) window.location.href = url;
    });
  });
})();
