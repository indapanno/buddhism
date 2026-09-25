# Навигатор по истории палийских терминов — для исследователей и разработчиков

Технический документ. Описывает архитектуру, схему данных и способ развёртывания
статического сайта. Для инструкции по добавлению термина через веб-интерфейс см.
[how-to-add-term_ru.html](../../how-to-add-term_ru.html).

## Технический стек

- Frontend: чистый HTML/CSS/vanilla JS, без фреймворков и сборщиков (webpack/vite не используются).
- Сборка: Node.js-скрипт, выполняется в GitHub Actions (не требует Node локально, если не редактируешь код сборки).
- Хостинг: GitHub Pages, `Deploy from branch main, /root`.
- Данные: JSON-файлы в git, без базы данных и бэкенда.
- Аналитика: GoatCounter (внешний счётчик, без cookies).

## Структура репозитория

```
share/terms/
├── json/
│   ├── <id>_ru.json          # источник истины, по одному файлу на язык на термин
│   ├── <id>_thai.json
│   ├── index_ru.json         # манифест для поиска — ГЕНЕРИРУЕТСЯ, не редактировать
│   └── index_thai.json
├── js/
│   ├── render-term.js        # общий рендер карточки (Node + браузер)
│   ├── term-prompt-ru.js     # текст промта для ИИ-генерации термина (RU)
│   ├── term-prompt-thai.js   # то же, TH
│   ├── term-prompt-widget.js # логика кнопки «Скопировать промт»
│   ├── search.js, lang.js, theme.js, burger-menu.js,
│   │   footer-counter.js, term-count.js, thai-numerals.js
├── css/style.css
├── _template_ru.html         # шаблон карточки — редактируется вручную
├── _template_thai.html
├── _template_nav_ru.html     # шаблон страницы навигатора
├── _template_nav_thai.html
├── <id>_ru.html               # ГЕНЕРИРУЕТСЯ из шаблона + JSON, не редактировать
├── <id>_thai.html
├── nav_ru.html, nav_ru_2.html, …   # ГЕНЕРИРУЕТСЯ, пагинация по 10 терминов/стр
├── nav_thai.html, …
├── how-to-add-term_ru.html    # статичный, вручную
├── how-to-add-term_thai.html
├── how-to-translate-term_ru.html
├── how-to-translate-term_thai.html
└── docs/for-researchers/ru.md, thai.md   # этот документ

.github/
├── scripts/build-terms.js     # Node-скрипт сборки
└── workflows/build-terms.yml  # триггер: push в share/terms/json/**
```

**Правило:** файлы `<id>_*.html` и `nav_*.html` — вывод сборки. Ручная правка
переживёт до следующего пуша в `json/**`, после которого будет перезаписана.
Редактируются вручную только `_template_*.html`, `js/*.js`, `css/style.css`,
`how-to-*.html`, `docs/**`.

## Архитектура сборки

1. Push с изменениями в `share/terms/json/**` триггерит `build-terms.yml`.
2. `build-terms.js` читает все `<id>_ru.json` / `<id>_thai.json`, объединяет id по обоим языкам.
3. Для каждого id генерирует карточку на каждом языке (`<id>_ru.html`, `<id>_thai.html`) — если перевода нет, рендерит блок «перевод отсутствует» со ссылкой на `how-to-translate-term_*.html`.
4. Пересобирает `index_ru.json` / `index_thai.json` (манифест для клиентского поиска: `id`, `term_ru`/`term_thai`, `later_count`).
5. Пересобирает страницы навигатора с пагинацией (10 терминов/стр, реальные статичные файлы `nav_ru_2.html` и т.д., не `?page=N` — важно для индексации и работы без JS).
6. Удаляет осиротевшие карточки (id, которого больше нет в json/) и лишние страницы пагинации.
7. Коммитит результат с флагом `[skip ci]` (иначе бесконечный цикл триггеров).

`render-term.js` — общий модуль между Node (используется через `require()` в
`build-terms.js`) и браузером (сейчас на сгенерированных страницах не задействован,
контент уже запечён в HTML на этапе сборки; модуль оставлен на случай будущего
клиентского рендера, напр. live-превью в валидаторе).

## Схема термина (JSON)

Один файл на язык. Единственное различие в ключах между языками: `term_ru` ↔ `term_thai`.

