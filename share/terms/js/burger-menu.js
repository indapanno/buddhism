// Бургер-меню: кнопка + выезжающая панель с пунктами
// ("Навигатор", "Мой прогресс", "Добавить термин"). Определяет язык
// по имени файла текущей страницы, строит ссылки на соответствующие
// языковые версии страниц.

var BURGER_UI_STRINGS = {
  ru: {
    menuTitle: 'Меню',
    navHome: 'Навигатор',
    progress: 'Мой прогресс',
    addTerm: 'Добавить термин'
  },
  thai: {
    menuTitle: 'เมนู',
    navHome: 'หน้าหลัก',
    progress: 'ความคืบหน้าของฉัน',
    addTerm: 'เพิ่มคำศัพท์'
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
    { href: 'nav_' + lang + '.html', text: strings.navHome },
    { href: 'progress_' + lang + '.html', text: strings.progress },
    { href: 'how-to-add-term_' + lang + '.html', text: strings.addTerm }
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
