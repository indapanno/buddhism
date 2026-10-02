// Страница «Мой прогресс»: счётчик изученных терминов, скачивание отметок
// в файл и загрузка из файла (с объединением, ничего не стирается).
// Отметки хранит learned.js (window.Learned); здесь только интерфейс страницы.

(function () {
  var FORMAT = 'pali-terms-progress';
  var MAX_FILE_BYTES = 1024 * 1024; // файл со списком id столько не весит; всё больше — не наш файл
  var MAX_IDS = 5000;
  var ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

  var STR = {
    ru: {
      count: function (x, y) { return 'Изучено ' + x + ' из ' + y; },
      exportEmpty: 'Пока нет изученных терминов — сохранять нечего.',
      exportDone: function (n) { return 'Файл сохранён (терминов: ' + n + '). Он лежит в папке загрузок браузера.'; },
      importBad: 'Не удалось прочитать файл. Нужен файл, скачанный на этой странице.',
      importBig: 'Файл слишком большой для файла прогресса.',
      importDone: function (added, total) { return 'Загружено. Новых отметок: ' + added + '. Всего изучено: ' + total + '.'; },
      importNone: function (total) { return 'Новых отметок нет: всё из файла уже отмечено. Всего изучено: ' + total + '.'; },
      confirmReset: function (n) { return 'Снять отметки со всех терминов (' + n + ')? Вернуть их можно только из ранее скачанного файла.'; },
      resetDone: 'Все отметки сняты. Вернуть их можно из ранее скачанного файла.',
      rowBtn: '✓ Изучен',
      rowTitle: 'Снять отметку «Изучен»',
      prev: '← Назад',
      next: 'Далее →',
      removed: function (name) { return 'Отметка снята с «' + name + '».'; },
      undo: 'Вернуть',
      undone: function (name) { return 'Отметка возвращена: «' + name + '».'; },
      noStorage: 'Не удалось запустить страницу. Обновите её или откройте в другом браузере.'
    },
    thai: {
      count: function (x, y) { return 'เรียนแล้ว ' + x + ' จาก ' + y + ' คำ'; },
      exportEmpty: 'ยังไม่มีคำศัพท์ที่เรียนแล้ว — ไม่มีอะไรให้บันทึก',
      exportDone: function (n) { return 'บันทึกไฟล์แล้ว (จำนวนคำศัพท์: ' + n + ') ไฟล์อยู่ในโฟลเดอร์ดาวน์โหลดของเบราว์เซอร์'; },
      importBad: 'อ่านไฟล์ไม่ได้ ต้องใช้ไฟล์ที่ดาวน์โหลดจากหน้านี้',
      importBig: 'ไฟล์ใหญ่เกินไปสำหรับไฟล์ความคืบหน้า',
      importDone: function (added, total) { return 'โหลดแล้ว เครื่องหมายใหม่: ' + added + ' เรียนแล้วทั้งหมด: ' + total; },
      importNone: function (total) { return 'ไม่มีเครื่องหมายใหม่ — ทุกอย่างในไฟล์ถูกทำเครื่องหมายไว้แล้ว เรียนแล้วทั้งหมด: ' + total; },
      confirmReset: function (n) { return 'ล้างเครื่องหมายของทุกคำศัพท์ (' + n + ') หรือไม่ คืนได้จากไฟล์ที่เคยดาวน์โหลดเท่านั้น'; },
      resetDone: 'ล้างเครื่องหมายทั้งหมดแล้ว กู้คืนได้จากไฟล์ที่เคยดาวน์โหลด',
      rowBtn: '✓ เรียนแล้ว',
      rowTitle: 'ยกเลิกเครื่องหมาย “เรียนแล้ว”',
      prev: '← ก่อนหน้า',
      next: 'ถัดไป →',
      removed: function (name) { return 'ยกเลิกเครื่องหมายของ “' + name + '” แล้ว'; },
      undo: 'ย้อนกลับ',
      undone: function (name) { return 'คืนเครื่องหมายของ “' + name + '” แล้ว'; },
      noStorage: 'เริ่มหน้านี้ไม่ได้ ลองรีเฟรชหรือเปิดในเบราว์เซอร์อื่น'
    }
  };

  function pageLang() {
    return window.TermsLang.get();
  }

  function pageDir() {
    var path = window.location.pathname;
    return path.substring(0, path.lastIndexOf('/') + 1);
  }

  // Разбор файла прогресса. Возвращает {ok: true, ids: [...]} или {ok: false}.
  function parseProgressFile(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return { ok: false }; }
    if (!data || typeof data !== 'object' || data.format !== FORMAT || !Array.isArray(data.learned)) {
      return { ok: false };
    }
    var ids = [];
    data.learned.slice(0, MAX_IDS).forEach(function (id) {
      if (typeof id === 'string' && ID_RE.test(id) && ids.indexOf(id) === -1) ids.push(id);
    });
    return { ok: true, ids: ids };
  }

  function todayStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  document.addEventListener('DOMContentLoaded', function () {
    var countEl = document.getElementById('progress-count');
    var fillEl = document.getElementById('progress-bar-fill');
    var exportBtn = document.getElementById('progress-export-btn');
    var importBtn = document.getElementById('progress-import-btn');
    var importInput = document.getElementById('progress-import-input');
    var statusEl = document.getElementById('progress-status');
    var listEl = document.getElementById('progress-list');
    var pagEl = document.getElementById('progress-pagination');
    var emptyEl = document.getElementById('progress-list-empty');
    var resetBtn = document.getElementById('progress-reset-btn');
    var confirmBox = document.getElementById('progress-confirm');
    var confirmText = document.getElementById('progress-confirm-text');
    var confirmYes = document.getElementById('progress-confirm-yes');
    var confirmNo = document.getElementById('progress-confirm-no');
    if (!countEl || !exportBtn || !importBtn || !importInput || !statusEl) return;

    var lang = pageLang();
    var s = STR[lang] || STR.ru;
    var num = function (n) { return lang === 'thai' && window.toThaiNumerals ? window.toThaiNumerals(n) : n; };
    var termIds = null; // id терминов текущего языка (для счётчика)
    var termNames = {}; // id -> название на текущем языке
    var page = 1; // текущая страница списка изученных
    var PAGE_SIZE = 10;

    function say(text, isError) {
      statusEl.textContent = text;
      statusEl.classList.toggle('is-error', !!isError);
    }

    // Сообщение со ссылкой «Вернуть» (отмена снятия отметки)
    function sayUndo(text, id) {
      statusEl.classList.remove('is-error');
      statusEl.textContent = text + ' ';
      var a = document.createElement('a');
      a.href = '#';
      a.setAttribute('data-undo-id', id);
      a.textContent = s.undo;
      statusEl.appendChild(a);
    }

    if (!window.Learned) { say(s.noStorage, true); return; }

    function renderCount() {
      var learned = window.Learned.all();
      var x = learned.length;
      var y = null;
      if (termIds) {
        // считаем только те отметки, для которых термин есть в текущем списке
        x = learned.filter(function (id) { return termIds.indexOf(id) !== -1; }).length;
        y = termIds.length;
      }
      countEl.textContent = y === null ? String(num(x)) : s.count(num(x), num(y));
      if (fillEl) fillEl.style.width = (y ? Math.round(x / y * 100) : 0) + '%';
      if (resetBtn) resetBtn.disabled = learned.length === 0; // сбрасывать нечего
      return x;
    }

    // --- Список изученных терминов (пагинация без перезагрузки страницы) ---
    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function termLabel(id) {
      var n = termNames[id] || id;
      return n.charAt(0).toUpperCase() + n.slice(1);
    }

    function renderList() {
      if (!listEl || !termIds) return; // список терминов ещё не загружен
      var ids = window.Learned.all().filter(function (id) { return termIds.indexOf(id) !== -1; });
      ids.sort(function (a, b) {
        return termLabel(a).localeCompare(termLabel(b), lang === 'thai' ? 'th' : 'ru');
      });
      var pages = Math.max(1, Math.ceil(ids.length / PAGE_SIZE));
      if (page > pages) page = pages;
      if (page < 1) page = 1;

      if (emptyEl) emptyEl.hidden = ids.length > 0;
      listEl.hidden = ids.length === 0;

      var slice = ids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      listEl.innerHTML = slice.map(function (id) {
        return '<li class="progress-row"><a href="' + escapeHtml(id) + '_' + lang + '.html">' + escapeHtml(termLabel(id)) + '</a>'
          + '<button type="button" class="learned-btn is-learned" data-remove-id="' + escapeHtml(id) + '" title="' + escapeHtml(s.rowTitle) + '">' + s.rowBtn + '</button></li>';
      }).join('');

      if (pagEl) {
        if (pages <= 1) {
          pagEl.hidden = true;
          pagEl.innerHTML = '';
        } else {
          var parts = [];
          if (page > 1) parts.push('<a href="#" class="page-link" data-page="' + (page - 1) + '">' + s.prev + '</a>');
          for (var p = 1; p <= pages; p++) {
            parts.push(p === page
              ? '<span class="page-current">' + num(p) + '</span>'
              : '<a href="#" class="page-link" data-page="' + p + '">' + num(p) + '</a>');
          }
          if (page < pages) parts.push('<a href="#" class="page-link" data-page="' + (page + 1) + '">' + s.next + '</a>');
          pagEl.innerHTML = parts.join('');
          pagEl.hidden = false;
        }
      }
    }

    if (listEl) {
      // Клик «Изучен» в строке: снять отметку, строка исчезает
      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('button[data-remove-id]') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-remove-id');
        var idx = Array.prototype.indexOf.call(listEl.querySelectorAll('button[data-remove-id]'), btn);
        window.Learned.set(id, false);
        renderCount();
        renderList();
        sayUndo(s.removed(termLabel(id)), id);
        var left = listEl.querySelectorAll('button[data-remove-id]');
        if (left.length) left[Math.max(0, Math.min(idx, left.length - 1))].focus(); // фокус не теряется
      });
    }

    if (pagEl) {
      pagEl.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[data-page]') : null;
        if (!a) return;
        e.preventDefault();
        page = parseInt(a.getAttribute('data-page'), 10) || 1;
        renderList();
      });
    }

    // «Вернуть» в строке статуса
    statusEl.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-undo-id]') : null;
      if (!a) return;
      e.preventDefault();
      var id = a.getAttribute('data-undo-id');
      window.Learned.set(id, true);
      renderCount();
      renderList();
      say(s.undone(termLabel(id)), false);
    });

    renderCount();
    fetch(pageDir() + '../json/index_' + lang + '.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        termIds = (data.terms || []).map(function (t) { return t.id; });
        (data.terms || []).forEach(function (t) {
          termNames[t.id] = (lang === 'thai' ? t.term_thai : t.term_ru) || t.id;
        });
        renderCount();
        renderList();
      })
      .catch(function () { /* счётчик останется без «из Y» */ });

    // --- Скачать ---
    exportBtn.addEventListener('click', function () {
      var ids = window.Learned.all().sort();
      if (ids.length === 0) { say(s.exportEmpty, true); return; }
      var payload = { format: FORMAT, version: 1, exported: new Date().toISOString(), learned: ids };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'pali-terms-progress-' + todayStamp() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      say(s.exportDone(num(ids.length)), false);
    });

    // --- Загрузить ---
    importBtn.addEventListener('click', function () { importInput.click(); });

    importInput.addEventListener('change', function () {
      var file = importInput.files && importInput.files[0];
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) { say(s.importBig, true); importInput.value = ''; return; }
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = parseProgressFile(String(reader.result));
        if (!parsed.ok) { say(s.importBad, true); }
        else {
          var added = window.Learned.merge(parsed.ids);
          var total = renderCount(); // то же число, что и в счётчике
          renderList();
          say(added > 0 ? s.importDone(num(added), num(total)) : s.importNone(num(total)), false);
        }
        importInput.value = ''; // чтобы тот же файл можно было выбрать снова
      };
      reader.onerror = function () { say(s.importBad, true); importInput.value = ''; };
      reader.readAsText(file);
    });

    // --- Сбросить все отметки (с подтверждением на месте кнопки) ---
    if (resetBtn && confirmBox && confirmText && confirmYes && confirmNo) {
      var closeConfirm = function () {
        confirmBox.hidden = true;
        resetBtn.hidden = false;
      };

      resetBtn.addEventListener('click', function () {
        if (resetBtn.disabled) return;
        confirmText.textContent = s.confirmReset(num(renderCount()));
        resetBtn.hidden = true;
        confirmBox.hidden = false;
        confirmNo.focus(); // безопасный вариант по умолчанию
      });

      confirmNo.addEventListener('click', function () {
        closeConfirm();
        resetBtn.focus();
      });

      confirmYes.addEventListener('click', function () {
        window.Learned.clear();
        renderCount();
        renderList();
        closeConfirm();
        say(s.resetDone, false);
        resetBtn.focus();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !confirmBox.hidden) { closeConfirm(); resetBtn.focus(); }
      });
    }

    window.addEventListener('storage', function () {
      renderCount();
      renderList();
    });
  });
})();
