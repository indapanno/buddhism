// Переключатель темы: системная (по умолчанию) / светлая / тёмная.
// Выбор запоминается в localStorage. "Системная" реально проверяет
// настройку ОС через matchMedia (в CSS переменные по умолчанию — тёмные,
// поэтому светлая тема применяется только когда ОС явно предпочитает светлую).

(function () {
  const STORAGE_KEY = 'terms-theme';

  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  function applyTheme(theme) {
    const resolved = (theme === 'system') ? (systemPrefersLight() ? 'light' : 'dark') : theme;
    if (resolved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  }

  function setTheme(theme) {
    if (theme === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme);
  }

  applyTheme(getSavedTheme());

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (getSavedTheme() === 'system') applyTheme('system');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('theme-select');
    if (!select) return;
    select.value = getSavedTheme();
    select.addEventListener('change', function () {
      setTheme(select.value);
    });
  });
})();
