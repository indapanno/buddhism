(function () {
  "use strict";

  /* ---------- Тема ---------- */
  var THEME_KEY = "buddhism-theme";
  var themeSelect = document.getElementById("theme-select");

  function applyTheme(value) {
    var effective = value;
    if (value === "system") {
      effective = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", effective);
  }

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY) || "system";
    themeSelect.value = saved;
    applyTheme(saved);
  }

  themeSelect.addEventListener("change", function () {
    localStorage.setItem(THEME_KEY, themeSelect.value);
    applyTheme(themeSelect.value);
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
    if (themeSelect.value === "system") applyTheme("system");
  });

  initTheme();

  /* ---------- Язык (пока только ru активен) ---------- */
  var LANG_KEY = "buddhism-lang";
  var langSelect = document.getElementById("lang-select");
  var savedLang = localStorage.getItem(LANG_KEY) || "ru";
  langSelect.value = savedLang;
  langSelect.addEventListener("change", function () {
    localStorage.setItem(LANG_KEY, langSelect.value);
  });

  /* ---------- Счётчик просмотров (GoatCounter) ---------- */
  fetch("https://indapanno.goatcounter.com/counter/TOTAL.json")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      var count = parseInt(String(data.count).replace(/\D/g, ""), 10);
      if (count > 0) {
        document.getElementById("visit-count").textContent = count;
        document.getElementById("visit-counter").hidden = false;
      }
    })
    .catch(function () {});

  /* ---------- Данные и навигация ---------- */
  var DATA_URL = "json/ru.json";
  var byId = {};
  var childrenOf = {};
  var rootId = null;
  var totalEvents = 0;

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("Не удалось загрузить " + DATA_URL);
      return r.json();
    })
    .then(function (raw) {
      document.getElementById("loading").hidden = true;
      indexData(raw);
      totalEvents = raw.length;
      var introCountEl = document.getElementById("intro-count");
      if (introCountEl) introCountEl.textContent = totalEvents;
      window.addEventListener("hashchange", renderFromHash);
      renderFromHash();
    })
    .catch(function (err) {
      document.getElementById("loading").textContent = "Ошибка загрузки данных: " + err.message;
      console.error(err);
    });

  function indexData(raw) {
    raw.forEach(function (ev) {
      var id = String(ev.id);
      byId[id] = ev;
      childrenOf[id] = childrenOf[id] || [];
    });
    raw.forEach(function (ev) {
      var id = String(ev.id);
      var parentId = (ev.id_родителя === null || ev.id_родителя === undefined) ? null : String(ev.id_родителя);
      if (parentId === null) {
        if (rootId === null) rootId = id;
      } else {
        childrenOf[parentId] = childrenOf[parentId] || [];
        childrenOf[parentId].push(id);
      }
    });
  }

  function renderFromHash() {
    var match = /^#event-(.+)$/.exec(window.location.hash);
    var id = match ? match[1] : rootId;
    if (!byId[id]) id = rootId;
    render(id);
  }

  function navigateTo(id) {
    window.location.hash = "event-" + id;
  }

  /* ---------- Посещённые события ---------- */
  var VISITED_KEY = "buddhism-visited";

  function loadVisited() {
    try {
      var raw = localStorage.getItem(VISITED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveVisited(set) {
    try {
      localStorage.setItem(VISITED_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  var visitedSet = loadVisited();

  var resetBtn = document.getElementById("reset-visited");
  resetBtn.addEventListener("click", function () {
    visitedSet.clear();
    saveVisited(visitedSet);
    renderFromHash();
    if (navDrawer && !navDrawer.hidden) renderNavTree();
  });

  /* ---------- Рендер ---------- */
  var cardEl = document.getElementById("event-card");
  var breadcrumbEl = document.getElementById("breadcrumb");
  var childrenSection = document.getElementById("children-section");
  var childrenListEl = document.getElementById("children-list");
  var childrenHeading = document.getElementById("children-heading");

  function render(id) {
    var ev = byId[id];
    if (!ev) return;

    var wasVisited = visitedSet.has(id);
    if (!wasVisited) {
      visitedSet.add(id);
      saveVisited(visitedSet);
    }

    renderBreadcrumb(id);
    renderCard(ev, wasVisited);
    renderChildren(id);

    cardEl.hidden = false;
    childrenSection.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderBreadcrumb(id) {
    var chain = [];
    var cur = id;
    var guard = 0;
    while (cur && byId[cur] && guard < 100) {
      chain.unshift(cur);
      var ev = byId[cur];
      var parentId = (ev.id_родителя === null || ev.id_родителя === undefined) ? null : String(ev.id_родителя);
      cur = parentId;
      guard++;
    }

    breadcrumbEl.innerHTML = "";
    chain.forEach(function (nodeId, idx) {
      if (idx > 0) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = " › ";
        breadcrumbEl.appendChild(sep);
      }
      var isLast = idx === chain.length - 1;
      var label = byId[nodeId]["название"] || ("Событие " + nodeId);
      var branchCount = (childrenOf[nodeId] || []).length;
      if (isLast) {
        var span = document.createElement("span");
        span.className = "current";
        span.textContent = label;
        breadcrumbEl.appendChild(span);
      } else {
        var btn = document.createElement("button");
        btn.type = "button";
        if (visitedSet.has(nodeId)) btn.className = "visited";
        btn.textContent = label;
        if (branchCount > 1) {
          var badge = document.createElement("span");
          badge.className = "branch-count";
          badge.textContent = " ×" + branchCount;
          btn.appendChild(badge);
        }
        btn.addEventListener("click", (function (targetId) {
          return function () { navigateTo(targetId); };
        })(nodeId));
        breadcrumbEl.appendChild(btn);
      }
    });
  }

  function renderCard(ev, wasVisited) {
    cardEl.innerHTML = "";

    var eyebrow = document.createElement("div");
    eyebrow.className = "event-eyebrow";
    eyebrow.textContent = [ev["тип_события"], ev["ветвь"]].filter(Boolean).join(" · ");
    cardEl.appendChild(eyebrow);

    var title = document.createElement("h2");
    title.className = "event-title";
    title.textContent = ev["название"] || "";
    cardEl.appendChild(title);

    var indexLine = document.createElement("div");
    indexLine.className = "event-index";
    indexLine.textContent = "Событие " + ev.id + " из " + totalEvents;
    cardEl.appendChild(indexLine);

    var statusBlock = document.createElement("div");
    statusBlock.className = "status-block " + (wasVisited ? "visited" : "unvisited");
    statusBlock.textContent = wasVisited ? "Вы уже изучали данное событие" : "Вы ещё не изучали данное событие";
    cardEl.appendChild(statusBlock);

    var meta = document.createElement("div");
    meta.className = "event-meta";

    var dateLine = document.createElement("div");
    dateLine.className = "event-date-line";
    dateLine.textContent = "📅 " + (ev["дата"] || "");
    if (ev["достоверность_даты"]) {
      var note = document.createElement("span");
      note.className = "event-date-note";
      note.textContent = "ⓘ " + ev["достоверность_даты"];
      dateLine.appendChild(note);
    }
    meta.appendChild(dateLine);

    if (ev["место"]) {
      var place = document.createElement("div");
      place.className = "event-place-line";
      place.textContent = "📍 " + ev["место"];
      meta.appendChild(place);
    }

    cardEl.appendChild(meta);

    if (ev["причина"]) {
      cardEl.appendChild(highlightBlock("Причина", ev["причина"], "cause"));
    }

    if (ev["результат"]) {
      cardEl.appendChild(highlightBlock("Результат", ev["результат"], "result"));
    }

    if (ev["ключевые_фигуры"] && ev["ключевые_фигуры"].length) {
      cardEl.appendChild(fieldBlockList("Ключевые фигуры", ev["ключевые_фигуры"]));
    }

    var metaFields = [
      ["Время существования", ev["время_существования"]],
      ["Статус на 2026 год", ev["статус_на_2026"]],
      ["Регион распространения сегодня", ev["регион_распространения_сегодня"]],
      ["Число последователей (2026)", ev["число_последователей_2026"] === null || ev["число_последователей_2026"] === undefined ? "нет данных" : String(ev["число_последователей_2026"])]
    ];
    var grid = document.createElement("div");
    grid.className = "meta-grid";
    metaFields.forEach(function (pair) {
      if (!pair[1]) return;
      var item = document.createElement("div");
      item.className = "meta-item";
      var lbl = document.createElement("div");
      lbl.className = "field-label";
      lbl.textContent = pair[0];
      var txt = document.createElement("div");
      txt.className = "field-text";
      txt.textContent = pair[1];
      item.appendChild(lbl);
      item.appendChild(txt);
      grid.appendChild(item);
    });
    if (grid.children.length) cardEl.appendChild(grid);

    if (ev["примечание"]) {
      var note2 = document.createElement("div");
      note2.className = "note-block";
      var nlbl = document.createElement("div");
      nlbl.className = "field-label";
      nlbl.textContent = "Примечание";
      var ntxt = document.createElement("div");
      ntxt.className = "field-text";
      ntxt.textContent = ev["примечание"];
      note2.appendChild(nlbl);
      note2.appendChild(ntxt);
      cardEl.appendChild(note2);
    }

    if (ev["источники"] && ev["источники"].length) {
      var srcBlock = fieldBlockList("Источники", ev["источники"]);
      srcBlock.className += " sources-block";
      cardEl.appendChild(srcBlock);
    }
  }

  function highlightBlock(label, text, kind) {
    var block = document.createElement("div");
    block.className = "highlight-block " + kind;
    var lbl = document.createElement("div");
    lbl.className = "highlight-label";
    lbl.textContent = label;
    var txt = document.createElement("div");
    txt.className = "highlight-text";
    txt.textContent = text;
    block.appendChild(lbl);
    block.appendChild(txt);
    return block;
  }

  function fieldBlockList(label, items) {
    var block = document.createElement("div");
    block.className = "field-block";
    var lbl = document.createElement("div");
    lbl.className = "field-label";
    lbl.textContent = label;
    var ul = document.createElement("ul");
    ul.className = "field-list";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it;
      ul.appendChild(li);
    });
    block.appendChild(lbl);
    block.appendChild(ul);
    return block;
  }

  function renderChildren(id) {
    var kids = childrenOf[id] || [];
    childrenListEl.innerHTML = "";

    if (kids.length === 0) {
      childrenHeading.textContent = "Конечная точка ветви";
      var note = document.createElement("p");
      note.className = "leaf-note";
      note.textContent = "У этого события нет дочерних событий в дереве.";
      childrenListEl.appendChild(note);
      return;
    }

    childrenHeading.textContent = "Дочерние события (" + kids.length + ")";
    kids.forEach(function (childId) {
      var child = byId[childId];
      var childVisited = visitedSet.has(childId);
      var row = document.createElement("button");
      row.type = "button";
      row.className = "child-row" + (childVisited ? " visited-tile" : "");

      var dateSpan = document.createElement("span");
      dateSpan.className = "child-date";
      dateSpan.textContent = child["дата"] || "";

      var nameSpan = document.createElement("span");
      nameSpan.className = "child-name";
      nameSpan.textContent = child["название"] || ("Событие " + childId);

      var statusSpan = document.createElement("span");
      statusSpan.className = "child-status " + (childVisited ? "visited" : "unvisited");
      statusSpan.textContent = childVisited ? "Вы уже изучали данное событие" : "Вы ещё не изучали данное событие";

      row.appendChild(dateSpan);
      row.appendChild(nameSpan);
      row.appendChild(statusSpan);
      row.addEventListener("click", function () { navigateTo(childId); });
      childrenListEl.appendChild(row);
    });
  }

  /* ---------- Бургер-меню со всеми событиями ---------- */
  var menuToggle = document.getElementById("menu-toggle");
  var navBackdrop = document.getElementById("nav-backdrop");
  var navDrawer = document.getElementById("nav-drawer");
  var navClose = document.getElementById("nav-close");
  var navTreeEl = document.getElementById("nav-tree");

  function openMenu() {
    renderNavTree();
    navBackdrop.hidden = false;
    navDrawer.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    navBackdrop.hidden = true;
    navDrawer.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", openMenu);
  navClose.addEventListener("click", closeMenu);
  navBackdrop.addEventListener("click", closeMenu);
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  function renderNavTree() {
    navTreeEl.innerHTML = "";
    var rootUl = document.createElement("ul");
    var roots = Object.keys(byId).filter(function (id) {
      var ev = byId[id];
      var parentId = (ev.id_родителя === null || ev.id_родителя === undefined) ? null : String(ev.id_родителя);
      return parentId === null;
    });
    roots.forEach(function (id) {
      rootUl.appendChild(buildNavNode(id));
    });
    navTreeEl.appendChild(rootUl);
  }

  function buildNavNode(id) {
    var ev = byId[id];
    var label = ev.id + ". " + (ev["название"] || ("Событие " + id));
    var isVisited = visitedSet.has(id);
    var kids = childrenOf[id] || [];
    var li = document.createElement("li");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-item" + (isVisited ? " visited" : "");
    btn.textContent = label;
    btn.addEventListener("click", function () {
      navigateTo(id);
      closeMenu();
    });
    li.appendChild(btn);

    if (kids.length > 0) {
      var ul = document.createElement("ul");
      kids.forEach(function (childId) {
        ul.appendChild(buildNavNode(childId));
      });
      li.appendChild(ul);
    }

    return li;
  }
})();