| Ключ | Тип | Описание |
|---|---|---|
| `id` | string | латиницей, строчными, без диакритики — совпадает с именем файла |
| `term_ru` / `term_thai` | string | термин на языке карточки; капитализируется автоматически при сборке |
| `term_iast` | string | транслитерация IAST, не капитализируется |
| `term_composition` | object | `{is_compound, components: [{part_iast, part_meaning}], note}` — см. ниже |
| `origin` | object | `{type, source_tradition, attestation_before_term, etymology_versions[]}` |
| `dating` | array | `[{type, value, comment}]` |
| `attribution` | object | `{traditional, academic, consensus}` |
| `recorded_by` | string | кем зафиксирован письменно |
| `school_tradition` | string | школа/пласт традиции |
| `reason_introduced` | string | зачем термин понадобился — простым языком |
| `interpretation` | string | толкование — простым языком |
| `language` | string | обычно `"пали"`, с уточнением для сложных случаев |
| `sources` | array | `[{status, title, location, transmission_tradition, language, source_type, discrepancies}]` |
| `later_mentions` | array | `[{id, parent, author_id, date_updated, updated_by, reason_for_update, what_is_new, school_tradition, source_type, language, source: {title}}]` — тайская схема проще, без `parent`/`author_id`/`source_type`/`language` |

**`term_composition`** — для терминов, состоящих из двух и более САМОСТОЯТЕЛЬНЫХ
пали-слов (напр. `paṭicca`+`samuppāda`, `sati`+`upaṭṭhāna`). Разбор на приставку и
корень одного слова (напр. `du-`+`kha` в `dukkha`) сюда не относится — это
народная этимология, для неё `origin.etymology_versions`. `render-term.js` рендерит
блок «Из каких слов состоит» только при `is_compound: true`.

Полный эталонный пример — любой существующий файл, напр. `json/dukkha_ru.json`.

## Развёртывание у себя (fork)

1. Fork репозитория `indapanno/buddhism`.
2. Settings → Pages → Source: `Deploy from a branch`, Branch: `main`, `/root`.
3. Settings → Actions → General → Workflow permissions: `Read and write permissions` (нужно `build-terms.yml` для автокоммита).
4. Сайт будет доступен на `https://<username>.github.io/buddhism/share/terms/`.
5. Локальная разработка: `node .github/scripts/build-terms.js` из корня репозитория — пересоберёт HTML без пуша, для проверки перед коммитом.

## Известные ограничения

- Тайский перевод пока сделан только для одного термина (`dukkha`) как proof of concept; переводчик — не носитель языка, перед массовой публикацией стоит верифицировать носителем.
- Промты для ИИ-генерации (`term-prompt-ru.js`/`-thai.js`) снижают, но не исключают ошибки: разные ИИ по-разному интерпретируют инструкции, возможны фактические неточности и неверная атрибуция источников — обязательна проверка человеком перед merge.
- Схема JSON не формализована как JSON Schema — валидация штатно отсутствует (см. «Направления развития»).

## Направления развития

1. **Кросс-ссылки между терминами.** При сборке автоматически превращать упоминания id уже существующих терминов (в `later_mentions[].source.title`, `term_composition`, тексте полей) в `<a href="<id>_ru.html">` — растущий словарь становится связным графом понятий без ручной разметки.
2. **Формальная JSON Schema** (`term.schema.json`, draft-07/2020-12) — единый источник истины для валидатора и CI, плюс автодополнение в редакторах.
3. **Онлайн-валидатор JSON** — клиентская страница, вставляешь JSON от ИИ, получаешь построчный список несоответствий схеме до создания PR.
4. **GitHub Action на pull_request** — автоматическая валидация присланного JSON, комментарий с ошибками в PR автору, опционально авто-merge при отсутствии ошибок.
5. **Санитарная проверка ссылок на источники** — эвристическая проверка формата `sources[].location` (диапазоны номеров никай и т.п.), ловит явные несоответствия без претензии на фактчекинг.
6. **`sitemap.xml` + `robots.txt`** — генерируются сборщиком, улучшают индексацию растущего сайта поисковиками.
7. **Тесты для `build-terms.js`** — smoke-тесты на встроенном `node:test` (Node 18+, без зависимостей): генерация карточки не падает на валидном JSON, капитализация работает, `renderComposition` пуст при `is_compound: false`.

Репозиторий: https://github.com/indapanno/buddhism
