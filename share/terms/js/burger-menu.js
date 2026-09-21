// Бургер-меню: кнопка + выезжающая панель с двумя пунктами
// ("Как добавить термин", "Как перевести термин"). Определяет язык
// по имени файла текущей страницы, строит ссылки на соответствующие
// языковые версии инструкций.

var BURGER_UI_STRINGS = {
  ru: {
    menuTitle: 'Меню',
    addTerm: 'Добавить термин',
    translateTerm: 'Перевести термин'
  },
  thai: {
    // Заполняется на этапе тайской локализации
  }
};

function getPageLang() {
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);
  var match = filename.match(/_(ru|thai)\.html$/);
  return match ? match[1] : 'ru';
}

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('menu-toggle');
  var backdrop = document.getElementById('nav-backdrop');
  var drawer = document.getElementById('nav-drawer');
  var closeBtn = document.getElementById('nav-drawer-close');
  var list = document.getElementById('nav-menu-list');
  if (!toggle || !backdrop || !drawer || !list) return;

  var lang = getPageLang();
  var strings = BURGER_UI_STRINGS[lang] || BURGER_UI_STRINGS.ru;

  var items = [
    { href: 'how-to-add-term_' + lang + '.html', text: strings.addTerm },
    { href: 'how-to-translate-term_' + lang + '.html', text: strings.translateTerm }
  ];

  list.innerHTML = items.map(function (item) {
    return '<li><a href="' + item.href + '">' + item.text + '</a></li>';
  }).join('');

  function openMenu() {
    backdrop.hidden = false;
    drawer.hidden = false;
  }

  function closeMenu() {
    backdrop.hidden = true;
    drawer.hidden = true;
  }

  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
});
