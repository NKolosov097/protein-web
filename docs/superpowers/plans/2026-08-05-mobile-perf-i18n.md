# Protein Docker — Mobile / Performance / i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать Protein Docker играбельным и плавным на телефоне и двуязычным (RU/EN) с выбором языка, не сломав десктопное поведение.

**Architecture:** Проект — набор классических `<script>` в одном глобальном скоупе; порядок загрузки в `index.html` несущий. Добавляются четыре изолированных модуля (`perf.js` — профиль качества, `mobile.js` — мобильная оболочка UI, `i18n.js` + два словаря — переводы, `selftest.js` — самопроверка) и один CSS-файл (`mobile.css`). Существующие модули правятся точечно: `controls.js` получает тач-ветку поверх вынесенных чистых функций перемещения, `scene.js` — dirty-render и профиль качества.

**Tech Stack:** Ванильный ES2015+ в классических `<script>`, 3Dmol.js с CDN, CSS media queries, localStorage. Ни сборки, ни бандлера, ни npm — и это осознанное свойство проекта, его нельзя менять.

## Global Constraints

- **Никакой сборки, бандлера, npm, package.json, тест-раннера.** Все файлы — статика, открываемая напрямую из `index.html`. Это записано в `CLAUDE.md` и должно остаться верным.
- **Все файлы `js/` — классические `<script>`, без `import`/`export`.** Все объявления верхнего уровня живут в одном глобальном скоупе и вызываются по имени. Новый файл обязан быть вставлен в правильную точку цепочки зависимостей в `index.html`.
- **`js/state.js` грузится первым, `js/main.js` — последним.** Не нарушать.
- **Соглашение `gen`:** любая новая асинхронная работа захватывает `const myGen = gen` и выходит при `myGen !== gen`.
- **Скоринг дублирован на двух языках:** `fitEnergy()` в `js/scoring.js` и `contact_affinity()` в `backend/server.py` реализуют одну формулу. Этот план **не меняет** формулу; если правка её задела — синхронизировать оба файла.
- **Порог мобильной вёрстки ровно один:** `@media (max-width: 820px), (pointer: coarse)`. Не заводить других порогов.
- **Профиль качества:** `QUALITY ∈ {'low','high'}`, предпочтение `QUALITY_PREF ∈ {'auto','low','high'}` в localStorage под ключом `pd_quality`. `auto` → `low` при `(pointer: coarse)`, иначе `high`.
- **Язык:** `LANG ∈ {'en','ru'}` в localStorage под ключом `pd_lang`. При отсутствии значения — по языку браузера: префикс `ru` → `ru`, всё остальное → `en`.
- **Новые пользовательские строки идут в оба словаря** (`js/lang-en.js` и `js/lang-ru.js`). Никаких новых литералов с текстом в модулях после Фазы 3.
- **Существующие ключи localStorage не переименовывать:** `pd_last_level`, `pd_levels`, `pd_board`, `pd_score_seen`.
- **Все тапабельные зоны на мобиле ≥ 44px** по меньшей стороне.
- **Проверка — в браузере.** Автотестов в проекте нет; вводится крошечный самопроверочный харнесс `js/selftest.js`, запускаемый флагом `?selftest` в URL. Он покрывает только чистые функции (без DOM и без 3D). Всё остальное проверяется вручную по точным шагам, указанным в задачах.

---

## File Structure

**Создаются:**

| Файл | Ответственность |
|---|---|
| `js/selftest.js` | Мини-харнесс самопроверки: `stEq()`, `runSelfTest()`. Запускается только при `?selftest` в URL. Растёт по фазам. |
| `js/perf.js` | Профиль качества: `IS_TOUCH`, `QUALITY_PREF`, `QUALITY`, `resolveQuality()`, `qLow()`, `setQualityPref()`, `viewerOptions()`, кап `devicePixelRatio`. |
| `css/mobile.css` | Вся мобильная вёрстка: медиазапрос, компактный хедер, bottom-sheet, переключатель режимов, модалки на весь экран, safe-area. |
| `js/mobile.js` | Мобильная оболочка UI: открытие/закрытие bottom-sheet, переключатель режимов (`syncModeBar`), модалка лидеров, кнопка качества (`syncQualityBtn`). |
| `js/i18n.js` | Рантайм переводов: `detectLang()`, `LANG`, `t()`, `numFmt()`, `applyI18n()`, `setLang()`, `refreshDynamicText()`, `levelName()`, дропдаун 🌐. |
| `js/lang-en.js` | Словарь `I18N_EN` — плоский объект `ключ → строка`. |
| `js/lang-ru.js` | Словарь `I18N_RU` — тот же набор ключей. |

**Изменяются:**

| Файл | Что меняется |
|---|---|
| `index.html` | Новые `<script>`/`<link>` в правильном порядке; мобильный DOM (`#hdrScore`, `#btnLang`, `#langMenu`, `#btnMenu`, `#modeBar`, `#actionsRest`, `#sheetBack`, `#btnQuality`, `#btnBoard`); атрибуты `data-i18n*` на статике. |
| `js/state.js` | Новые кросс-модульные флаги: `depthLig`, `touchMode`. |
| `js/scene.js` | `viewerOptions()` в `createViewer`; dirty-render (`resetDrawState`, `drawKey`, `pocketAnimates`); вынос HUD в `updateMeter`; поверхность у кармана на `low`; строки → `t()`. |
| `js/controls.js` | Вынос `ligMove`/`ligRotate`/`ligDepth`/`snapToTrack`; тач-обработчики; хит-радиус 48px на тач; субсэмплинг в `anchorFor`. |
| `js/coach.js` | Разделение `coachRender` на `coachShapes` + существующий `coachTick`; тач-вариант текстов; строки → `t()`. |
| `js/hud.js` | `setScore`/`setBest`/`syncScore`; `numFmt` вместо `toLocaleString('ru-RU')`; строки → `t()`. |
| `js/study.js` | `syncInfoBtn()`; `studyTap()` для тача; троттл 60 мс на `low`; строки → `t()`. |
| `js/levels.js` | `renderLevels` через `t()` и `levelName()`. |
| `js/levels-data.js` | Весь текст выносится в словари; остаются `id`, `pdb`, `open`, `pocket.type/value`. |
| `js/scoring.js` | `findPocket` берёт метку кармана из словаря; строки `quality()` → `t()`. |
| `css/styles.css` | Базовые стили дропдауна языка и кнопки-иконки (используются и на десктопе). |
| `CLAUDE.md`, `README.md` | Документация новых файлов, ключей localStorage, правила про оба словаря. |

**Порядок загрузки в `index.html` после всех правок:**

```
state → perf → lang-en → lang-ru → i18n → levels-data → geometry → scoring →
scene → controls → study → hud → tutorial → levels → coach → mobile → selftest → main
```

`perf.js` идёт сразу за `state.js`: кап `devicePixelRatio` применяется на самой загрузке файла, то есть заведомо раньше `createViewer()` внутри `init()`. `selftest.js` — предпоследним, чтобы видеть все функции. `main.js` остаётся последним.

---

# Фаза 1 — Производительность

Цель фазы: снять подвисания при вращении на телефоне и убрать холостые рендеры. Визуально на десктопе не должно измениться ничего.

### Task 1: Харнесс самопроверки + профиль качества

**Files:**
- Create: `js/selftest.js`
- Create: `js/perf.js`
- Modify: `index.html` (два новых `<script>`)

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `stEq(name, got, want)` — сравнивает через `JSON.stringify`, печатает `PASS`/`FAIL`, копит счётчики.
  - `runSelfTest()` — точка, куда следующие задачи добавляют проверки.
  - `IS_TOUCH: boolean`
  - `resolveQuality(saved: string, coarse: boolean) → 'low' | 'high'`
  - `QUALITY_PREF: 'auto'|'low'|'high'`, `QUALITY: 'low'|'high'`
  - `qLow() → boolean`
  - `setQualityPref(pref: 'auto'|'low'|'high') → void` (пишет `pd_quality`, перезагружает страницу)
  - `viewerOptions() → object` — опции для `$3Dmol.createViewer`

- [ ] **Step 1: Написать падающую проверку**

Создать `js/selftest.js`:

```js
/* ============================================================
   SELF-TEST — крошечный харнесс проверки чистых функций.
   Запускается только при `?selftest` в URL: открой
   index.html?selftest и смотри консоль. Автотест-раннера в
   проекте нет (нет ни сборки, ни npm) — это его замена для
   логики без DOM и без 3D.
   ============================================================ */
const SELFTEST = /[?&]selftest\b/.test(location.search);
let stPass = 0, stFail = 0;

function stEq(name, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok) stPass++; else stFail++;
  if(ok) console.log('PASS  ' + name);
  else console.error('FAIL  ' + name +
    '\n   got:  ' + JSON.stringify(got) +
    '\n   want: ' + JSON.stringify(want));
}

function runSelfTest(){
  // ---- perf: разрешение профиля качества ----
  stEq('resolveQuality: auto + coarse → low',   resolveQuality('auto',  true),  'low');
  stEq('resolveQuality: auto + fine → high',    resolveQuality('auto',  false), 'high');
  stEq('resolveQuality: пусто + coarse → low',  resolveQuality(null,    true),  'low');
  stEq('resolveQuality: пусто + fine → high',   resolveQuality('',      false), 'high');
  stEq('resolveQuality: явный low перебивает',  resolveQuality('low',   false), 'low');
  stEq('resolveQuality: явный high перебивает', resolveQuality('high',  true),  'high');
  stEq('resolveQuality: мусор → как auto',      resolveQuality('bogus', true),  'low');
}

if(SELFTEST){
  window.addEventListener('load', ()=>{
    stPass = 0; stFail = 0;
    runSelfTest();
    console.log('--- selftest: ' + stPass + ' passed, ' + stFail + ' failed ---');
  });
}
```

Подключить в `index.html` предпоследним, перед `js/main.js`:

```html
<script src="js/selftest.js"></script>
<script src="js/main.js"></script>
```

- [ ] **Step 2: Запустить и убедиться, что проверка падает**

Запустить `python -m http.server` в корне проекта, открыть `http://localhost:8000/index.html?selftest`.

Ожидается: в консоли `Uncaught ReferenceError: resolveQuality is not defined` (функции ещё нет), итоговой строки `--- selftest ---` нет.

- [ ] **Step 3: Минимальная реализация**

Создать `js/perf.js`:

```js
/* ============================================================
   PERF — профиль качества графики.
   ------------------------------------------------------------
   Один профиль на сессию: 'low' (телефоны и слабые GPU) или
   'high' (как было). Предпочтение игрока живёт в localStorage
   под 'pd_quality' и может быть 'auto' | 'low' | 'high'.

   Файл грузится СРАЗУ ПОСЛЕ state.js, потому что кап
   devicePixelRatio применяется здесь же, на загрузке — то есть
   заведомо раньше createViewer() внутри init() (main.js).
   ============================================================ */

// грубый указатель (палец) — основной признак телефона/планшета
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

// Чистая функция, поэтому её можно проверить в selftest.js:
// явный выбор игрока перебивает всё, иначе решает тип указателя.
function resolveQuality(saved, coarse){
  if(saved === 'low' || saved === 'high') return saved;
  return coarse ? 'low' : 'high';
}

let QUALITY_PREF = localStorage.getItem('pd_quality') || 'auto';
if(QUALITY_PREF !== 'auto' && QUALITY_PREF !== 'low' && QUALITY_PREF !== 'high') QUALITY_PREF = 'auto';
let QUALITY = resolveQuality(QUALITY_PREF, IS_TOUCH);
function qLow(){ return QUALITY === 'low'; }

/* ---------- кап devicePixelRatio ----------
   У 3Dmol нет API для пиксельного отношения: в сборке нет
   setPixelRatio, а Renderer.setSize читает window.devicePixelRatio
   напрямую. Поэтому единственный путь — подменить геттер ДО
   создания вьюера. На телефоне с DPR 3 это срезает площадь кадра
   в 4 раза. */
const DPR_CAP = 1.5;
if(qLow()){
  const real = window.devicePixelRatio || 1;
  if(real > DPR_CAP){
    try{
      Object.defineProperty(window, 'devicePixelRatio', { get: ()=>DPR_CAP, configurable: true });
    }catch(e){
      console.warn('[perf] не удалось ограничить devicePixelRatio:', e);
    }
  }
}

/* опции для $3Dmol.createViewer: на 'low' грубее ленты и без сглаживания */
function viewerOptions(){
  const o = { backgroundColor: 0x05060f };
  if(qLow()){ o.cartoonQuality = 3; o.antialias = false; }
  return o;
}

/* смена предпочтения. Кап DPR и cartoonQuality применяются только при
   создании вьюера, поэтому честный способ применить их — перезагрузка;
   структура PDB к этому моменту уже в кэше браузера, так что это быстро. */
function setQualityPref(pref){
  if(pref !== 'auto' && pref !== 'low' && pref !== 'high') return;
  localStorage.setItem('pd_quality', pref);
  location.reload();
}
```

Подключить в `index.html` сразу после `js/state.js`:

```html
<script src="js/state.js"></script>
<script src="js/perf.js"></script>
```

- [ ] **Step 4: Запустить и убедиться, что проверки проходят**

Обновить `http://localhost:8000/index.html?selftest`.

Ожидается: 7 строк `PASS`, затем `--- selftest: 7 passed, 0 failed ---`.

- [ ] **Step 5: Коммит**

```bash
git add js/selftest.js js/perf.js index.html
git commit -m "feat(perf): quality profile (auto/low/high) + self-test harness"
```

---

### Task 2: Применить профиль качества к вьюеру

**Files:**
- Modify: `js/scene.js:9` (вызов `createViewer` в `init`)
- Modify: `js/coach.js:302` (offscreen-вьюер превью уровня)

**Interfaces:**
- Consumes: `viewerOptions()`, `qLow()` из Task 1.
- Produces: ничего нового.

- [ ] **Step 1: Заменить опции создания вьюера**

В `js/scene.js`, функция `init()`, было:

```js
  viewer = $3Dmol.createViewer("viewer", { backgroundColor:0x05060f });
```

стало:

```js
  // опции берём из профиля качества (js/perf.js): на 'low' — грубее
  // ленты и без сглаживания, плюс там же ограничен devicePixelRatio
  viewer = $3Dmol.createViewer("viewer", viewerOptions());
```

- [ ] **Step 2: Облегчить offscreen-превью следующего уровня**

В `js/coach.js`, функция `renderLevelPreview`, было:

```js
    try{ v = $3Dmol.createViewer(host, {backgroundColor:0x0a0e22}); }
```

стало:

```js
    // превью — картинка 480×340 в PNG, качество ленты здесь не важно,
    // а на телефоне этот вьюер живёт одновременно с основным
    try{ v = $3Dmol.createViewer(host, qLow()
      ? {backgroundColor:0x0a0e22, cartoonQuality:3, antialias:false}
      : {backgroundColor:0x0a0e22}); }
```

И ниже, в том же файле, поверхность превью строить только на `high`:

было

```js
        v.addSurface($3Dmol.SurfaceType.VDW, {opacity:0.5, colorscheme:'cyanCarbon'}, {hetflag:false});
```

стало

```js
        if(!qLow()) v.addSurface($3Dmol.SurfaceType.VDW, {opacity:0.5, colorscheme:'cyanCarbon'}, {hetflag:false});
```

- [ ] **Step 3: Измерить размер буфера кадра**

Открыть `http://localhost:8000/index.html`, дождаться загрузки уровня, в консоли выполнить:

```js
const c = document.querySelector('#viewer canvas');
console.log('backing store:', c.width + '×' + c.height,
            '| css:', c.clientWidth + '×' + c.clientHeight,
            '| DPR:', window.devicePixelRatio, '| QUALITY:', QUALITY);
```

Ожидается на десктопе (`QUALITY: high`): `backing store` = css × реальный DPR, как и раньше.

Затем включить в DevTools эмуляцию устройства (iPhone 12 Pro, 390×844, DPR 3) и **перезагрузить страницу**, повторить ту же команду.

Ожидается: `QUALITY: low`, `DPR: 1.5`, `backing store` ≈ `585×1266`, а не `1170×2532` — то есть в 4 раза меньше пикселей на кадр.

Если `DPR` остался 3, значит подмена геттера в этом браузере не сработала — записать это в ветку и переходить к fallback: в `init()` после `createViewer` уменьшить `canvas.width/height` вручную и растянуть CSS до 100%. Не выдавать пункт за выполненный, пока цифра не подтверждена.

- [ ] **Step 4: Проверить, что картинка не развалилась**

Открыть в обычном (не эмулированном) окне и в эмуляции iPhone: уровень 1 загружается, лента белка на месте, цинк золотой, зелёный маркер кармана пульсирует, молекула-лекарство видна. На эмуляции лента заметно грубее — это ожидаемо.

- [ ] **Step 5: Коммит**

```bash
git add js/scene.js js/coach.js
git commit -m "perf: apply quality profile to main and preview viewers"
```

---

### Task 3: Тач-события выставляют camInteracting (главный фикс лагов)

Это правка, снимающая описанное пользователем подвисание при вращении. `camInteracting` (`js/state.js:50`) сейчас выставляется только в mouse-обработчиках, поэтому на телефоне `animate()` (`js/scene.js:293`) не пропускает перерисовку геймплея и каждые 45 мс пересобирает ~20 шейпов и делает второй `viewer.render()` поверх того, который 3Dmol уже сделал для поворота.

**Files:**
- Modify: `js/controls.js` (в конец файла — тач-блок)
- Modify: `css/styles.css` (`touch-action` на `#viewer`)

**Interfaces:**
- Consumes: `camInteracting` из `state.js`.
- Produces: ничего (Task 10 достроит этот же блок до полноценного управления молекулой).

- [ ] **Step 1: Измерить проблему до фикса**

Открыть `http://localhost:8000/index.html`, включить эмуляцию iPhone 12 Pro, дождаться загрузки уровня, пропустить обучение (`ПРОПУСТИТЬ ОБУЧЕНИЕ ✕`), затем в консоли выполнить:

```js
window.__drawN = 0;
const _draw = draw;
draw = function(t){ window.__drawN++; return _draw(t); };
window.__drawN = 0;
```

Провести пальцем (мышью при эмуляции тача) по фону 3 секунды, вращая структуру, отпустить и выполнить:

```js
console.log('draw() за время вращения:', window.__drawN);
```

Ожидается **до фикса**: число заметно больше нуля (примерно 60 при 3 секундах, ~20 в секунду). Записать значение — это база для сравнения.

- [ ] **Step 2: Добавить тач-обработчики флага**

В конец `js/controls.js` добавить:

```js
/* ---------- ТАЧ: только флаг «камера в работе» ----------
   3Dmol сам вешает touchstart/touchmove/touchend на свой canvas и
   маппит их на собственные mouse-обработчики, поэтому орбита и пинч
   на телефоне работали и раньше. Чего не хватало — camInteracting:
   он выставлялся ТОЛЬКО в mouse-ветке, из-за чего animate() не
   замирал во время тач-вращения и каждые 45 мс пересобирал шейпы и
   делал второй render поверх рендера 3Dmol. Отсюда и подвисания.

   Здесь обрабатывается только флаг. Полное управление молекулой
   пальцем добавляется в js/controls.js ниже (см. план, Task 10). */
el('viewer').addEventListener('touchstart', ()=>{ camInteracting = true; }, {passive:true, capture:true});
function releaseCamTouch(e){ camInteracting = e.touches.length > 0; }
el('viewer').addEventListener('touchend',    releaseCamTouch, {passive:true, capture:true});
el('viewer').addEventListener('touchcancel', releaseCamTouch, {passive:true, capture:true});
```

- [ ] **Step 3: Запретить браузерные жесты на сцене**

В `css/styles.css`, было:

```css
#viewer{position:fixed;inset:0;width:100vw;height:100vh}
```

стало:

```css
/* touch-action:none — иначе на телефоне жест по сцене скроллит страницу,
   а двойной тап зумит вёрстку вместо структуры */
#viewer{position:fixed;inset:0;width:100vw;height:100vh;touch-action:none}
```

- [ ] **Step 4: Измерить после фикса**

Перезагрузить страницу в той же эмуляции iPhone, пропустить обучение, повторить инструментирование из Step 1 и снова вращать структуру пальцем 3 секунды.

Ожидается: `draw() за время вращения: 0`. Структура вращается плавно, без рывков.

Дополнительно убедиться, что после отпускания палец-независимая жизнь вернулась: подвигать молекулу стрелками на клавиатуре (в эмуляции доступна) — шкала «КОНТАКТ С КАРМАНОМ» реагирует, значит `camInteracting` снялся.

Проверить десктоп без эмуляции: вращение фоном мышью, `Shift`+мышь, колесо — как раньше.

- [ ] **Step 5: Коммит**

```bash
git add js/controls.js css/styles.css
git commit -m "fix(perf): set camInteracting on touch so the gameplay loop stops fighting 3Dmol

On touch devices camInteracting was never set (mouse handlers only), so
animate() kept rebuilding ~20 shapes and firing a second render on top of
3Dmol's own every 45ms while the user was rotating. That was the stutter."
```

---

### Task 4: Dirty-render — не перерисовывать неизменившийся кадр

Сейчас `draw()` каждый тик безусловно вызывает `removeAllShapes()`, создаёт заново ~20 сфер и цилиндров и делает `viewer.render()`. Расчёт (`minDistance`, `fitEnergy`, `quality`) дёшев и должен продолжать идти каждый тик, чтобы шкала, звук и автопереходы обучения работали как раньше; пропускать нужно только пересборку шейпов и рендер.

**Files:**
- Modify: `js/scene.js` (`draw`, `animate`, `loadLevel`)
- Modify: `js/coach.js` (разделить `coachRender` на `coachShapes` + `coachTick`)
- Modify: `js/state.js` (флаг `depthLig`, нужен `userBusy()`)

**Interfaces:**
- Consumes: `qLow()` из Task 1; `camInteracting`, `draggingLig`, `rotatingLig` из существующего кода.
- Produces:
  - `resetDrawState() → void` — сбрасывает кэш кадра, следующий `draw()` гарантированно перерисует.
  - `pocketAnimates() → boolean`
  - `userBusy() → boolean`
  - `updateMeter(q, mind) → void`
  - `coachShapes(world, center) → void` (в `coach.js`, вместо `coachRender`)

- [ ] **Step 1: Добавить флаг depthLig в общее состояние**

В `js/state.js`, было:

```js
let camInteracting = false;
```

стало:

```js
let camInteracting = false;
// молекулу тянут пальцем в режиме «глубина» (см. touchMode в controls.js).
// Живёт здесь, потому что читается и в scene.js (pocketAnimates), и в controls.js.
let depthLig = false;
```

- [ ] **Step 2: Разделить coachRender на шейпы и логику**

В `js/coach.js`, было:

```js
function coachRender(world, center, mind, fit){
```

и в конце этой функции:

```js
  coachTick(mind, fit);
}
```

стало — переименовать функцию и убрать из неё вызов `coachTick` (сам `coachTick` остаётся в файле без изменений):

```js
/* ---------- per-frame hook (вызывается из draw в scene.js) ----------
   Только рисование: светящаяся дорожка + позиция курсора «схвати здесь».
   Проверка автопереходов (coachTick) вызывается из draw() ОТДЕЛЬНО и
   раньше, потому что она должна идти каждый тик, даже когда кадр не
   перерисовывается (dirty-render, см. scene.js). */
function coachShapes(world, center){
```

и последняя строка функции — просто закрывающая скобка, без `coachTick(mind, fit);`:

```js
  } else {
    cur.style.display = 'none';
  }
}
```

- [ ] **Step 3: Перестроить draw() под dirty-render**

В `js/scene.js` заменить тело `draw()` так, чтобы дешёвая часть шла всегда, а дорогая — по условию. Полностью заменить блок от `function draw(t=0){` до строки `  const inPocket = mind <= 5;` включительно:

```js
/* ---------- какие кадры «живые» ---------- */
// игрок держит палец/кнопку на сцене (камера или молекула)
function userBusy(){ return camInteracting || draggingLig || rotatingLig || depthLig; }
// пульсирует ли маркер кармана. На 'low' пульс идёт только пока игрок
// что-то делает: иначе неподвижная сцена никогда не станет «чистой»
// и рендеры будут идти в покое, греша батарею.
function pocketAnimates(){ return !coachHidePocket && (!qLow() || userBusy()); }

// подпись кадра: если она не изменилась и ничего не анимируется — шейпы
// пересобирать не нужно, старые остаются на месте и корректно вращаются
// вместе со сценой силами самого 3Dmol.
let lastDrawKey = null;
function drawKey(inPocket){
  return [lig.x.toFixed(3), lig.y.toFixed(3), lig.z.toFixed(3),
          lig.rx.toFixed(3), lig.ry.toFixed(3), lig.rz.toFixed(3),
          coachHidePocket?1:0, coachHideDrug?1:0, coachBlinkDrug?1:0,
          showSolution?1:0, coachTrack?1:0, inPocket?1:0].join('|');
}
// вызвать, когда сцена пересобрана извне (новый уровень, смена языка,
// выход из режима изучения) — следующий draw() обязательно перерисует
function resetDrawState(){ lastDrawKey = null; }

/* ---------- HUD (дёшево, обновляется каждый тик) ---------- */
function updateMeter(q, mind){
  el('barFill').style.width = q.pct+'%';
  el('barFill').style.background = q.color;
  el('barFill').style.boxShadow = '0 0 14px '+q.color;
  el('status').textContent = q.status;
  el('status').style.color = q.color;
  el('hint').textContent = q.hint;
  el('distVal').textContent = mind<900 ? mind.toFixed(2) : '—';
}

/* ---------- draw ligand + force lines ---------- */
function draw(t=0){
  // STUDY MODE: the study code manages highlights (setStyle) and its own HTML tooltip,
  // and renders on demand — so we stop the gameplay animation entirely here (no per-frame
  // re-render of the heavy stick view, no ligand shapes).
  if(infoMode) return;

  // ---- дешёвая часть: идёт КАЖДЫЙ тик ----
  const {mind, world, center} = minDistance(t);
  const fit = fitEnergy(world);
  const q = quality(fit);
  const inPocket = mind <= 5;
  updateMeter(q, mind);
  zoneSound(mind);                       // «дзинь» на входе в карман
  if(coachActive) coachTick(mind, fit);  // автопереходы обучения — до гейта, они меняют флаги

  // ---- гейт: пересобирать шейпы только если кадр реально изменился ----
  const animating = pocketAnimates() || showSolution || coachBlinkDrug || !!coachTrack;
  const key = drawKey(inPocket);
  const dirty = animating || key !== lastDrawKey;
  lastDrawKey = key;
  if(!dirty) return mind;

  viewer.removeAllShapes();
  // NOTE: labels are NOT cleared here — they are managed by syncLabels() below so they
  // are not destroyed/recreated every frame (that caused the labels to flicker/"jump").
  const {color} = q;
```

- [ ] **Step 4: Убрать из хвоста draw() то, что переехало вверх**

Ниже в той же функции удалить блок HUD и звука (они теперь в `updateMeter`/выше) и переименовать вызов coach-рисования. Было:

```js
  // HUD
  el('barFill').style.width = pct+'%';
  el('barFill').style.background = color;
  el('barFill').style.boxShadow = '0 0 14px '+color;
  el('status').textContent = status;
  el('status').style.color = color;
  el('hint').textContent = hint;
  el('distVal').textContent = mind<900 ? mind.toFixed(2) : '—';

  // sound — a short pleasant blip only when entering the pocket (no drone)
  zoneSound(mind);

  // guided tutorial overlay: track + "grab here" cursor + auto-advance (adds shapes, so before render)
  if(coachActive) coachRender(world, center, mind, fit);

  viewer.render();
  return mind;
}
```

стало:

```js
  // guided tutorial overlay: track + "grab here" cursor (adds shapes, so before render).
  // Автопереходы (coachTick) уже вызваны выше, до гейта dirty-render.
  if(coachActive) coachShapes(world, center);

  viewer.render();
  return mind;
}
```

- [ ] **Step 5: Заменить статичный пульс кармана и убрать старые переменные**

Внутри `draw()` блок маркера кармана использовал `t` безусловно. Было:

```js
    const pulse = showSolution ? 1.0 + 0.15*Math.sin(t*1.5) : 2.4 + 0.5*Math.sin(t*1.5);
```

стало:

```js
    // на 'low' в покое пульс замирает (см. pocketAnimates), иначе неподвижная
    // сцена никогда не станет «чистой» и рендеры пойдут вхолостую
    const ph = pocketAnimates() ? Math.sin(t*1.5) : 0;
    const pulse = showSolution ? 1.0 + 0.15*ph : 2.4 + 0.5*ph;
```

Проверить, что в теле `draw()` больше нет обращений к удалённым `pct`, `status`, `hint` — вместо них теперь `q.pct`, `q.status`, `q.hint`, а `color` объявлен через `const {color} = q;` в Step 3.

- [ ] **Step 6: Сбрасывать кэш кадра на новом уровне и снизить каденс на low**

В `js/scene.js`, функция `loadLevel`, было:

```js
  proteinAtoms = []; hoverAtoms = []; pocket = null; wasInPocket = false;
```

стало:

```js
  proteinAtoms = []; hoverAtoms = []; pocket = null; wasInPocket = false;
  resetDrawState();                    // новая сцена → первый кадр обязан перерисоваться
```

В `js/study.js`, функция `setInfoMode`, в ветке выключения режима изучения, было:

```js
    removeStudyTarget();
    restoreNormal(); hideTip();
```

стало:

```js
    removeStudyTarget();
    restoreNormal(); hideTip();
    resetDrawState();                  // сцена пересобрана — вернуть шейпы геймплея
```

В `js/scene.js`, функция `animate`, было:

```js
    if(ts - lastFrameTs >= 45){               // ~20 fps cap
```

стало:

```js
    if(ts - lastFrameTs >= (qLow() ? 80 : 45)){   // ~12 fps на 'low', ~20 fps на 'high'
```

- [ ] **Step 7: Измерить холостые рендеры**

Открыть `http://localhost:8000/index.html`, включить эмуляцию iPhone 12 Pro, перезагрузить, дождаться загрузки уровня 1, пропустить обучение, выключить подсказку (кнопка `💡 ПОДСКАЗКА` не должна быть зелёной), затем в консоли:

```js
window.__shapeN = 0;
const _ras = viewer.removeAllShapes.bind(viewer);
viewer.removeAllShapes = function(){ window.__shapeN++; return _ras(); };
window.__shapeN = 0;
setTimeout(()=>console.log('пересборок шейпов за 5 с покоя:', window.__shapeN), 5000);
```

Не касаться экрана 5 секунд.

Ожидается: `пересборок шейпов за 5 с покоя: 0`.

Затем повторить тот же замер, **включив** `💡 ПОДСКАЗКА` (мигает эталон): ожидается число около 60 (12 fps × 5 с) — анимация подсказки должна перерисовываться, это правильно.

Затем в обычном окне (`QUALITY: high`): за 5 секунд покоя ожидается около 100 (пульс маркера идёт всегда на `high`, ~20 fps) — десктопное поведение не изменилось.

- [ ] **Step 8: Проверить, что игра не сломалась**

В эмуляции iPhone и в обычном окне пройти по шагам: уровень 1 → обучение проходится целиком (все 6 шагов, дорожка светится, эталон мигает, кнопка «ТЕСТ ЛЕКАРСТВА» пульсирует и срабатывает, появляется модалка с превью следующей мишени) → переключиться на уровень 3 через `🗂 УРОВНИ` → подвести молекулу стрелками, шкала и «до цели» меняются, при входе в карман срабатывает звук (включить 🔊) → `🔎 ИЗУЧЕНИЕ` включается и выключается, после выключения шейпы геймплея возвращаются.

- [ ] **Step 9: Коммит**

```bash
git add js/scene.js js/coach.js js/state.js js/study.js
git commit -m "perf: dirty-render — rebuild shapes only when the frame actually changed

The cheap part (distance, energy, meter, sound, coach auto-advance) still runs
every tick; removeAllShapes + ~20 addSphere/addCylinder + render now happen only
when the ligand moved, a visibility flag flipped, or something is animating. On
the low profile the pocket pulse freezes while idle, so an untouched scene costs
zero renders."
```

---

### Task 5: Убрать полноатомные проекции из горячих путей

`anchorFor()` (`js/controls.js:44`) проецирует **все** атомы белка (тысячи) на каждое событие зума. `pickAtom()` в `study.js` делает то же на каждом hover; троттл там уже есть (40 мс, `study.js:258`) — вопреки формулировке спеки его не нужно вводить, только ослабить на `low`.

**Files:**
- Modify: `js/controls.js:44-55` (`anchorFor`)
- Modify: `js/study.js:254-263` (троттл hover)

**Interfaces:**
- Consumes: `qLow()`, `downsample()` (`js/geometry.js:91`).
- Produces: ничего нового.

- [ ] **Step 1: Субсэмплировать атомы в anchorFor**

В `js/controls.js`, было:

```js
function anchorFor(mx, my){
  if(!proteinAtoms.length) return null;
  const scr = viewer.modelToScreen(proteinAtoms);
```

стало:

```js
// Проецируется не весь белок, а прореженная выборка: точка привязки нужна
// только чтобы «приколоть» место под курсором при зуме, и промах на пару
// ангстрем незаметен, а полноатомная проекция на каждый тик колеса дорога.
let anchorPool = null, anchorPoolGen = -1;
function anchorAtoms(){
  if(anchorPoolGen !== gen || !anchorPool){
    anchorPool = downsample(proteinAtoms, 1200);
    anchorPoolGen = gen;
  }
  return anchorPool;
}
function anchorFor(mx, my){
  if(!proteinAtoms.length) return null;
  const pool = anchorAtoms();
  const scr = viewer.modelToScreen(pool);
```

и в той же функции заменить обращение к исходному массиву. Было:

```js
  if(best<0 || bd > 300*300) return null;
  const a=proteinAtoms[best];
  return {x:a.x, y:a.y, z:a.z};
```

стало:

```js
  if(best<0 || bd > 300*300) return null;
  const a=pool[best];
  return {x:a.x, y:a.y, z:a.z};
```

- [ ] **Step 2: Ослабить троттл hover на низком профиле**

В `js/study.js`, было:

```js
  const t=performance.now();
  if(t-lastHoverT < 40) return;    // throttle ~25 times/sec
```

стало:

```js
  const t=performance.now();
  // pickAtom проецирует все hoverAtoms, так что на слабых машинах реже
  if(t-lastHoverT < (qLow() ? 60 : 40)) return;    // ~17 / ~25 раз в секунду
```

- [ ] **Step 3: Проверить зум и режим изучения**

Открыть `http://localhost:8000/index.html`, дождаться уровня 1, пропустить обучение. Навести курсор на конкретный участок ленты у края структуры и покрутить колесо вверх-вниз: точка под курсором должна оставаться примерно на месте (в пределах пары пикселей), как и раньше.

Включить `🔎 ИЗУЧЕНИЕ`, поводить курсором по ленте и по золотому цинку: подсказка появляется, подсветка следует за курсором, цинк по-прежнему выигрывает приоритет.

- [ ] **Step 4: Коммит**

```bash
git add js/controls.js js/study.js
git commit -m "perf: project a downsampled atom pool for wheel-anchored zoom"
```

---

### Task 6: Поверхность только вокруг кармана на низком профиле

Полупрозрачная VDW-поверхность на весь белок (`js/scene.js:135`) — самый дорогой элемент кадра по fill-rate, а прозрачность его удваивает. На `low` она строится только для остатков рядом с карманом: дешевле и заодно яснее показывает цель.

**Files:**
- Modify: `js/scene.js:134-144` (`addProteinSurface`)
- Modify: `js/study.js:80-90` (`restoreNormal` — вызывает `addProteinSurface`)

**Interfaces:**
- Consumes: `qLow()`, `pocket`, `proteinAtoms`.
- Produces: `pocketResidueSel() → object | null` — селектор 3Dmol для остатков около кармана.

- [ ] **Step 1: Собрать селектор остатков вокруг кармана**

В `js/scene.js`, перед `addProteinSurface`, добавить:

```js
/* Селектор «остатки рядом с карманом» для облегчённой поверхности.
   Собирается из тех же атомов, что и POCKET_ATOMS (см. buildPocketAtoms
   в scoring.js), но радиусом пошире: поверхность должна закрывать стенку
   кармана целиком, а не только зону контакта. Возвращает null, если
   карман ещё не найден — тогда вызывающий строит поверхность как раньше. */
const SURF_R = 16;
function pocketResidueSel(){
  if(!pocket || !proteinAtoms.length) return null;
  const R2 = SURF_R*SURF_R, byChain = {};
  for(const a of proteinAtoms){
    if(a.het) continue;
    const dx=a.x-pocket.x, dy=a.y-pocket.y, dz=a.z-pocket.z;
    if(dx*dx+dy*dy+dz*dz > R2) continue;
    const c = a.chain || '';
    (byChain[c] = byChain[c] || new Set()).add(a.resi);
  }
  const chains = Object.keys(byChain);
  if(!chains.length) return null;
  // 3Dmol понимает {chain:[...], resi:[...]} как пересечение множеств.
  // Остатки с одинаковым номером в разных цепях тоже попадут — для
  // полупрозрачной подсветки кармана это приемлемо и заметно дешевле,
  // чем строить поверхность отдельным вызовом на каждую цепь.
  const resi = [];
  chains.forEach(c => byChain[c].forEach(r => resi.push(r)));
  return { hetflag:false, chain:chains, resi:resi };
}
```

- [ ] **Step 2: Использовать селектор в addProteinSurface**

В `js/scene.js`, было:

```js
function addProteinSurface(op){
  const surfP = viewer.addSurface($3Dmol.SurfaceType.VDW,
    {opacity:op, colorscheme:'cyanCarbon'}, {hetflag:false});
```

стало:

```js
function addProteinSurface(op){
  // на 'low' — только стенка кармана вместо всего белка: прозрачная VDW
  // поверхность на всю структуру самая дорогая часть кадра по fill-rate
  const sel = (qLow() && pocketResidueSel()) || {hetflag:false};
  const surfP = viewer.addSurface($3Dmol.SurfaceType.VDW,
    {opacity:op, colorscheme:'cyanCarbon'}, sel);
```

- [ ] **Step 3: Убедиться, что селектор принят 3Dmol**

Открыть `http://localhost:8000/index.html` в эмуляции iPhone 12 Pro, перезагрузить, дождаться уровня 1, в консоли:

```js
console.log('QUALITY:', QUALITY, '| селектор:', JSON.stringify(pocketResidueSel()).slice(0, 200));
```

Ожидается: `QUALITY: low`, и селектор вида `{"hetflag":false,"chain":["A","B"],"resi":[171,172,...]}` с непустым `resi`.

Визуально: белок отрисован лентами, а вокруг зелёного маркера цели видна голубоватая полупрозрачная «шуба» — она не покрывает структуру целиком. Если поверхности не видно вообще — форма селектора не подошла; проверить в консоли `viewer.addSurface($3Dmol.SurfaceType.VDW, {opacity:0.55, colorscheme:'cyanCarbon'}, pocketResidueSel())` и подобрать форму (следующий вариант — перебрать цепи и вызвать `addSurface` на каждую с её собственным списком `resi`). Не отмечать шаг выполненным, пока поверхность не видна.

В обычном окне (`high`): поверхность по-прежнему на всём белке.

- [ ] **Step 4: Проверить взаимодействие с режимом изучения**

В эмуляции iPhone: включить `🔎 ИЗУЧЕНИЕ` — поверхность исчезает (её снимает `removeProteinSurface` в `dimAll`), ленты видны. Выключить — поверхность у кармана возвращается. Переключить уровень на 4 (`KRAS G12C`) и обратно: поверхность каждый раз строится вокруг нового кармана.

- [ ] **Step 5: Коммит**

```bash
git add js/scene.js
git commit -m "perf: build the translucent VDW surface only around the pocket on the low profile"
```

---

### Task 7: Кнопка выбора качества

Профиль уже работает; здесь появляется способ им управлять, общий для десктопа и мобилы (`#actions` на мобиле переезжает в bottom-sheet как есть, поэтому кнопка нужна одна).

**Files:**
- Modify: `index.html:49-57` (блок `#actions`)
- Modify: `js/perf.js` (UI-часть: `syncQualityBtn`, обработчик)
- Modify: `js/selftest.js` (проверка цикла предпочтений)

**Interfaces:**
- Consumes: `QUALITY_PREF`, `setQualityPref()`, `qLow()` из Task 1.
- Produces:
  - `nextQualityPref(pref) → 'auto'|'low'|'high'` — чистая функция, циклический перебор.
  - `syncQualityBtn() → void` — обновляет подпись кнопки.

- [ ] **Step 1: Написать падающую проверку**

В `js/selftest.js`, в конец `runSelfTest()`, добавить:

```js
  // ---- perf: цикл предпочтения качества ----
  stEq('nextQualityPref: auto → low',  nextQualityPref('auto'), 'low');
  stEq('nextQualityPref: low → high',  nextQualityPref('low'),  'high');
  stEq('nextQualityPref: high → auto', nextQualityPref('high'), 'auto');
  stEq('nextQualityPref: мусор → low', nextQualityPref('zzz'),  'low');
```

- [ ] **Step 2: Запустить и убедиться, что проверка падает**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `Uncaught ReferenceError: nextQualityPref is not defined`, итоговая строка `--- selftest ---` не печатается.

- [ ] **Step 3: Реализация**

В `js/perf.js`, в конец файла, добавить:

```js
/* ---------- кнопка «ГРАФИКА» ----------
   Циклический перебор auto → low → high → auto. Подпись показывает
   текущее предпочтение и, для auto, что оно выбрало на этом устройстве. */
function nextQualityPref(pref){
  if(pref === 'auto') return 'low';
  if(pref === 'low')  return 'high';
  if(pref === 'high') return 'auto';
  return 'low';
}
function syncQualityBtn(){
  const b = el('btnQuality');
  if(!b) return;
  const name = QUALITY_PREF === 'auto' ? ('АВТО (' + (qLow() ? 'лёгкая' : 'красивая') + ')')
             : QUALITY_PREF === 'low'  ? 'ЛЁГКАЯ'
             : 'КРАСИВАЯ';
  b.textContent = '⚙ ГРАФИКА: ' + name;
}
el('btnQuality').onclick = ()=> setQualityPref(nextQualityPref(QUALITY_PREF));
syncQualityBtn();
```

В `index.html`, блок `#actions`, было:

```html
  <button class="b-ghost" id="btnGuide">❓ ОБ ИГРЕ</button>
```

стало:

```html
  <button class="b-ghost" id="btnGuide">❓ ОБ ИГРЕ</button>
  <button class="b-ghost" id="btnQuality">⚙ ГРАФИКА</button>
```

Важно: `perf.js` грузится до `index.html`-разметки? Нет — скрипты стоят в конце документа, поэтому `el('btnQuality')` доступен. Но `perf.js` подключён **вторым**, до остальных модулей, а разметка выше него в документе — значит элемент уже существует. Проверить это шагом 4.

- [ ] **Step 4: Запустить проверки и кнопку**

Открыть `http://localhost:8000/index.html?selftest`: ожидается `--- selftest: 11 passed, 0 failed ---`.

Открыть `http://localhost:8000/index.html`: в правом нижнем меню есть кнопка `⚙ ГРАФИКА: АВТО (красивая)`. Нажать — страница перезагружается, кнопка показывает `⚙ ГРАФИКА: ЛЁГКАЯ`, в консоли `QUALITY` равно `low`, лента заметно грубее, поверхность только у кармана. Нажать ещё — `КРАСИВАЯ`, поверхность на всём белке. Нажать ещё — вернулось `АВТО (красивая)`.

Если в консоли `TypeError: Cannot set properties of null (setting 'onclick')` — значит разметка ниже скрипта; тогда перенести обработчик и `syncQualityBtn()` в конец `js/mobile.js` (Task 9), а в `perf.js` оставить только `nextQualityPref` и `syncQualityBtn`.

- [ ] **Step 5: Коммит**

```bash
git add index.html js/perf.js js/selftest.js
git commit -m "feat(perf): graphics quality button cycling auto/low/high"
```

---

**Контрольная точка Фазы 1.** Перед переходом к Фазе 2 подтвердить на реальном телефоне (открыть страницу с телефона в той же сети: `python -m http.server` и адрес `http://<ip-компьютера>:8000`): вращение структуры пальцем идёт плавно, без рывков и подвисаний. Это единственная проверка, которую эмулятор дать не может — он не воспроизводит fill-rate мобильного GPU. Если плавность не подтвердилась, не двигаться дальше, а вернуться к замерам Task 3 и Task 6 на самом устройстве.

---

# Фаза 2 — Мобильная вёрстка и тач-управление

### Task 8: Мобильная вёрстка

Ключевой приём: три нижние панели (`#modeBar`, `#meter`, `#actions`) оборачиваются в один контейнер `#bottomBar`, который на десктопе объявлен `display:contents` — то есть полностью прозрачен, и `position:fixed` детей работает точно как раньше. На мобиле контейнер превращается в обычный flex-столбик, и высоты панелей складываются сами, без хрупких захардкоженных отступов.

**Files:**
- Modify: `index.html` (обёртка `#bottomBar`, `#modeBar`, `#hdrScore`, `#btnMenu`, `#actionsRest`, `#btnBoard`, `#sheetBack`, `<link>` на `mobile.css`)
- Modify: `css/styles.css` (базовые правила: `.mobileOnly`, `#bottomBar`, скрытые по умолчанию элементы)
- Create: `css/mobile.css`

**Interfaces:**
- Consumes: ничего.
- Produces: DOM-контракт для Task 9: `#btnMenu`, `#actionsRest`, `#sheetBack`, `#modeBar` (кнопки с `data-mode`), `#btnBoard`, `#hdrScore`, класс `#actionsRest.open`, класс `#lb.asModal`, класс `body.coaching.coach-modes`.

- [ ] **Step 1: Обернуть нижние панели и добавить мобильные элементы**

Внимание на порядок блоков в текущем файле: `#meter` (строки 29–38), затем `#help` (40–47), затем `#actions` (49–57). Панель `#help` в обёртку **не входит** — она остаётся слева снизу на десктопе и полностью скрыта на мобиле, поэтому её нужно вынести из заменяемого диапазона, а не завернуть внутрь.

В `index.html` заменить блок строк 29–57 (`#meter`, `#help`, `#actions`) на приведённый ниже: `#help` идёт первым, **до** обёртки, и сохраняется без изменений.

```html
<div id="help" class="panel">
  <div><b>ЛЕКАРСТВО</b> <span style="color:#6f8bbf">(мышь)</span></div>
  <div>🖱 тащи молекулу — двигать</div>
  <div>🖱 правый клик + тащи — вращать</div>
  <div>колесо над молекулой — глубже / ближе</div>
  <div style="margin-top:6px;color:#6f8bbf"><b style="color:var(--cyan)">КАМЕРА:</b> тащи фон — поворот · <kbd>Shift</kbd>+мышь — сдвиг · колесо — зум</div>
  <div style="margin-top:5px;color:#6f8bbf">Клавиши: <kbd>← ↑ → ↓</kbd> <kbd>W</kbd>/<kbd>S</kbd> двигать · <kbd>Q E A D Z C</kbd> вращать</div>
</div>
```

Далее — сама обёртка:

```html
<!-- Нижние панели живут в одной обёртке: на десктопе она display:contents
     (полностью прозрачна, дети позиционируются fixed как раньше), на
     мобиле становится flex-столбиком, и высоты складываются сами. -->
<div id="bottomBar">

  <div id="modeBar" class="mobileOnly">
    <button data-mode="move" class="on">✋ ДВИГАТЬ</button>
    <button data-mode="rotate">🔄 ВРАЩАТЬ</button>
    <button data-mode="depth">↕ ГЛУБИНА</button>
  </div>

  <div id="meter" class="panel">
    <div id="mission">🎯 <b>Задача:</b> приведи молекулу-ключ в зелёный карман и заткни «выключатель» рака</div>
    <div class="mrow"><span>КОНТАКТ С КАРМАНОМ</span><span id="status">—</span></div>
    <div class="bar"><div id="barFill"></div></div>
    <div id="hint">—</div>
    <div class="mrow" style="margin-top:6px;color:#6f8bbf">
      <span>до цели: <b id="distVal">—</b> Å</span>
      <span>≤ 5 Å = в кармане</span>
    </div>
  </div>

  <div id="actions" class="panel">
    <button class="b-dock" id="btnDock">▶ ТЕСТ ЛЕКАРСТВА</button>
    <!-- на мобиле этот блок уезжает в выдвижной лист по кнопке ☰ -->
    <div id="actionsRest">
      <button class="b-ghost" id="btnSolve">💡 ПОДСКАЗКА</button>
      <button class="b-ghost" id="btnLevels">🗂 УРОВНИ</button>
      <button class="b-ghost" id="btnInfo">🔎 ИЗУЧЕНИЕ</button>
      <button class="b-ghost" id="btnCoach">🎓 ОБУЧЕНИЕ</button>
      <button class="b-ghost" id="btnReset">↺ СБРОС</button>
      <button class="b-ghost" id="btnGuide">❓ ОБ ИГРЕ</button>
      <button class="b-ghost" id="btnQuality">⚙ ГРАФИКА</button>
      <button class="b-ghost mobileOnly" id="btnBoard">🏆 ЛИДЕРЫ</button>
    </div>
  </div>

</div>

<!-- затемнение под выдвижным листом и модалкой лидеров -->
<div id="sheetBack"></div>
```

В том же файле, в блоке `#hdr`, было:

```html
<div id="hdr" class="panel">
  <div id="hdrText">
    <h1>PROTEIN&nbsp;DOCKER</h1>
    <div class="sub" id="hdrSub">МИШЕНЬ: —</div>
  </div>
  <button class="iconBtn" id="btnSound" title="Звук вкл/выкл">🔇</button>
</div>
```

стало:

```html
<div id="hdr" class="panel">
  <div id="hdrText">
    <h1>PROTEIN&nbsp;DOCKER</h1>
    <div class="sub" id="hdrSub">МИШЕНЬ: —</div>
    <!-- счёт на мобиле переезжает сюда: панель #score там скрыта -->
    <div class="sub mobileOnly" id="hdrScore"></div>
  </div>
  <button class="iconBtn" id="btnSound" title="Звук вкл/выкл">🔇</button>
  <button class="iconBtn mobileOnly" id="btnMenu" title="Меню">☰</button>
</div>
```

И подключить мобильный CSS вторым, после основного:

```html
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/mobile.css">
```

- [ ] **Step 2: Базовые правила в styles.css**

В `css/styles.css`, сразу после блока `:root{...}` и `*{box-sizing:border-box}`, добавить:

```css
/* элементы, существующие только в мобильной вёрстке (см. css/mobile.css) */
.mobileOnly{display:none}
/* обёртка нижних панелей: на десктопе прозрачна, дети остаются fixed */
#bottomBar{display:contents}
/* по умолчанию скрыты: переключатель режимов, затемнение выдвижного листа */
#modeBar{display:none}
#sheetBack{display:none}
```

В том же файле, в блоке `#actions`, добавить правило для вложенного контейнера — было:

```css
#actions{bottom:18px;right:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
```

стало:

```css
#actions{bottom:18px;right:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
/* на десктопе вложенный блок просто продолжает столбик кнопок */
#actionsRest{display:flex;flex-direction:column;gap:8px}
```

- [ ] **Step 3: Создать css/mobile.css**

```css
/* ============================================================
   МОБИЛЬНАЯ ВЁРСТКА
   ------------------------------------------------------------
   Единственный порог во всём проекте: узкий экран ИЛИ грубый
   указатель (палец). Других медиазапросов по ширине не вводить.

   Раскладка снизу вверх: переключатель режимов → метр → кнопка
   «ТЕСТ ЛЕКАРСТВА». Все три лежат в #bottomBar, который здесь
   становится flex-столбиком, поэтому отступы не захардкожены и
   не разъезжаются, когда текст подсказки меняет высоту метра.
   ============================================================ */
@media (max-width: 820px), (pointer: coarse){

  /* ---------- включаем мобильные элементы ---------- */
  .mobileOnly{display:block}
  #modeBar{display:flex}

  /* ---------- хедер: компактный, в одну строку ---------- */
  #hdr{top:6px;left:6px;right:6px;padding:8px 10px;gap:8px}
  #hdrText{flex:1;min-width:0}
  #hdr h1{font-size:12px;letter-spacing:1.5px}
  #hdrSub{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #hdrScore{font-size:10px;color:var(--cyan);letter-spacing:1px;margin-top:2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .iconBtn{width:44px;height:44px;font-size:19px}   /* минимум 44px под палец */

  /* ---------- панели, которых на телефоне нет ---------- */
  /* #score схлопнут в #hdrScore, #lb открывается кнопкой 🏆 из листа,
     #help описывал управление мышью — на тач-устройстве он просто неверен */
  #score, #lb, #help{display:none}

  /* ---------- нижний стек ---------- */
  #bottomBar{position:fixed;z-index:6;left:6px;right:6px;bottom:0;
    display:flex;flex-direction:column;gap:6px;
    padding-bottom:calc(6px + env(safe-area-inset-bottom))}
  /* дети перестают позиционироваться сами — их раскладывает стек */
  #meter, #actions{position:static;left:auto;right:auto;bottom:auto;
    transform:none;width:auto;max-width:none}
  #meter{padding:9px 12px}
  #mission{font-size:11px;margin-bottom:7px;padding-bottom:7px}
  #hint{font-size:10.5px}
  .mrow{font-size:11px}
  #actions{padding:0;border:none;background:none;box-shadow:none;backdrop-filter:none}
  #btnDock{width:100%;padding:15px 16px;font-size:15px}

  /* ---------- переключатель режимов ---------- */
  #modeBar{gap:6px}
  #modeBar button{flex:1;min-height:44px;padding:9px 4px;font-size:11px;letter-spacing:.5px;
    background:var(--panel);color:#7f9cc9;border:1px solid var(--line);border-radius:12px;
    backdrop-filter:blur(10px)}
  #modeBar button.on{background:linear-gradient(90deg,rgba(34,224,255,.20),rgba(161,91,255,.20));
    color:var(--cyan);border-color:var(--cyan);box-shadow:0 0 12px rgba(33,224,255,.25)}

  /* ---------- выдвижной лист с остальными кнопками ---------- */
  #actionsRest{position:fixed;z-index:71;left:0;right:0;bottom:0;
    padding:14px 12px calc(18px + env(safe-area-inset-bottom));
    gap:10px;border-radius:18px 18px 0 0;
    background:linear-gradient(160deg,#0b1230,#0a0e22);border-top:1px solid #2a3a74;
    box-shadow:0 -8px 40px rgba(0,0,0,.6);
    transform:translateY(110%);transition:transform .25s ease;
    max-height:80vh;overflow:auto}
  #actionsRest.open{transform:none}
  #actionsRest button{min-height:48px;font-size:14px}
  #sheetBack.show{display:block;position:fixed;inset:0;z-index:70;
    background:rgba(2,4,12,.6);backdrop-filter:blur(2px)}

  /* ---------- лидеры как модалка ---------- */
  #lb.asModal{display:block;position:fixed;z-index:72;left:12px;right:12px;top:50%;
    transform:translateY(-50%);width:auto;padding:18px 20px}
  #lb.asModal ol{font-size:15px;line-height:2.1}

  /* ---------- модалки на весь экран ---------- */
  #tutCard, #levelsCard, #coachDoneCard{width:calc(100vw - 12px);max-height:88vh;
    overflow:auto;padding:20px 16px;border-radius:16px}
  #levelGrid{grid-template-columns:1fr}
  #tutBody{font-size:13.5px;min-height:0}
  #tutSkip, #levelsClose{min-width:44px;min-height:44px;font-size:13px;
    display:flex;align-items:center;justify-content:flex-end;top:8px;right:10px}
  .cdPreviewWrap{height:150px}

  /* ---------- обучение: пузырь на всю ширину ---------- */
  #coach{left:6px;right:6px;width:auto;transform:translateY(14px);
    bottom:calc(6px + env(safe-area-inset-bottom));padding:14px 16px 16px}
  #coach.show{transform:none}
  #coachText{font-size:13px;min-height:0}
  /* во время обучения переключатель режимов появляется только когда он
     нужен (шаг 3), иначе его перекрывает пузырь с текстом */
  body.coaching #modeBar{display:none}
  body.coaching.coach-modes #modeBar{display:flex}

  /* ---------- подсказка режима изучения — плашкой снизу ---------- */
  #tip.sheet{left:6px !important;right:6px !important;top:auto !important;
    bottom:calc(6px + env(safe-area-inset-bottom)) !important;
    max-width:none;font-size:13px}

  /* ---------- тост ---------- */
  #toast{width:calc(100vw - 24px);font-size:15px;padding:14px 16px;
    white-space:normal;text-align:center;letter-spacing:1px}
}

/* ---------- ландшафт: по вертикали почти ничего нет ---------- */
@media (max-height: 500px) and (pointer: coarse){
  #mission{display:none}
  #hdrScore{display:none}
  #meter{padding:7px 12px}
  #hint{display:none}
  #btnDock{padding:11px 16px;font-size:13px}
  #modeBar button{min-height:40px;padding:7px 4px}
}
```

- [ ] **Step 4: Проверить вёрстку**

Открыть `http://localhost:8000/index.html` **без** эмуляции: раскладка обязана остаться в точности прежней — заголовок слева сверху, счёт справа сверху, метр по центру снизу, столбик из восьми кнопок справа снизу, подсказка по управлению слева снизу. Это проверка того, что `display:contents` не сломал десктоп.

Включить эмуляцию iPhone 12 Pro (390×844), перезагрузить. Ожидается:

- хедер одной строкой сверху, мишень с эллипсисом, справа 🔇 и ☰ (по 44px);
- панели счёта, лидеров и подсказки по мыши отсутствуют;
- снизу столбиком: три кнопки режимов, метр, широкая зелёная «▶ ТЕСТ ЛЕКАРСТВА»;
- ничего не перекрывается, горизонтальной прокрутки нет;
- открыть `🗂 УРОВНИ` (пока через консоль: `openLevels()`) — карточки в одну колонку, ✕ крупный, лист скроллится;
- открыть `❓ ОБ ИГРЕ` (`openTut(ABOUT_STEPS)`) — текст читается, кнопки не уезжают.

Повернуть эмулятор в ландшафт (844×390): метр сжался в одну строку, строка «Задача» и подсказка скрыты, всё влезает.

Проверить на эмуляции iPhone 14 Pro (есть вырез и home-bar): нижний стек не заезжает под системную полосу.

- [ ] **Step 5: Коммит**

```bash
git add index.html css/styles.css css/mobile.css
git commit -m "feat(mobile): responsive layout — bottom stack, compact header, full-width modals

Bottom panels are wrapped in #bottomBar, which is display:contents on desktop
(so fixed children keep their exact previous positions) and a flex column on
mobile, so panel heights stack without hard-coded offsets."
```

---

### Task 9: Мобильная оболочка — лист, лидеры, переключатель режимов

**Files:**
- Create: `js/mobile.js`
- Modify: `index.html` (подключить `js/mobile.js` перед `js/selftest.js`)
- Modify: `js/hud.js` (`setScore`/`setBest`/`syncScore`, замена прямых записей в `#scoreVal`/`#best`)
- Modify: `js/scene.js:46` и `js/coach.js:227` (перевести на `setScore`)

**Interfaces:**
- Consumes: `IS_TOUCH` (Task 1), DOM-контракт из Task 8, `loadLeaderboard()`, `numFmt` появится только в Фазе 3 — пока `toLocaleString('ru-RU')`.
- Produces:
  - `setScore(n) → void`, `setBest(n) → void`, `syncScore() → void` (в `hud.js`)
  - `openSheet() → void`, `closeSheet() → void`
  - `syncModeBar() → void`
  - `touchMode: 'move'|'rotate'|'depth'` (объявляется в `state.js`, читается в Task 11)

- [ ] **Step 1: Единая точка записи счёта**

В `js/hud.js`, перед `/* ---------- toast + fireworks ---------- */`, добавить:

```js
/* ---------- счёт: одна точка записи ----------
   На мобиле панель #score скрыта, а счёт и рекорд показываются строкой
   #hdrScore в хедере, поэтому писать в DOM напрямую больше нельзя. */
function syncScore(){
  el('scoreVal').textContent = score.toLocaleString('ru-RU');
  el('best').textContent = 'РЕКОРД: ' + best.toLocaleString('ru-RU');
  const h = el('hdrScore');
  if(h) h.textContent = 'СЧЁТ ' + score.toLocaleString('ru-RU') + ' · РЕКОРД ' + best.toLocaleString('ru-RU');
}
function setScore(n){ score = n; syncScore(); }
function setBest(n){ best = n; syncScore(); }
```

Затем заменить прямые записи. В `js/hud.js`, было:

```js
  score = pts;
  el('scoreVal').textContent = score.toLocaleString('ru-RU');
```

стало:

```js
  setScore(pts);
```

было:

```js
  if(coachActive && coachStep===5 && mind<=5){
    fireworks(); chimeWin();
    if(pts>best){ best=pts; el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU'); saveScore(pts); }
```

стало:

```js
  if(coachActive && coachStep===5 && mind<=5){
    fireworks(); chimeWin();
    if(pts>best){ setBest(pts); saveScore(pts); }
```

было:

```js
  if(pts>best){
    best=pts; el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU');
    fireworks(); chimeWin();
```

стало:

```js
  if(pts>best){
    setBest(pts);
    fireworks(); chimeWin();
```

было (в `btnReset`):

```js
  lig.rx=lig.ry=lig.rz=0; score=0; el('scoreVal').textContent='0';
```

стало:

```js
  lig.rx=lig.ry=lig.rz=0; setScore(0);
```

было (в `loadLeaderboard`):

```js
  best = Math.max(best, b[0].pts);
  el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU');
```

стало:

```js
  setBest(Math.max(best, b[0].pts));
```

В `js/scene.js`, функция `loadLevel`, было:

```js
  score = 0; el('scoreVal').textContent = '0';
```

стало:

```js
  setScore(0);
```

В `js/coach.js`, функция `startCoach`, было:

```js
  score = 0; el('scoreVal').textContent = '0';
```

стало:

```js
  setScore(0);
```

- [ ] **Step 2: Объявить touchMode в общем состоянии**

В `js/state.js`, рядом с `depthLig` из Task 4, было:

```js
let depthLig = false;
```

стало:

```js
let depthLig = false;
// что делает один палец, проведённый ПО МОЛЕКУЛЕ (переключатель #modeBar).
// Пишется в mobile.js, читается в controls.js.
let touchMode = 'move';   // 'move' | 'rotate' | 'depth'
```

- [ ] **Step 3: Создать js/mobile.js**

```js
/* ============================================================
   МОБИЛЬНАЯ ОБОЛОЧКА UI
   ------------------------------------------------------------
   Только поведение мобильных элементов вёрстки (см. css/mobile.css):
     ☰            → выдвижной лист с второстепенными кнопками
     🏆 ЛИДЕРЫ    → панель #lb как модалка (на телефоне она скрыта)
     #modeBar     → что делает палец, проведённый по молекуле
   Сама тач-обработка живёт в controls.js рядом с mouse-кодом,
   чтобы не дублировать математику перемещения и трекбола.
   ============================================================ */

/* ---------- выдвижной лист ---------- */
function openSheet(){
  el('actionsRest').classList.add('open');
  el('sheetBack').classList.add('show');
}
function closeSheet(){
  el('actionsRest').classList.remove('open');
  el('lb').classList.remove('asModal');
  el('sheetBack').classList.remove('show');
}
el('btnMenu').onclick = ()=>{
  el('actionsRest').classList.contains('open') ? closeSheet() : openSheet();
};
el('sheetBack').onclick = closeSheet;
// любое действие из листа закрывает его — иначе лист остаётся поверх сцены
el('actionsRest').querySelectorAll('button').forEach(b=>{
  if(b.id === 'btnBoard' || b.id === 'btnQuality') return;   // лидеры открывают модалку, качество перезагружает
  b.addEventListener('click', closeSheet);
});

/* ---------- лидеры как модалка ---------- */
el('btnBoard').onclick = ()=>{
  loadLeaderboard();                       // подтянуть свежую таблицу и рекорд
  if(el('lb').style.display === 'none' || !getBoard().length){
    showToast('Пока никто не отметился — сыграй и попади в таблицу!');
    closeSheet();
    return;
  }
  el('actionsRest').classList.remove('open');
  el('lb').classList.add('asModal');
  el('sheetBack').classList.add('show');   // тап по затемнению закроет
};

/* ---------- переключатель режимов ---------- */
function syncModeBar(){
  el('modeBar').querySelectorAll('button').forEach(b=>{
    b.classList.toggle('on', b.dataset.mode === touchMode);
  });
}
el('modeBar').querySelectorAll('button').forEach(b=>{
  b.onclick = ()=>{ touchMode = b.dataset.mode; syncModeBar(); };
});
syncModeBar();
```

- [ ] **Step 4: Подключить и проверить**

В `index.html` добавить перед `js/selftest.js`:

```html
<script src="js/coach.js"></script>
<script src="js/mobile.js"></script>
<script src="js/selftest.js"></script>
<script src="js/main.js"></script>
```

Открыть `http://localhost:8000/index.html` в эмуляции iPhone 12 Pro, перезагрузить, пропустить обучение. Проверить:

- тап по ☰ выдвигает лист снизу с семью кнопками, фон затемняется; тап по затемнению закрывает; повторный тап по ☰ тоже закрывает;
- тап по `🗂 УРОВНИ` из листа: лист закрылся, открылась сетка уровней;
- тап по `🏆 ЛИДЕРЫ` до первого рекорда: тост «Пока никто не отметился…»;
- переключатель режимов: активная кнопка подсвечена голубым, тап переносит подсветку; в консоли `touchMode` меняется на `move`/`rotate`/`depth`;
- строка счёта в хедере: `СЧЁТ 0 · РЕКОРД 0`; нажать `▶ ТЕСТ ЛЕКАРСТВА` — числа в хедере обновились вместе с рекордом, ввести ник в `prompt`, затем `🏆 ЛИДЕРЫ` показывает модалку с записью.

На десктопе без эмуляции: восемь кнопок в столбике справа снизу, ☰ и строка счёта в хедере не видны, панель лидеров появляется справа сверху после первого рекорда — как раньше.

- [ ] **Step 5: Коммит**

```bash
git add index.html js/mobile.js js/state.js js/hud.js js/scene.js js/coach.js
git commit -m "feat(mobile): bottom sheet, leaderboard modal, ligand mode switcher

Score writes go through setScore/setBest/syncScore so the header line on mobile
stays in sync with the (hidden there) desktop score panel."
```

---

### Task 10: Вынести математику управления молекулой в чистые функции

Тач-ветка должна двигать и вращать молекулу ровно так же, как мышь, включая магнитную дорожку обучения. Дублировать эту математику нельзя, поэтому она сначала выносится из `mousemove` в отдельные функции. Десктопное поведение при этом обязано не измениться ни на пиксель.

**Files:**
- Modify: `js/geometry.js` (чистая функция `projectOnSegment`)
- Modify: `js/controls.js:118-164` (вынос `ligMove`/`ligRotate`/`ligDepth`/`snapToTrack`, `mousemove` начинает их вызывать)
- Modify: `js/selftest.js` (проверки `projectOnSegment`)

**Interfaces:**
- Consumes: `camBasis()`, `pxPerA()`, `centroid()`, `ligWorld()`, `eulerToMat`/`matMul3`/`axisAngleMat`/`matToEuler`.
- Produces:
  - `projectOnSegment(p, a, b) → {x,y,z}` — ближайшая точка отрезка `a→b` к точке `p`, с зажимом в концы.
  - `ligMove(dx, dy) → void` — сдвиг в плоскости экрана на `dx`/`dy` пикселей (включая магнит обучения).
  - `ligRotate(dx, dy) → void` — экранный трекбол.
  - `ligDepth(dy) → void` — сдвиг по глубине: палец вверх (`dy < 0`) уводит молекулу от зрителя.
  - `snapToTrack() → void`

- [ ] **Step 1: Написать падающую проверку**

В `js/selftest.js`, в конец `runSelfTest()`, добавить:

```js
  // ---- geometry: проекция точки на отрезок (магнитная дорожка обучения) ----
  const A = {x:0,y:0,z:0}, B = {x:10,y:0,z:0};
  stEq('projectOnSegment: середина',        projectOnSegment({x:5,  y:3, z:0}, A, B), {x:5, y:0, z:0});
  stEq('projectOnSegment: зажим в начало',  projectOnSegment({x:-7, y:2, z:0}, A, B), {x:0, y:0, z:0});
  stEq('projectOnSegment: зажим в конец',   projectOnSegment({x:99, y:0, z:5}, A, B), {x:10,y:0, z:0});
  stEq('projectOnSegment: точка на отрезке',projectOnSegment({x:2,  y:0, z:0}, A, B), {x:2, y:0, z:0});
  stEq('projectOnSegment: вырожденный отрезок',
       projectOnSegment({x:4,y:4,z:4}, {x:1,y:1,z:1}, {x:1,y:1,z:1}), {x:1,y:1,z:1});
```

- [ ] **Step 2: Запустить и убедиться, что проверка падает**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `Uncaught ReferenceError: projectOnSegment is not defined`, итоговая строка не печатается.

- [ ] **Step 3: Реализация**

В `js/geometry.js`, в конец файла, добавить:

```js
// Ближайшая к p точка отрезка a→b, зажатая в его концы. Используется
// магнитной дорожкой обучения (coachTrack): центроид молекулы притягивается
// на прямую «старт → карман», чтобы новичок не потерял ключ в пространстве,
// но сам решал, насколько далеко по дорожке он ушёл.
function projectOnSegment(p, a, b){
  const vx=b.x-a.x, vy=b.y-a.y, vz=b.z-a.z;
  const len2 = vx*vx+vy*vy+vz*vz;
  if(!len2) return {x:a.x, y:a.y, z:a.z};                 // вырожденный отрезок
  let t = ((p.x-a.x)*vx + (p.y-a.y)*vy + (p.z-a.z)*vz)/len2;
  t = Math.max(0, Math.min(1, t));
  return {x:a.x+vx*t, y:a.y+vy*t, z:a.z+vz*t};
}
```

В `js/controls.js`, перед блоком `/* ---------- direct mouse manipulation ... */`, добавить:

```js
/* ---------- манипуляции молекулой: общая математика ----------
   Эти четыре функции — единственное место, где меняется поза молекулы от
   указателя. Ими пользуются и mouse-ветка, и тач-ветка ниже, поэтому
   математика не продублирована и поведение мыши и пальца совпадает. */

// COACH: магнитная дорожка — снять центроид молекулы на прямую «старт → карман»
function snapToTrack(){
  if(!coachMagnet || !coachTrack) return;
  const c = centroid(LIG_LOCAL.map(p=>ligWorld(p, breath)));
  const q = projectOnSegment(c, coachTrack.a, coachTrack.b);
  lig.x += q.x - c.x; lig.y += q.y - c.y; lig.z += q.z - c.z;
}

// сдвиг в плоскости экрана, 1:1 с указателем (перевод пиксели → ангстремы)
function ligMove(dx, dy){
  const b=camBasis(), k=1/(pxPerA()||8);
  lig.x += (b.right[0]*dx - b.up[0]*dy)*k;   // вниз по экрану (dy>0) = −up
  lig.y += (b.right[1]*dx - b.up[1]*dy)*k;
  lig.z += (b.right[2]*dx - b.up[2]*dy)*k;
  snapToTrack();
}

// экранный трекбол: вращение вокруг ОСЕЙ КАМЕРЫ, чтобы поверхность всегда
// шла за указателем — вправо тянешь, вправо и поворачивается, независимо от
// того, как повёрнута камера и как уже ориентирована молекула
function ligRotate(dx, dy){
  const b=camBasis(), k=0.01;
  let R = eulerToMat(lig.rx, lig.ry, lig.rz);
  R = matMul3(axisAngleMat(b.up,    dx*k), R);   // горизонтально → рыскание вокруг экранного «вверх»
  R = matMul3(axisAngleMat(b.right, dy*k), R);   // вертикально   → тангаж вокруг экранного «вправо»
  const a = matToEuler(R);
  lig.rx=a.rx; lig.ry=a.ry; lig.rz=a.rz;
}

// глубина: палец/курсор вверх (dy<0) уводит молекулу ОТ зрителя,
// вниз — к зрителю (+fwd в camBasis направлен к камере)
function ligDepth(dy){
  const b=camBasis(), step = dy*0.06;
  lig.x += b.fwd[0]*step; lig.y += b.fwd[1]*step; lig.z += b.fwd[2]*step;
}
```

Затем в том же файле заменить тела веток `mousemove`. Было:

```js
  if(draggingLig){
    // move in the screen plane, 1:1 with the cursor (convert px → Ångström)
    const dx=e.clientX-lastLX, dy=e.clientY-lastLY;
    lastLX=e.clientX; lastLY=e.clientY;
    const b=camBasis(), k=1/(pxPerA()||8);   // Å per screen-pixel at the current zoom
    lig.x += (b.right[0]*dx - b.up[0]*dy)*k;  // screen-down (dy>0) = −up
    lig.y += (b.right[1]*dx - b.up[1]*dy)*k;
    lig.z += (b.right[2]*dx - b.up[2]*dy)*k;
    // COACH: magnetic track — snap the drug's centroid onto the guide line (start → pocket) so a
    // first-time player can't lose it in space; they still control HOW FAR along the track it goes.
    if(coachMagnet && coachTrack){
      const c = centroid(LIG_LOCAL.map(p=>ligWorld(p, breath)));   // centroid after this mouse move
      const ta = coachTrack.a, tb = coachTrack.b;
      const vx=tb.x-ta.x, vy=tb.y-ta.y, vz=tb.z-ta.z;
      const len2 = vx*vx+vy*vy+vz*vz || 1;
      let t = ((c.x-ta.x)*vx + (c.y-ta.y)*vy + (c.z-ta.z)*vz)/len2;
      t = Math.max(0, Math.min(1, t));                              // clamp to the segment
      lig.x += (ta.x+vx*t) - c.x;                                   // shift centroid onto the track
      lig.y += (ta.y+vy*t) - c.y;
      lig.z += (ta.z+vz*t) - c.z;
    }
    e.preventDefault(); e.stopPropagation(); return;
  }
  if(rotatingLig){
    // Screen-relative trackball: spin the molecule about the CAMERA's own axes so the
    // surface always follows the cursor — drag right → it turns right, drag down → down —
    // no matter where the camera is or how the molecule is already oriented. (The old code
    // nudged the world-space Euler angles directly, which flipped direction once the camera
    // orbited or rx/rz went non-zero, i.e. "drag right, spins left".)
    const dx=e.clientX-lastLX, dy=e.clientY-lastLY;
    lastLX=e.clientX; lastLY=e.clientY;
    const b=camBasis(), k=0.01;
    let R = eulerToMat(lig.rx, lig.ry, lig.rz);
    R = matMul3(axisAngleMat(b.up,    dx*k), R);   // horizontal drag → yaw about screen-up
    R = matMul3(axisAngleMat(b.right, dy*k), R);   // vertical drag   → pitch about screen-right
    const a = matToEuler(R);
    lig.rx=a.rx; lig.ry=a.ry; lig.rz=a.rz;
    e.preventDefault(); e.stopPropagation(); return;
  }
```

стало:

```js
  if(draggingLig || rotatingLig){
    const dx=e.clientX-lastLX, dy=e.clientY-lastLY;
    lastLX=e.clientX; lastLY=e.clientY;
    if(draggingLig) ligMove(dx, dy); else ligRotate(dx, dy);
    e.preventDefault(); e.stopPropagation(); return;
  }
```

И в обработчике `wheel`, ветку «курсор над молекулой», было:

```js
    const b = camBasis(), s = e.deltaY < 0 ? 1 : -1, step = 1.4;   // up = toward the viewer
    lig.x += b.fwd[0]*s*step; lig.y += b.fwd[1]*s*step; lig.z += b.fwd[2]*s*step;
    return;
```

стало:

```js
    // колесо вверх (deltaY<0) = к зрителю; ligDepth ждёт «пиксели вниз»,
    // поэтому знак противоположный: −(−1)·23 ≈ шаг 1.4 Å как раньше
    ligDepth(e.deltaY < 0 ? -23 : 23);
    return;
```

- [ ] **Step 4: Проверить, что ничего не изменилось**

Открыть `http://localhost:8000/index.html?selftest`: ожидается `--- selftest: 16 passed, 0 failed ---`.

Открыть `http://localhost:8000/index.html` на десктопе и проверить вручную, что поведение мыши прежнее:

- левой кнопкой схватить молекулу и потащить — она идёт за курсором 1:1;
- правой кнопкой потащить по молекуле — тянешь вправо, поворачивается вправо; тянешь вниз — вниз;
- колесо над молекулой — уходит глубже/ближе, на глаз тем же шагом, что и раньше;
- колесо над фоном — зум камеры к курсору;
- пройти обучение уровня 1 до шага 3 и потащить молекулу мимо дорожки: её центроид всё равно держится светящейся линии (магнит работает), и на шаге 3 происходит автопереход к шагу 4 при подходе к карману.

- [ ] **Step 5: Коммит**

```bash
git add js/geometry.js js/controls.js js/selftest.js
git commit -m "refactor(controls): extract ligMove/ligRotate/ligDepth so touch can reuse them

Pure refactor: mouse behaviour is unchanged. The track-snap projection moves to
geometry.js as projectOnSegment and is covered by the self-test."
```

---

### Task 11: Управление молекулой пальцем

**Files:**
- Modify: `js/controls.js` (хит-радиус, замена минимального тач-блока из Task 3 на полный)

**Interfaces:**
- Consumes: `IS_TOUCH`, `touchMode`, `ligMove`/`ligRotate`/`ligDepth`, `ligHit`, `camInteracting`, `draggingLig`/`rotatingLig`/`depthLig`, `infoMode`, `coachActive`/`coachStep`.
- Produces: ничего нового; `studyTap()` вызывается из тач-ветки и появится в Task 12 — до тех пор в ветке `infoMode` стоит только выставление флага.

- [ ] **Step 1: Увеличить радиус захвата под палец**

В `js/controls.js`, было:

```js
function ligHit(mx, my){
  if(!pocket || !viewer) return false;
  const world = LIG_LOCAL.map(p=>ligWorld(p, breath));
  const pts = viewer.modelToScreen([centroid(world), ...world]);
  let d2min=Infinity;
  for(const s of pts){ const dx=s.x-mx, dy=s.y-my, d2=dx*dx+dy*dy; if(d2<d2min) d2min=d2; }
  return d2min < 34*34;   // grab radius in px
}
```

стало:

```js
// радиус захвата: под палец нужен заметно больший, чем под курсор
const GRAB_PX = IS_TOUCH ? 48 : 34;
function ligHit(mx, my){
  if(!pocket || !viewer) return false;
  const world = LIG_LOCAL.map(p=>ligWorld(p, breath));
  const pts = viewer.modelToScreen([centroid(world), ...world]);
  let d2min=Infinity;
  for(const s of pts){ const dx=s.x-mx, dy=s.y-my, d2=dx*dx+dy*dy; if(d2<d2min) d2min=d2; }
  return d2min < GRAB_PX*GRAB_PX;
}
```

- [ ] **Step 2: Заменить минимальный тач-блок на полный**

В `js/controls.js` целиком заменить блок, добавленный в Task 3 (от комментария `/* ---------- ТАЧ: только флаг «камера в работе» ----------` до конца файла), на:

```js
/* ---------- ТАЧ-УПРАВЛЕНИЕ ----------
   Схема без конфликта жестов:
     один палец ПО МОЛЕКУЛЕ  → активный режим (#modeBar): двигать / вращать / глубина
     один палец ПО ФОНУ      → орбита камеры силами 3Dmol (не перехватываем)
     два и более пальцев     → зум / сдвиг камеры силами 3Dmol
   3Dmol сам слушает touch* на своём canvas и маппит их в собственные
   mouse-обработчики, поэтому «не перехватить» = просто не звать
   stopPropagation. Мы слушаем на #viewer в фазе ПЕРЕХВАТА, то есть раньше
   canvas, и глушим событие только когда сами берём молекулу.

   camInteracting поднимается на любое касание: без него animate() не
   замирает во время тач-вращения и каждые 45 мс пересобирает шейпы поверх
   рендера 3Dmol — это и было причиной подвисаний. */
let touchId = null, lastTX = 0, lastTY = 0;

el('viewer').addEventListener('touchstart', e=>{
  if(!viewer) return;
  camInteracting = true;                       // любое касание = сцена в работе
  if(e.touches.length !== 1) return;           // два пальца → пинч/сдвиг 3Dmol
  const tp = e.touches[0], r = el('viewer').getBoundingClientRect();
  const mx = tp.clientX - r.left, my = tp.clientY - r.top;
  if(infoMode){ studyTap(mx, my); return; }    // режим изучения: тап = «что это?»
  // вводные шаги обучения: молекула ещё не в игре, любой жест крутит камеру
  if(coachActive && coachStep < 3) return;
  if(!ligHit(mx, my)) return;                  // мимо молекулы → орбита камеры
  touchId = tp.identifier; lastTX = tp.clientX; lastTY = tp.clientY;
  if(touchMode === 'rotate')     rotatingLig = true;
  else if(touchMode === 'depth') depthLig    = true;
  else                           draggingLig = true;
  e.preventDefault(); e.stopPropagation();
}, {passive:false, capture:true});

el('viewer').addEventListener('touchmove', e=>{
  if(touchId === null) return;
  let tp = null;
  for(const x of e.touches) if(x.identifier === touchId) tp = x;
  if(!tp) return;
  const dx = tp.clientX - lastTX, dy = tp.clientY - lastTY;
  lastTX = tp.clientX; lastTY = tp.clientY;
  if(draggingLig)      ligMove(dx, dy);
  else if(rotatingLig) ligRotate(dx, dy);
  else if(depthLig)    ligDepth(dy);
  e.preventDefault(); e.stopPropagation();
}, {passive:false, capture:true});

function endTouch(e){
  camInteracting = e.touches.length > 0;       // остались пальцы → камера ещё в работе
  if(touchId !== null){
    touchId = null;
    draggingLig = rotatingLig = depthLig = false;
    e.stopPropagation();
  }
}
el('viewer').addEventListener('touchend',    endTouch, {passive:true, capture:true});
el('viewer').addEventListener('touchcancel', endTouch, {passive:true, capture:true});
```

- [ ] **Step 3: Заглушка studyTap на время этой задачи**

`studyTap` появится в Task 12. Чтобы игра не падала между задачами, добавить в конец `js/study.js`:

```js
// тап по сцене в режиме изучения (мобильный аналог hover). Полная реализация — Task 12.
function studyTap(mx, my){ pickAtom(mx, my); }
```

- [ ] **Step 4: Проверить все жесты**

Открыть `http://localhost:8000/index.html` в эмуляции iPhone 12 Pro (в DevTools должен быть включён режим устройства — тогда мышь генерирует настоящие `touch*`-события). Перезагрузить, дождаться уровня 1.

Пройти обучение до шага 3 и проверить по шагам:

- **режим «✋ ДВИГАТЬ»** (активен по умолчанию): провести пальцем от молекулы — она идёт за пальцем и держится светящейся дорожки; при подходе к карману обучение само переходит на шаг 4;
- **режим «🔄 ВРАЩАТЬ»**: тап по кнопке, затем провести пальцем по молекуле — она поворачивается, камера при этом стоит;
- **режим «↕ ГЛУБИНА»**: провести пальцем вверх по молекуле — она уходит от зрителя (становится мельче), вниз — приближается;
- **фон**: провести пальцем по пустому месту — вращается вся структура, молекула остаётся на своём месте в белке;
- **два пальца**: пинч — камера зумит; молекула не съезжает;
- **плавность**: во время вращения фоном нет рывков (это результат Task 3);
- в консоли во время вращения фоном `camInteracting` равно `true`, после отпускания — `false`.

Довести обучение до конца: на шаге 4 переключиться на «🔄 ВРАЩАТЬ», сесть в карман до зелёной шкалы, нажать «▶ ТЕСТ ЛЕКАРСТВА» — салют, модалка «МИШЕНЬ ПРОЙДЕНА» с превью следующей мишени.

На десктопе без эмуляции: мышь работает как раньше, `#modeBar` не виден и на мышь не влияет.

- [ ] **Step 5: Коммит**

```bash
git add js/controls.js js/study.js
git commit -m "feat(mobile): touch control of the ligand via move/rotate/depth modes

One finger on the molecule drives the active mode, one finger on the background
orbits the camera through 3Dmol, two fingers zoom. Grab radius grows to 48px on
touch devices."
```

---

### Task 12: Режим изучения по тапу и тексты обучения под палец

Тексты, которые на телефоне просто неверны: обучение говорит «схвати мышью» и «правый клик», подсказки шкалы — «тащи молекулу мышью», дека «КАК ИГРАТЬ» описывает мышь и клавиатуру. Подсказки шкалы делаются нейтральными (годятся и для мыши, и для пальца) — это дешевле и честнее, чем два варианта каждой; обучение и дека «КАК ИГРАТЬ» получают явные тач-варианты, потому что там инструкция обязана быть конкретной.

**Files:**
- Modify: `js/study.js` (`studyTap` полностью, класс `#tip.sheet`, `syncInfoBtn`)
- Modify: `js/scoring.js:143-155` (нейтральные формулировки подсказок)
- Modify: `js/coach.js` (тач-варианты шагов 3 и 4, подпись курсора, класс `coach-modes`)
- Modify: `js/tutorial.js` (тач-вариант деки «КАК ИГРАТЬ»)

**Interfaces:**
- Consumes: `IS_TOUCH`, `pickAtom`, `hoverInfo`, `showTip`, `hideTip`, `clearHi`.
- Produces:
  - `studyTap(mx, my) → void`
  - `syncInfoBtn() → void` — понадобится в Фазе 3 при смене языка.

- [ ] **Step 1: Тап в режиме изучения**

В `js/study.js` заменить заглушку из Task 11 на полную реализацию:

```js
/* ---------- режим изучения на тач ----------
   На телефоне нет наведения, поэтому подсказка вызывается тапом, а сама
   плашка #tip прижимается к низу экрана на всю ширину (класс .sheet,
   стили в css/mobile.css) — у курсора её ставить бессмысленно, палец её
   закроет. Повторный тап по пустому месту убирает подсказку. */
function studyTap(mx, my){
  pickAtom(mx, my);
  if(hoverInfo){
    const t = el('tip');
    t.classList.add('sheet');
    showTip(hoverInfo.text, 0, 0);   // позицию задаёт css/mobile.css
  } else {
    hideTip();
  }
}
```

И вынести синхронизацию кнопки, чтобы Фаза 3 могла её перерисовать. Было:

```js
function setInfoMode(on){
  infoMode=on; hoverInfo=null;
  el('btnInfo').textContent = on ? '🔎 ИЗУЧЕНИЕ: ВКЛ' : '🔎 ИЗУЧЕНИЕ';
  el('btnInfo').classList.toggle('b-dock', on);
  el('btnInfo').classList.toggle('b-ghost', !on);
```

стало:

```js
function syncInfoBtn(){
  el('btnInfo').textContent = infoMode ? '🔎 ИЗУЧЕНИЕ: ВКЛ' : '🔎 ИЗУЧЕНИЕ';
  el('btnInfo').classList.toggle('b-dock', infoMode);
  el('btnInfo').classList.toggle('b-ghost', !infoMode);
}
function setInfoMode(on){
  infoMode=on; hoverInfo=null;
  syncInfoBtn();
```

- [ ] **Step 2: Нейтральные подсказки шкалы**

В `js/scoring.js`, функция `quality()`, было:

```js
  if(centerDist>20) return {color:'#ff2e5b', status:'ДАЛЕКО',       pct:6,  hint:'🔑 тащи молекулу мышью к зелёному карману'};
  if(centerDist>10) return {color:'#ff8a1e', status:'ПОДБИРАЕМСЯ…', pct:26, hint:'ещё ближе к «выключателю» — тащи мышью'};
```

стало:

```js
  // формулировки нейтральные: одна и та же подсказка верна и для мыши, и
  // для пальца (на телефоне «правый клик» и «мышь» просто не существуют)
  if(centerDist>20) return {color:'#ff2e5b', status:'ДАЛЕКО',       pct:6,  hint:'🔑 веди молекулу к зелёному карману'};
  if(centerDist>10) return {color:'#ff8a1e', status:'ПОДБИРАЕМСЯ…', pct:26, hint:'ещё ближе к «выключателю»'};
```

было:

```js
  if(clash>1.2) return {color:'#ffb000', status:'УПИРАЕТСЯ', pct:Math.min(pct,62),
    hint:'молекула сталкивается с белком — правый клик + мышь, поверни, чтобы легла плотнее'};
```

стало:

```js
  if(clash>1.2) return {color:'#ffb000', status:'УПИРАЕТСЯ', pct:Math.min(pct,62),
    hint:'молекула сталкивается с белком — поверни её, чтобы легла плотнее'};
```

было:

```js
  return          {color:'#ffe600', status:'В КАРМАНЕ', pct,
    hint:'поворачивай (правый клик + мышь) — ищи угол, где ключ ляжет плотнее'};
```

стало:

```js
  return          {color:'#ffe600', status:'В КАРМАНЕ', pct,
    hint:'поворачивай — ищи угол, где ключ ляжет плотнее'};
```

- [ ] **Step 3: Тач-варианты в обучении**

В `js/coach.js`, функция `coachGoto`, было:

```js
  document.body.classList.toggle('coach-actions', n===5);   // action menu only for the TEST step
```

стало:

```js
  document.body.classList.toggle('coach-actions', n===5);   // action menu only for the TEST step
  // переключатель режимов нужен с шага 3 (раньше его перекрывает пузырь текста)
  document.body.classList.toggle('coach-modes', n>=3);
```

было (шаг 3):

```js
      coachBubble('🖱',
        `Схвати лекарство мышью и <b>веди по светящейся дорожке</b> прямо в карман. ` +
        `Не бойся промахнуться — сейчас ключ сам держится трека.`, false);
```

стало:

```js
      coachBubble(IS_TOUCH ? '👆' : '🖱', IS_TOUCH
        ? `Проведи <b>пальцем по светящейся дорожке</b> — лекарство пойдёт за ним прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`
        : `Схвати лекарство мышью и <b>веди по светящейся дорожке</b> прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`, false);
```

было (шаг 4):

```js
      coachBubble('🔄',
        `Ты у кармана! Теперь <b>поверни</b> лекарство (<span class="hlc">правый клик + мышь</span>) ` +
        `и подведи вплотную, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`, false);
```

стало:

```js
      coachBubble('🔄', IS_TOUCH
        ? `Ты у кармана! Переключись внизу на <span class="hlc">🔄 ВРАЩАТЬ</span> и <b>поверни</b> лекарство ` +
          `пальцем, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`
        : `Ты у кармана! Теперь <b>поверни</b> лекарство (<span class="hlc">правый клик + мышь</span>) ` +
          `и подведи вплотную, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`, false);
```

было (в `coachShapes`, подпись курсора):

```js
    cur.querySelector('.cc-tip').textContent = 'схвати и веди в карман';
```

стало:

```js
    cur.querySelector('.cc-tip').textContent = IS_TOUCH ? 'веди пальцем в карман' : 'схвати и веди в карман';
```

И в `endCoach` снять новый класс. Было:

```js
  document.body.classList.remove('coaching', 'coach-actions');
```

стало:

```js
  document.body.classList.remove('coaching', 'coach-actions', 'coach-modes');
```

- [ ] **Step 4: Тач-вариант деки «КАК ИГРАТЬ»**

В `js/tutorial.js`, во втором элементе `HOW_STEPS`, было:

```js
  { icon:'🎮', title:'Управление ключом — просто мышью',
    body:`<b>Двигать:</b> <span class="hlc">схвати молекулу мышью и тащи</span> по экрану. Колесо над ней — <b>глубже/ближе</b>.<br>
          <b>Вращать:</b> <span class="hlc">правый клик + тащи</span> — и молекула поворачивается.<br><br>
          Сначала <span class="hl">подведи</span> ключ к зелёной метке, потом <span class="hl">поворачивай</span>, пока он не ляжет плотно (шкала: красный → жёлтый → <span class="hl">ЗЕЛЁНЫЙ = ПЛОТНО СЕЛ</span>, звучит «дзинь»).<br><br>
          <span style="color:#9db8e0">Камеру крути, таща <b>фон</b>; сдвигай <kbd>Shift</kbd>+мышь. Клавиши тоже работают: <kbd>W</kbd>/<kbd>S</kbd>, <kbd>Q E A D Z C</kbd>.</span>` },
```

стало (одна карточка, тело выбирается по типу устройства):

```js
  { icon:'🎮', title: IS_TOUCH ? 'Управление ключом — пальцем' : 'Управление ключом — просто мышью',
    body: IS_TOUCH
      ? `Внизу три режима: <span class="hlc">✋ ДВИГАТЬ</span>, <span class="hlc">🔄 ВРАЩАТЬ</span>, <span class="hlc">↕ ГЛУБИНА</span>.
          Проведи <b>пальцем по молекуле</b> — она сделает то, что выбрано.<br><br>
          Сначала <span class="hl">подведи</span> ключ к зелёной метке в режиме «ДВИГАТЬ», потом переключись на «ВРАЩАТЬ» и
          <span class="hl">поворачивай</span>, пока он не ляжет плотно (шкала: красный → жёлтый → <span class="hl">ЗЕЛЁНЫЙ = ПЛОТНО СЕЛ</span>, звучит «дзинь»).<br><br>
          <span style="color:#9db8e0">Палец по <b>фону</b> крутит саму клетку, два пальца — зум.</span>`
      : `<b>Двигать:</b> <span class="hlc">схвати молекулу мышью и тащи</span> по экрану. Колесо над ней — <b>глубже/ближе</b>.<br>
          <b>Вращать:</b> <span class="hlc">правый клик + тащи</span> — и молекула поворачивается.<br><br>
          Сначала <span class="hl">подведи</span> ключ к зелёной метке, потом <span class="hl">поворачивай</span>, пока он не ляжет плотно (шкала: красный → жёлтый → <span class="hl">ЗЕЛЁНЫЙ = ПЛОТНО СЕЛ</span>, звучит «дзинь»).<br><br>
          <span style="color:#9db8e0">Камеру крути, таща <b>фон</b>; сдвигай <kbd>Shift</kbd>+мышь. Клавиши тоже работают: <kbd>W</kbd>/<kbd>S</kbd>, <kbd>Q E A D Z C</kbd>.</span>` },
```

- [ ] **Step 5: Проверить**

В эмуляции iPhone 12 Pro, `http://localhost:8000/index.html`:

- включить `🔎 ИЗУЧЕНИЕ` из листа ☰; тапнуть по ленте белка — снизу на всю ширину появилась плашка с описанием цепи; тапнуть по золотому цинку — описание иона цинка; тапнуть по пустому фону — плашка исчезла; выключить режим — шейпы геймплея вернулись;
- пройти обучение: на шаге 3 текст говорит «Проведи пальцем по светящейся дорожке», иконка 👆, переключатель режимов виден; на шаге 4 текст просит переключиться на 🔄 ВРАЩАТЬ; подпись у мигающего курсора — «веди пальцем в карман»;
- открыть `❓ ОБ ИГРЕ` → вкладка `КАК ИГРАТЬ`: описаны три режима и жесты, слова «правый клик» и «колесо» отсутствуют;
- отвести молекулу далеко от кармана: в подсказке под шкалой «веди молекулу к зелёному карману», без слова «мышью».

На десктопе без эмуляции: обучение снова говорит про мышь и правый клик, дека «КАК ИГРАТЬ» — про мышь, колесо и клавиши; режим изучения работает по наведению, плашка подсказки — у курсора, а не снизу.

- [ ] **Step 6: Коммит**

```bash
git add js/study.js js/scoring.js js/coach.js js/tutorial.js
git commit -m "feat(mobile): tap-to-study, touch wording for the coach and the how-to-play deck

Meter hints are reworded device-neutrally instead of duplicated; the coach and
the how-to-play card get explicit touch variants because instructions there have
to be concrete."
```

---

**Контрольная точка Фазы 2.** Проверить на реальном телефоне: игра проходится целиком пальцем — обучение уровня 1 от начала до модалки «МИШЕНЬ ПРОЙДЕНА», затем свободная игра на уровне 2 (подвести, повернуть, протестировать). Отдельно убедиться, что страница не скроллится и не зумится при жестах по сцене.

---

# Фаза 3 — Двуязычность (RU / EN)

### Task 13: Рантайм переводов, кнопка 🌐 и статика index.html

**Files:**
- Create: `js/i18n.js`, `js/lang-en.js`, `js/lang-ru.js`
- Modify: `index.html` (подключение, `#langWrap`, атрибуты `data-i18n*`)
- Modify: `css/styles.css` (дропдаун языка)
- Modify: `js/selftest.js` (проверки `pickLang`, `t`, `numFmt`)

**Interfaces:**
- Consumes: DOM из Task 8.
- Produces:
  - `pickLang(saved, navLang) → 'ru' | 'en'` — чистая функция выбора языка.
  - `detectLang() → 'ru' | 'en'` — обёртка над `pickLang` с localStorage и `navigator`.
  - `LANG: 'ru'|'en'`
  - `t(key, vars?) → string` — подстановка `{{name}}`; отсутствующий ключ возвращает сам ключ и пишет `console.warn`.
  - `numFmt(n) → string`
  - `applyI18n(root?) → void` — проходит по `data-i18n`, `data-i18n-html`, `data-i18n-title`.
  - `setLang(code) → void`
  - `refreshDynamicText() → void` — заглушка в этой задаче, наполняется в Task 16.

- [ ] **Step 1: Написать падающие проверки**

В `js/selftest.js`, в конец `runSelfTest()`, добавить:

```js
  // ---- i18n: выбор языка при первом заходе ----
  stEq('pickLang: сохранён ru',        pickLang('ru',   'en-US'), 'ru');
  stEq('pickLang: сохранён en',        pickLang('en',   'ru-RU'), 'en');
  stEq('pickLang: мусор → браузер',    pickLang('zz',   'ru-RU'), 'ru');
  stEq('pickLang: пусто + ru-RU',      pickLang(null,   'ru-RU'), 'ru');
  stEq('pickLang: пусто + ru',         pickLang(null,   'ru'),    'ru');
  stEq('pickLang: пусто + ru-BY',      pickLang(null,   'ru-BY'), 'ru');
  stEq('pickLang: пусто + en-GB',      pickLang(null,   'en-GB'), 'en');
  stEq('pickLang: пусто + de',         pickLang(null,   'de'),    'en');
  stEq('pickLang: пусто + пусто',      pickLang(null,   ''),      'en');
  stEq('pickLang: "rue" не русский',   pickLang(null,   'rue'),   'en');

  // ---- i18n: подстановка и отсутствующие ключи ----
  const savedLang = LANG;
  LANG = 'en';
  stEq('t: подстановка',        t('selftest.vars', {name:'p53', n:7}), 'p53 has 7');
  stEq('t: лишние скобки целы', t('selftest.vars', {name:'x'}),        'x has {{n}}');
  stEq('t: нет ключа → ключ',   t('selftest.absent.key'),              'selftest.absent.key');
  stEq('numFmt: en',            numFmt(1234567),                        '1,234,567');
  LANG = 'ru';
  // ru-RU ставит между разрядами неразрывный или узкий неразрывный пробел
  // (U+00A0 / U+202F) — какой именно, зависит от браузера, поэтому сравниваем
  // через подстановку, а не с литералом с обычным пробелом (иначе проверка флакает)
  stEq('numFmt: ru', numFmt(1234567).replace(/[\s\u00A0\u202F]/g, '_'), '1_234_567');
  LANG = savedLang;
```

- [ ] **Step 2: Запустить и убедиться, что проверки падают**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `Uncaught ReferenceError: pickLang is not defined`, итоговая строка не печатается.

- [ ] **Step 3: Создать рантайм**

Создать `js/i18n.js`:

```js
/* ============================================================
   I18N — двуязычие RU / EN
   ------------------------------------------------------------
   Плоские словари (js/lang-en.js, js/lang-ru.js) + t() с
   подстановкой {{name}}. Статический текст в index.html помечен
   атрибутами data-i18n / data-i18n-html / data-i18n-title и
   раскрывается applyI18n(); динамический строится через t().

   Правило проекта: НОВЫЕ пользовательские строки идут в ОБА
   словаря. Отсутствующий ключ не молчит — t() возвращает сам
   ключ и пишет предупреждение в консоль, так что дырка видна
   сразу, а проверка ?selftest ловит расхождение словарей.
   ============================================================ */

/* Чистая функция, поэтому проверяется в selftest.js.
   Явный выбор игрока (pd_lang) перебивает всё. Иначе — язык
   браузера: префикс ru → русский, ВСЁ остальное → английский. */
function pickLang(saved, navLang){
  if(saved === 'ru' || saved === 'en') return saved;
  return /^ru\b/i.test(navLang || '') ? 'ru' : 'en';
}
function detectLang(){
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return pickLang(localStorage.getItem('pd_lang'), nav);
}

const I18N = { en: I18N_EN, ru: I18N_RU };
let LANG = detectLang();

function t(key, vars){
  const d = I18N[LANG] || I18N.en;
  let s = d[key];
  if(s == null){
    console.warn('[i18n] нет ключа: ' + key + ' (' + LANG + ')');
    return key;
  }
  if(vars) s = s.replace(/\{\{(\w+)\}\}/g, (m, k)=> vars[k] != null ? String(vars[k]) : m);
  return s;
}
function numFmt(n){ return Number(n).toLocaleString(LANG === 'ru' ? 'ru-RU' : 'en-US'); }

/* раскрыть статический текст. root — необязательный контейнер
   (нужен, когда модалка перерисовала своё содержимое) */
function applyI18n(root){
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(n=>{ n.textContent = t(n.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(n=>{ n.innerHTML = t(n.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-title]').forEach(n=>{ n.title = t(n.dataset.i18nTitle); });
}

/* наполняется в Task 16: перерисовка всего динамического текста
   (заголовки, 3D-метки, открытые модалки, таблица лидеров) */
function refreshDynamicText(){}

function setLang(code){
  if(code !== 'ru' && code !== 'en') return;
  LANG = code;
  localStorage.setItem('pd_lang', code);
  document.documentElement.lang = code;
  applyI18n();
  refreshDynamicText();
  syncLangMenu();
}

/* ---------- дропдаун 🌐 ---------- */
function syncLangMenu(){
  el('langMenu').querySelectorAll('button').forEach(b=>{
    b.classList.toggle('on', b.dataset.lang === LANG);
  });
}
el('btnLang').onclick = e=>{
  e.stopPropagation();
  el('langMenu').classList.toggle('show');
};
el('langMenu').querySelectorAll('button').forEach(b=>{
  b.onclick = ()=>{ setLang(b.dataset.lang); el('langMenu').classList.remove('show'); };
});
// клик мимо закрывает список
document.addEventListener('click', e=>{
  if(!el('langWrap').contains(e.target)) el('langMenu').classList.remove('show');
});

document.documentElement.lang = LANG;
syncLangMenu();
applyI18n();
```

- [ ] **Step 4: Создать словари со статическими ключами**

Создать `js/lang-en.js`. Ключ `selftest.vars` существует только для самопроверки — он специально короткий и не показывается игроку:

```js
/* ============================================================
   ENGLISH dictionary. Flat key → string.
   Keys must match js/lang-ru.js exactly — ?selftest verifies it.
   ============================================================ */
const I18N_EN = {
  'selftest.vars':      '{{name}} has {{n}}',

  // ---- loading / header ----
  'load.default':       'LOADING STRUCTURE…',
  'load.level':         'LOADING {{name}} · {{pdb}}…',
  'hdr.targetNone':     'TARGET: —',
  'hdr.target':         'TARGET: {{name}} · PDB {{pdb}} · {{sub}}',
  'btn.sound.title':    'Sound on/off',
  'btn.sound.on':       'Sound: on',
  'btn.sound.off':      'Sound: off',
  'btn.menu.title':     'Menu',
  'btn.lang.title':     'Language',

  // ---- score / leaderboard ----
  'score.label':        'SCORE',
  'score.best':         'BEST: {{n}}',
  'score.line':         'SCORE {{s}} · BEST {{b}}',
  'board.title':        '◆ LEADERS',

  // ---- meter ----
  'meter.contact':      'POCKET CONTACT',
  'meter.distLabel':    'to target:',
  'meter.inPocket':     '≤ 5 Å = in the pocket',
  'mission.closed':     '🎯 <b>Your task:</b> steer the key molecule into the green pocket and jam the cancer "switch"',
  'mission.open':       '🔬 <b>Open problem:</b> nobody has a drug for this one — find where to latch the key onto <b>{{name}}</b>',

  // ---- controls help (desktop only) ----
  'help.title':         '<b>THE DRUG</b> <span style="color:#6f8bbf">(mouse)</span>',
  'help.move':          '🖱 drag the molecule — move it',
  'help.rotate':        '🖱 right-click + drag — rotate it',
  'help.wheel':         'wheel over the molecule — deeper / closer',
  'help.camera':        '<b style="color:var(--cyan)">CAMERA:</b> drag the background — orbit · <kbd>Shift</kbd>+mouse — pan · wheel — zoom',
  'help.keys':          'Keys: <kbd>← ↑ → ↓</kbd> <kbd>W</kbd>/<kbd>S</kbd> move · <kbd>Q E A D Z C</kbd> rotate',

  // ---- action buttons ----
  'btn.dock':           '▶ TEST THE DRUG',
  'btn.dock.busy':      '⏳ COMPUTING…',
  'btn.solve':          '💡 HINT',
  'btn.solve.on':       '💡 HINT: ON',
  'btn.levels':         '🗂 TARGETS',
  'btn.study':          '🔎 STUDY',
  'btn.study.on':       '🔎 STUDY: ON',
  'btn.coach':          '🎓 TUTORIAL',
  'btn.reset':          '↺ RESET',
  'btn.guide':          '❓ ABOUT',
  'btn.board':          '🏆 LEADERS',
  'btn.quality':        '⚙ GRAPHICS: {{name}}',
  'quality.auto':       'AUTO ({{resolved}})',
  'quality.low':        'LIGHT',
  'quality.high':       'PRETTY',
  'quality.lowWord':    'light',
  'quality.highWord':   'pretty',

  // ---- touch mode switcher ----
  'mode.move':          '✋ MOVE',
  'mode.rotate':        '🔄 ROTATE',
  'mode.depth':         '↕ DEPTH',

  // ---- about / how-to modal ----
  'tut.skip':           'SKIP ✕',
  'tut.tabAbout':       'WHAT IT IS',
  'tut.tabHow':         'HOW TO PLAY',
  'tut.prev':           '◀ Back',
  'tut.next':           'Next ▶',
  'tut.done':           'Done ✓',

  // ---- level picker ----
  'levels.close':       'CLOSE ✕',
  'levels.title':       '🎯 PICK A CANCER TARGET',
  'levels.sub':         'Every level is a <b>real</b> cancer protein from the PDB. <b>✔</b> — targets a drug has already been found for (repeat what the scientists did). <i>🔬</i> — targets <i>nobody has a drug for yet</i>: they are <i>unlocked from the start</i>, there is no "right answer" here, and any result you get is a contribution to a real search.',

  // ---- coach ----
  'coach.skip':         'SKIP THE TUTORIAL ✕',
  'coach.next':         'Next ▶',
  'done.title':         'TARGET CLEARED!',
};
```

Создать `js/lang-ru.js` с тем же набором ключей и текущими русскими строками:

```js
/* ============================================================
   РУССКИЙ словарь. Плоский ключ → строка.
   Набор ключей обязан совпадать с js/lang-en.js — это проверяет
   ?selftest.
   ============================================================ */
const I18N_RU = {
  'selftest.vars':      'у {{name}} есть {{n}}',

  // ---- загрузка / хедер ----
  'load.default':       'ЗАГРУЗКА СТРУКТУРЫ…',
  'load.level':         'ЗАГРУЗКА СТРУКТУРЫ {{name}} · {{pdb}}…',
  'hdr.targetNone':     'МИШЕНЬ: —',
  'hdr.target':         'МИШЕНЬ: {{name}} · PDB {{pdb}} · {{sub}}',
  'btn.sound.title':    'Звук вкл/выкл',
  'btn.sound.on':       'Звук: вкл',
  'btn.sound.off':      'Звук: выкл',
  'btn.menu.title':     'Меню',
  'btn.lang.title':     'Язык',

  // ---- счёт / лидеры ----
  'score.label':        'СЧЁТ',
  'score.best':         'РЕКОРД: {{n}}',
  'score.line':         'СЧЁТ {{s}} · РЕКОРД {{b}}',
  'board.title':        '◆ ЛИДЕРЫ',

  // ---- метр ----
  'meter.contact':      'КОНТАКТ С КАРМАНОМ',
  'meter.distLabel':    'до цели:',
  'meter.inPocket':     '≤ 5 Å = в кармане',
  'mission.closed':     '🎯 <b>Задача:</b> приведи молекулу-ключ в зелёный карман и заткни «выключатель» рака',
  'mission.open':       '🔬 <b>Открытая задача:</b> лекарства ещё нет ни у кого — ищи, куда «прицепить» ключ на белке <b>{{name}}</b>',

  // ---- подсказка по управлению (только десктоп) ----
  'help.title':         '<b>ЛЕКАРСТВО</b> <span style="color:#6f8bbf">(мышь)</span>',
  'help.move':          '🖱 тащи молекулу — двигать',
  'help.rotate':        '🖱 правый клик + тащи — вращать',
  'help.wheel':         'колесо над молекулой — глубже / ближе',
  'help.camera':        '<b style="color:var(--cyan)">КАМЕРА:</b> тащи фон — поворот · <kbd>Shift</kbd>+мышь — сдвиг · колесо — зум',
  'help.keys':          'Клавиши: <kbd>← ↑ → ↓</kbd> <kbd>W</kbd>/<kbd>S</kbd> двигать · <kbd>Q E A D Z C</kbd> вращать',

  // ---- кнопки действий ----
  'btn.dock':           '▶ ТЕСТ ЛЕКАРСТВА',
  'btn.dock.busy':      '⏳ СЧИТАЕМ…',
  'btn.solve':          '💡 ПОДСКАЗКА',
  'btn.solve.on':       '💡 ПОДСКАЗКА: ВКЛ',
  'btn.levels':         '🗂 УРОВНИ',
  'btn.study':          '🔎 ИЗУЧЕНИЕ',
  'btn.study.on':       '🔎 ИЗУЧЕНИЕ: ВКЛ',
  'btn.coach':          '🎓 ОБУЧЕНИЕ',
  'btn.reset':          '↺ СБРОС',
  'btn.guide':          '❓ ОБ ИГРЕ',
  'btn.board':          '🏆 ЛИДЕРЫ',
  'btn.quality':        '⚙ ГРАФИКА: {{name}}',
  'quality.auto':       'АВТО ({{resolved}})',
  'quality.low':        'ЛЁГКАЯ',
  'quality.high':       'КРАСИВАЯ',
  'quality.lowWord':    'лёгкая',
  'quality.highWord':   'красивая',

  // ---- переключатель режимов (тач) ----
  'mode.move':          '✋ ДВИГАТЬ',
  'mode.rotate':        '🔄 ВРАЩАТЬ',
  'mode.depth':         '↕ ГЛУБИНА',

  // ---- модалка «об игре» ----
  'tut.skip':           'ПРОПУСТИТЬ ✕',
  'tut.tabAbout':       'О ЧЁМ ИГРА',
  'tut.tabHow':         'КАК ИГРАТЬ',
  'tut.prev':           '◀ Назад',
  'tut.next':           'Далее ▶',
  'tut.done':           'Готово ✓',

  // ---- выбор уровня ----
  'levels.close':       'ЗАКРЫТЬ ✕',
  'levels.title':       '🎯 ВЫБЕРИ РАКОВУЮ МИШЕНЬ',
  'levels.sub':         'Каждый уровень — <b>настоящий</b> раковый белок из базы PDB. <b>✔</b> — мишени, к которым лекарство уже подобрали (повтори успех учёных). <i>🔬</i> — мишени, к которым лекарства <i>ещё нет ни у кого</i>: они <i>открыты сразу</i>, тут нет «правильного ответа», любой твой результат — вклад в реальный поиск.',

  // ---- обучение ----
  'coach.skip':         'ПРОПУСТИТЬ ОБУЧЕНИЕ ✕',
  'coach.next':         'Далее ▶',
  'done.title':         'МИШЕНЬ ПРОЙДЕНА!',
};
```

- [ ] **Step 5: Разметить статику в index.html**

Подключить словари и рантайм между `state.js`/`perf.js` и остальными модулями:

```html
<script src="js/state.js"></script>
<script src="js/perf.js"></script>
<script src="js/lang-en.js"></script>
<script src="js/lang-ru.js"></script>
<script src="js/i18n.js"></script>
<script src="js/levels-data.js"></script>
```

Добавить кнопку языка в `#hdr` между 🔇 и ☰:

```html
  <button class="iconBtn" id="btnSound" data-i18n-title="btn.sound.title">🔇</button>
  <div id="langWrap">
    <button class="iconBtn" id="btnLang" data-i18n-title="btn.lang.title">🌐</button>
    <div id="langMenu">
      <button data-lang="en">English</button>
      <button data-lang="ru">Русский</button>
    </div>
  </div>
  <button class="iconBtn mobileOnly" id="btnMenu" data-i18n-title="btn.menu.title">☰</button>
```

Разметить остальную статику (у элементов, текст которых задаётся из JS — `#status`, `#hint`, `#distVal`, `#scoreVal`, `#best`, `#hdrSub`, `#mission`, `#loadTxt`, `#coachDoneTitle` — атрибуты **не** ставить, их наполняет `refreshDynamicText`; исключение — `#hdrSub`, `#loadTxt` и `#mission` получают начальные значения через `data-i18n*`, потому что до загрузки уровня в них стоит заглушка):

```html
<div id="load"><div class="spin"></div><div id="loadTxt" data-i18n="load.default">ЗАГРУЗКА СТРУКТУРЫ…</div></div>
```

```html
    <div class="sub" id="hdrSub" data-i18n="hdr.targetNone">МИШЕНЬ: —</div>
```

```html
<div id="score" class="panel">
  <div class="sub" data-i18n="score.label">СЧЁТ</div>
  <div id="scoreVal">0</div>
  <div id="best">РЕКОРД: 0</div>
</div>

<div id="lb" class="panel">
  <h2 data-i18n="board.title">◆ ЛИДЕРЫ</h2>
  <ol id="lbList"></ol>
</div>
```

```html
  <div id="mission" data-i18n-html="mission.closed"></div>
  <div class="mrow"><span data-i18n="meter.contact">КОНТАКТ С КАРМАНОМ</span><span id="status">—</span></div>
  <div class="bar"><div id="barFill"></div></div>
  <div id="hint">—</div>
  <div class="mrow" style="margin-top:6px;color:#6f8bbf">
    <span><span data-i18n="meter.distLabel">до цели:</span> <b id="distVal">—</b> Å</span>
    <span data-i18n="meter.inPocket">≤ 5 Å = в кармане</span>
  </div>
```

```html
<div id="help" class="panel">
  <div data-i18n-html="help.title"></div>
  <div data-i18n="help.move"></div>
  <div data-i18n="help.rotate"></div>
  <div data-i18n="help.wheel"></div>
  <div style="margin-top:6px;color:#6f8bbf" data-i18n-html="help.camera"></div>
  <div style="margin-top:5px;color:#6f8bbf" data-i18n-html="help.keys"></div>
</div>
```

Кнопки: `#btnDock`, `#btnLevels`, `#btnCoach`, `#btnReset`, `#btnGuide`, `#btnBoard` получают `data-i18n`; `#btnSolve`, `#btnInfo`, `#btnQuality` — **нет**, их подписи ставят `syncSolveBtn`/`syncInfoBtn`/`syncQualityBtn`:

```html
    <button class="b-dock" id="btnDock" data-i18n="btn.dock">▶ ТЕСТ ЛЕКАРСТВА</button>
    <div id="actionsRest">
      <button class="b-ghost" id="btnSolve">💡 ПОДСКАЗКА</button>
      <button class="b-ghost" id="btnLevels" data-i18n="btn.levels">🗂 УРОВНИ</button>
      <button class="b-ghost" id="btnInfo">🔎 ИЗУЧЕНИЕ</button>
      <button class="b-ghost" id="btnCoach" data-i18n="btn.coach">🎓 ОБУЧЕНИЕ</button>
      <button class="b-ghost" id="btnReset" data-i18n="btn.reset">↺ СБРОС</button>
      <button class="b-ghost" id="btnGuide" data-i18n="btn.guide">❓ ОБ ИГРЕ</button>
      <button class="b-ghost" id="btnQuality">⚙ ГРАФИКА</button>
      <button class="b-ghost mobileOnly" id="btnBoard" data-i18n="btn.board">🏆 ЛИДЕРЫ</button>
    </div>
```

Переключатель режимов:

```html
  <div id="modeBar" class="mobileOnly">
    <button data-mode="move" class="on" data-i18n="mode.move">✋ ДВИГАТЬ</button>
    <button data-mode="rotate" data-i18n="mode.rotate">🔄 ВРАЩАТЬ</button>
    <button data-mode="depth" data-i18n="mode.depth">↕ ГЛУБИНА</button>
  </div>
```

Модалки:

```html
    <div id="tutSkip" data-i18n="tut.skip">ПРОПУСТИТЬ ✕</div>
    <div class="tutTabs">
      <button class="tutTab" id="tutTabAbout" data-i18n="tut.tabAbout">О ЧЁМ ИГРА</button>
      <button class="tutTab" id="tutTabHow" data-i18n="tut.tabHow">КАК ИГРАТЬ</button>
    </div>
```

```html
    <div id="levelsClose" data-i18n="levels.close">ЗАКРЫТЬ ✕</div>
    <h2 id="levelsTitle" data-i18n="levels.title">🎯 ВЫБЕРИ РАКОВУЮ МИШЕНЬ</h2>
    <div class="lvSub" data-i18n-html="levels.sub"></div>
```

```html
  <div id="coachSkip" data-i18n="coach.skip">ПРОПУСТИТЬ ОБУЧЕНИЕ ✕</div>
```

`#tutPrev`, `#tutNext`, `#coachNext`, `#coachDoneGo`, `#coachDoneTitle` разметки не получают: их текст ставится из JS в Task 15.

- [ ] **Step 6: Стили дропдауна языка**

В `css/styles.css`, после блока `.iconBtn.on{...}`, добавить:

```css
/* выпадающий список языка (🌐) */
#langWrap{position:relative;flex:none}
#langMenu{display:none;position:absolute;top:46px;right:0;z-index:12;min-width:150px;
  padding:6px;border-radius:12px;background:#0b1230;border:1px solid #2a3a74;
  box-shadow:0 8px 30px rgba(0,0,0,.6)}
#langMenu.show{display:block}
#langMenu button{display:block;width:100%;text-align:left;min-height:44px;
  background:transparent;color:var(--txt);border:none;border-radius:8px;
  padding:10px 12px;font-size:13px;letter-spacing:.5px;font-weight:600}
#langMenu button:hover{background:#132155;color:var(--cyan)}
#langMenu button.on{color:var(--cyan)}
#langMenu button.on::after{content:'✓';float:right}
```

- [ ] **Step 7: Запустить проверки**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `--- selftest: 31 passed, 0 failed ---` (7 + 4 + 5 + 10 + 5).

- [ ] **Step 8: Проверить переключение статики**

Очистить ключ языка и перезагрузить: в консоли `localStorage.removeItem('pd_lang'); location.reload()`.

В браузере с русским языком интерфейса ожидается русский текст (это ожидаемое следствие «по языку браузера»); чтобы увидеть английский — `localStorage.setItem('pd_lang','en'); location.reload()`.

Затем проверить кнопку: тап/клик по 🌐 открывает список из двух пунктов, у текущего стоит ✓. Выбрать `English` — **без перезагрузки** меняются: «СЧЁТ» → «SCORE», «КОНТАКТ С КАРМАНОМ» → «POCKET CONTACT», «до цели:» → «to target:», «≤ 5 Å = в кармане», строка «Задача», подсказка по управлению слева снизу, подписи кнопок `▶ TEST THE DRUG`, `🗂 TARGETS`, `🎓 TUTORIAL`, `↺ RESET`, `❓ ABOUT`, заголовок и подзаголовок модалки уровней, `SKIP ✕` и вкладки в «ABOUT». Выбрать `Русский` — всё вернулось. Клик мимо списка его закрывает. `document.documentElement.lang` меняется вместе с языком.

Пока **не** переведены (это Task 14–15, и это ожидаемо на данном шаге): название мишени в хедере, тексты дек обучения, карточки уровней, тосты, подсказки шкалы, 3D-метки, подписи `💡`, `🔎`, `⚙`.

- [ ] **Step 9: Коммит**

```bash
git add js/i18n.js js/lang-en.js js/lang-ru.js index.html css/styles.css js/selftest.js
git commit -m "feat(i18n): dictionary runtime, language dropdown, static markup keys

First visit follows the browser language (ru prefix -> ru, everything else -> en);
an explicit pick is stored in pd_lang and wins from then on."
```

---

### Task 14: Вынести текст уровней в словари

`js/levels-data.js` перестаёт содержать текст: остаются только структурные поля. Тексты уровней живут в словарях под `levels.<id>.*`, подсказки по мутациям — под `hotspot.<id>.<resi>`.

**Files:**
- Modify: `js/levels-data.js` (убрать весь текст)
- Modify: `js/lang-en.js`, `js/lang-ru.js` (ключи уровней, горячих точек, единицы, карточки)
- Modify: `js/i18n.js` (хелперы `levelName` и родственные)
- Modify: `js/levels.js` (`renderLevels` через `t()`)
- Modify: `js/scoring.js:17` (метка кармана из словаря)
- Modify: `js/scene.js` (`hdrSub`, `mission`, `loadTxt`, `document.title`, `HOTSPOTS`)

**Interfaces:**
- Consumes: `t()`, `LANG`.
- Produces (в `js/i18n.js`):
  - `levelName(L) → string`, `levelSub(L) → string`, `levelBlurb(L) → string`
  - `levelDrug(L) → string` — пустая строка, если реального лекарства нет
  - `levelPocketLabel(L) → string`
  - `hotspotText(levelId, resi) → string | null`

- [ ] **Step 1: Почистить levels-data.js**

Полностью заменить содержимое `js/levels-data.js` на:

```js
/* ============================================================
   LEVELS — real cancer targets from the PDB.
   ------------------------------------------------------------
   Здесь только СТРУКТУРА уровня. Весь текст (название, подпись,
   описание, название лекарства, метка кармана, подсказки по
   мутациям) живёт в словарях js/lang-*.js под ключами
   levels.<id>.* и hotspot.<id>.<resi> — см. хелперы levelName()
   и hotspotText() в js/i18n.js.

   pdb    — 4-символьный идентификатор структуры, скачивается на лету.
   pocket — как найти «карман» (цель стыковки):
     {type:'elem', value:'ZN'}  — по химическому элементу (ион);
     {type:'resn', value:'STI'} — по имени остатка/лиганда;
     {type:'auto'}              — автоматически: самый крупный
                                  связанный лиганд (настоящее
                                  лекарство в кристалле), иначе
                                  вогнутость на поверхности.
   open:true — «открытая задача»: лекарства не существует ни у кого,
               эталона нет, уровень никогда не помечается пройденным.
   hotspots  — есть ли у уровня таблица частых раковых мутаций
               (тексты берутся по hotspot.<id>.<resi>).
   ============================================================ */
const LEVELS = [
  { id:'p53',       pdb:'1TUP', open:false, hotspots:true,
    pocket:{type:'elem', value:'ZN'} },

  { id:'bcrabl',    pdb:'2HYY', open:false, hotspots:false,
    pocket:{type:'auto'} },

  { id:'egfr',      pdb:'1M17', open:false, hotspots:false,
    pocket:{type:'auto'} },

  { id:'kras_g12c', pdb:'6OIM', open:false, hotspots:false,
    pocket:{type:'auto'} },

  // ---------- OPEN PROBLEMS: no drug exists yet for anyone ----------
  { id:'myc',       pdb:'1NKP', open:true,  hotspots:false,
    pocket:{type:'auto'} },

  { id:'ras_wt',    pdb:'5P21', open:true,  hotspots:false,
    pocket:{type:'auto'} },
];

// номера остатков p53, для которых в словарях есть подсказки по мутациям
const P53_HOTSPOT_RESI = [175, 176, 179, 238, 242, 245, 248, 249, 273, 282];
```

- [ ] **Step 2: Хелперы в i18n.js**

В `js/i18n.js`, после `numFmt`, добавить:

```js
/* ---------- текст уровня ----------
   levels-data.js хранит только структуру; всё читаемое — здесь. */
function levelName(L){        return L ? t('levels.' + L.id + '.name')        : ''; }
function levelSub(L){         return L ? t('levels.' + L.id + '.sub')         : ''; }
function levelBlurb(L){       return L ? t('levels.' + L.id + '.blurb')       : ''; }
function levelPocketLabel(L){ return L ? t('levels.' + L.id + '.pocketLabel') : t('pocket.default'); }
// пустая строка = реального лекарства к этой мишени нет
function levelDrug(L){        return L ? t('levels.' + L.id + '.drug')        : ''; }
// подсказка по частой раковой мутации в остатке resi, или null
function hotspotText(levelId, resi){
  const d = I18N[LANG] || I18N.en;
  const k = 'hotspot.' + levelId + '.' + resi;
  return d[k] != null ? d[k] : null;
}
```

- [ ] **Step 3: Ключи уровней в оба словаря**

В `js/lang-en.js` добавить:

```js
  // ---- units / pocket ----
  'unit.kcal':          'kcal/mol',
  'pocket.default':     'POCKET',

  // ---- levels ----
  'levels.p53.name':        'p53',
  'levels.p53.sub':         '"guardian of the genome"',
  'levels.p53.drug':        '',
  'levels.p53.pocketLabel': 'POCKET (Zn)',
  'levels.p53.blurb':       'p53 is broken in more than half of all tumours. The target is the structural zinc ion (Zn²⁺) that holds the protein fold together.',

  'levels.bcrabl.name':        'BCR-ABL',
  'levels.bcrabl.sub':         'imatinib · Gleevec®',
  'levels.bcrabl.drug':        'Imatinib (Gleevec®)',
  'levels.bcrabl.pocketLabel': 'POCKET (imatinib site)',
  'levels.bcrabl.blurb':       'The BCR-ABL fusion protein is stuck in the "on" state and causes leukaemia. Gleevec sits down in its ATP pocket — the first loud success of targeted therapy. The pocket is placed on the real drug in the structure.',

  'levels.egfr.name':        'EGFR',
  'levels.egfr.sub':         'erlotinib · Tarceva®',
  'levels.egfr.drug':        'Erlotinib (Tarceva®)',
  'levels.egfr.pocketLabel': 'POCKET (erlotinib site)',
  'levels.egfr.blurb':       'Mutant EGFR drives lung cells to divide without stopping. Erlotinib blocks its kinase pocket. The target follows the real drug molecule inside structure 1M17.',

  'levels.kras_g12c.name':        'KRAS G12C',
  'levels.kras_g12c.sub':         'sotorasib · 2021',
  'levels.kras_g12c.drug':        'Sotorasib (AMG 510)',
  'levels.kras_g12c.pocketLabel': 'POCKET (sotorasib site)',
  'levels.kras_g12c.blurb':       'KRAS was considered "undruggable" for 40 years. In 2021 sotorasib bound the G12C mutant for the first time — a real breakthrough. The pocket follows the real ligand in the structure.',

  'levels.myc.name':        'MYC',
  'levels.myc.sub':         '🔬 open problem',
  'levels.myc.drug':        '',
  'levels.myc.pocketLabel': 'MYC SURFACE',
  'levels.myc.blurb':       'MYC drives the growth of a huge number of tumours, but it has no convenient pocket — no direct drug exists to this day. It is oncology\'s "holy grail". There is no reference answer: any result you get is a search at the frontier of science.',

  'levels.ras_wt.name':        'RAS (wild type)',
  'levels.ras_wt.sub':         '🔬 open problem',
  'levels.ras_wt.drug':        '',
  'levels.ras_wt.pocketLabel': 'RAS SURFACE',
  'levels.ras_wt.blurb':       'Ordinary (non-mutant) RAS from the KRAS/HRAS family — smooth and "slippery", with almost nothing to grab. Most forms of RAS are still out of reach for drugs. There is no reference answer: look for somewhere to latch the key.',

  // ---- p53 cancer-mutation hotspots (study mode) ----
  'hotspot.p53.175': 'Arg175 — the MOST common cancer mutation in p53. Holds the domain fold together at the zinc.',
  'hotspot.p53.176': 'Cys176 — holds the zinc ion (the structural centre).',
  'hotspot.p53.179': 'His179 — coordinates the zinc.',
  'hotspot.p53.238': 'Cys238 — coordinates the zinc.',
  'hotspot.p53.242': 'Cys242 — coordinates the zinc.',
  'hotspot.p53.245': 'Gly245 — a mutation hotspot, critical for the protein fold.',
  'hotspot.p53.248': 'Arg248 — reads the DNA DIRECTLY in the major groove. A frequent mutation in cancer.',
  'hotspot.p53.249': 'Arg249 — a structural hotspot (often mutated in liver cancer).',
  'hotspot.p53.273': 'Arg273 — a key contact with the DNA backbone. One of the main cancer mutations.',
  'hotspot.p53.282': 'Arg282 — stabilises the DNA-binding surface.',

  // ---- level cards ----
  'lv.num':             'LEVEL {{n}}',
  'lv.tagOpen':         'OPEN PROBLEM',
  'lv.lockedPrevOpen':  'try the previous one first',
  'lv.locked':          'clear the previous target first',
  'lv.openBest':        'your best: {{v}}',
  'lv.openNone':        'no drug exists yet — be the first!',
  'lv.solved':          'CLEARED · best: {{v}}',
  'lv.todoBest':        'attempt: {{v}} — push it all the way into the pocket',
  'lv.todoNone':        'unlocked — go for it!',
  'lv.lockedToast':     '🔒 Deal with the previous target first',
  'lv.pickToast':       'Open 🗂 TARGETS when you are ready to pick a target',
  'lv.loadError':       '⚠ Could not load {{pdb}} from the PDB. Check your connection.',
```

В `js/lang-ru.js` добавить те же ключи с текущими русскими текстами:

```js
  // ---- единицы / карман ----
  'unit.kcal':          'ккал/моль',
  'pocket.default':     'КАРМАН',

  // ---- уровни ----
  'levels.p53.name':        'p53',
  'levels.p53.sub':         '«страж генома»',
  'levels.p53.drug':        '',
  'levels.p53.pocketLabel': 'КАРМАН (Zn)',
  'levels.p53.blurb':       'p53 сломан более чем в половине всех опухолей. Цель — структурный ион цинка (Zn²⁺), на котором держится укладка белка.',

  'levels.bcrabl.name':        'BCR-ABL',
  'levels.bcrabl.sub':         'иматиниб · Гливек®',
  'levels.bcrabl.drug':        'Иматиниб (Гливек®)',
  'levels.bcrabl.pocketLabel': 'КАРМАН (сайт иматиниба)',
  'levels.bcrabl.blurb':       'Слитый белок BCR-ABL «залипает» во включённом состоянии и вызывает лейкоз. Гливек садится в его АТФ-карман — первый громкий успех точечной терапии. Карман показан по реальному лекарству в структуре.',

  'levels.egfr.name':        'EGFR',
  'levels.egfr.sub':         'эрлотиниб · Тарцева®',
  'levels.egfr.drug':        'Эрлотиниб (Тарцева®)',
  'levels.egfr.pocketLabel': 'КАРМАН (сайт эрлотиниба)',
  'levels.egfr.blurb':       'Мутантный EGFR гонит клетки лёгкого делиться без остановки. Эрлотиниб блокирует его киназный карман. Цель — по реальной молекуле лекарства в структуре 1M17.',

  'levels.kras_g12c.name':        'KRAS G12C',
  'levels.kras_g12c.sub':         'соторасиб · 2021',
  'levels.kras_g12c.drug':        'Соторасиб (AMG 510)',
  'levels.kras_g12c.pocketLabel': 'КАРМАН (сайт соторасиба)',
  'levels.kras_g12c.blurb':       'KRAS 40 лет считался «недоступным». В 2021-м соторасиб впервые связал мутант G12C — настоящий прорыв. Карман — по реальному лиганду в структуре.',

  'levels.myc.name':        'MYC',
  'levels.myc.sub':         '🔬 открытая задача',
  'levels.myc.drug':        '',
  'levels.myc.pocketLabel': 'ПОВЕРХНОСТЬ MYC',
  'levels.myc.blurb':       'MYC разгоняет рост огромного числа опухолей, но у него нет удобного кармана — прямого лекарства не существует до сих пор. Это «святой Грааль» онкологии. Эталона нет: любой твой результат — поиск на переднем крае науки.',

  'levels.ras_wt.name':        'RAS (дикий тип)',
  'levels.ras_wt.sub':         '🔬 открытая задача',
  'levels.ras_wt.drug':        '',
  'levels.ras_wt.pocketLabel': 'ПОВЕРХНОСТЬ RAS',
  'levels.ras_wt.blurb':       'Обычный (немутантный) RAS из семейства KRAS/HRAS — гладкий и «скользкий», зацепиться почти негде. Большинство форм RAS до сих пор недоступны для лекарств. Эталона нет: ищи, куда «прицепить» ключ.',

  // ---- горячие точки мутаций p53 (режим изучения) ----
  'hotspot.p53.175': 'Arg175 — САМАЯ частая раковая мутация p53. Держит укладку домена у цинка.',
  'hotspot.p53.176': 'Cys176 — удерживает ион цинка (структурный центр).',
  'hotspot.p53.179': 'His179 — координирует цинк.',
  'hotspot.p53.238': 'Cys238 — координирует цинк.',
  'hotspot.p53.242': 'Cys242 — координирует цинк.',
  'hotspot.p53.245': 'Gly245 — горячая точка мутаций, критична для укладки белка.',
  'hotspot.p53.248': 'Arg248 — НАПРЯМУЮ читает ДНК в большой бороздке. Частая мутация в раке.',
  'hotspot.p53.249': 'Arg249 — структурная горячая точка (часто мутирует при раке печени).',
  'hotspot.p53.273': 'Arg273 — ключевой контакт с остовом ДНК. Одна из главных раковых мутаций.',
  'hotspot.p53.282': 'Arg282 — стабилизирует ДНК-связывающую поверхность.',

  // ---- карточки уровней ----
  'lv.num':             'УРОВЕНЬ {{n}}',
  'lv.tagOpen':         'ОТКРЫТАЯ ЗАДАЧА',
  'lv.lockedPrevOpen':  'сначала попробуй предыдущую',
  'lv.locked':          'сначала пройди предыдущую мишень',
  'lv.openBest':        'твой лучший: {{v}}',
  'lv.openNone':        'лекарства ещё нет — попробуй первым!',
  'lv.solved':          'ПРОЙДЕНО · лучшее: {{v}}',
  'lv.todoBest':        'попытка: {{v}} — дожми до кармана',
  'lv.todoNone':        'доступно — вперёд!',
  'lv.lockedToast':     '🔒 Сначала разберись с предыдущей мишенью',
  'lv.pickToast':       'Открой 🗂 УРОВНИ, когда будешь готов выбрать мишень',
  'lv.loadError':       '⚠ Не удалось загрузить {{pdb}} из PDB. Проверь интернет.',
```

- [ ] **Step 4: Перевести renderLevels**

В `js/levels.js` заменить тело `renderLevels()` на:

```js
function renderLevels(){
  const prog = getProg();
  el('levelGrid').innerHTML = LEVELS.map((L,i)=>{
    const pr = prog[L.id] || {}, unlocked = isUnlocked(i, prog);
    const bestTxt = pr.best!=null ? pr.best.toFixed(1)+' '+t('unit.kcal') : null;
    let cls, badge, foot;
    if(!unlocked){
      cls='lv-lock'; badge='🔒';
      foot = LEVELS[i-1] && LEVELS[i-1].open ? t('lv.lockedPrevOpen') : t('lv.locked');
    } else if(L.open){
      cls='lv-open'; badge='🔬';
      foot = bestTxt ? t('lv.openBest', {v:bestTxt}) : t('lv.openNone');
    } else if(pr.solved){
      cls='lv-done'; badge='✔';
      foot = t('lv.solved', {v: bestTxt || '—'});
    } else {
      cls='lv-todo'; badge='▶';
      foot = bestTxt ? t('lv.todoBest', {v:bestTxt}) : t('lv.todoNone');
    }
    const tag = L.open ? t('lv.tagOpen') : levelDrug(L);
    return `<div class="lvCard ${cls}" data-i="${i}" title="${levelBlurb(L).replace(/"/g,'&quot;')}">
      <div class="lvTop"><span class="lvNum">${t('lv.num',{n:i+1})}</span><span class="lvBadge">${badge}</span></div>
      <div class="lvName">${levelName(L)}</div>
      <div class="lvTag">${tag}</div>
      <div class="lvFoot">${foot}</div>
    </div>`;
  }).join('');
  el('levelGrid').querySelectorAll('.lvCard').forEach(c=>{
    const i = +c.dataset.i;
    c.onclick = isUnlocked(i, getProg())
      ? ()=>loadLevel(i)
      : ()=>showToast(t('lv.lockedToast'));
  });
}
```

И в том же файле, было:

```js
  if(!LEVEL) showToast('Открой 🗂 УРОВНИ, когда будешь готов выбрать мишень', 2600);
```

стало:

```js
  if(!LEVEL) showToast(t('lv.pickToast'), 2600);
```

- [ ] **Step 5: Метка кармана и текст загрузки уровня**

В `js/scoring.js`, функция `findPocket`, было:

```js
  const strat = (LEVEL && LEVEL.pocket) || {type:'auto'};
  const label = strat.label || 'КАРМАН';
```

стало:

```js
  const strat = (LEVEL && LEVEL.pocket) || {type:'auto'};
  const label = levelPocketLabel(LEVEL);   // текст живёт в словарях, см. js/i18n.js
```

В `js/scene.js`, функция `loadLevel`, было:

```js
  document.title = 'PROTEIN DOCKER — ' + LEVEL.name + ' (' + LEVEL.pdb + ')';
  el('hdrSub').textContent = 'МИШЕНЬ: ' + LEVEL.name + ' · PDB ' + LEVEL.pdb + ' · ' + LEVEL.sub;
  el('mission').innerHTML = LEVEL.open
    ? '🔬 <b>Открытая задача:</b> лекарства ещё нет ни у кого — ищи, куда «прицепить» ключ на белке <b>' + LEVEL.name + '</b>'
    : '🎯 <b>Задача:</b> приведи молекулу-ключ в зелёный карман и заткни «выключатель» рака';
```

стало:

```js
  syncLevelText();
```

было:

```js
  el('loadTxt').textContent = 'ЗАГРУЗКА СТРУКТУРЫ ' + LEVEL.name + ' · ' + LEVEL.pdb + '…';
```

стало:

```js
  el('loadTxt').textContent = t('load.level', {name: levelName(LEVEL), pdb: LEVEL.pdb});
```

И добавить в `js/scene.js`, перед `function levelLoadError()`, общую функцию (её же позовёт смена языка в Task 16):

```js
// заголовки, зависящие от текущего уровня И текущего языка
function syncLevelText(){
  if(!LEVEL) return;
  document.title = 'PROTEIN DOCKER — ' + levelName(LEVEL) + ' (' + LEVEL.pdb + ')';
  el('hdrSub').textContent = t('hdr.target',
    {name: levelName(LEVEL), pdb: LEVEL.pdb, sub: levelSub(LEVEL)});
  el('mission').innerHTML = LEVEL.open
    ? t('mission.open', {name: levelName(LEVEL)})
    : t('mission.closed');
}
```

было:

```js
  showToast('⚠ Не удалось загрузить ' + (LEVEL ? LEVEL.pdb : '') + ' из PDB. Проверь интернет.', 3200);
```

стало:

```js
  showToast(t('lv.loadError', {pdb: LEVEL ? LEVEL.pdb : '—'}), 3200);
```

- [ ] **Step 6: Горячие точки по новому формату**

В `js/scene.js`, функция `onModelLoaded`, было:

```js
  HOTSPOTS = LEVEL.hotspots || {};
```

стало:

```js
  // тексты подсказок живут в словарях; здесь только список остатков,
  // для которых они есть (см. hotspotText в js/i18n.js)
  HOTSPOTS = (LEVEL.hotspots && LEVEL.id === 'p53') ? P53_HOTSPOT_RESI : [];
```

В `js/study.js`, функция `annotate`, было:

```js
  s += HOTSPOTS[resi] ? '\n★ '+HOTSPOTS[resi] : `\nАминокислота белка ${NM}.`;
```

стало:

```js
  const hs = LEVEL ? hotspotText(LEVEL.id, resi) : null;
  s += hs ? '\n★ '+hs : `\nАминокислота белка ${NM}.`;
```

В `js/state.js`, было:

```js
let HOTSPOTS = {};   // per-level cancer-mutation hotspots (set on load)
```

стало:

```js
// номера остатков с подсказками по раковым мутациям (сами тексты — в словарях)
let HOTSPOTS = [];
```

- [ ] **Step 7: Проверить**

Открыть `http://localhost:8000/index.html?selftest`: ожидается по-прежнему `31 passed, 0 failed`, и **ни одного** предупреждения `[i18n] нет ключа:` в консоли.

Открыть `http://localhost:8000/index.html`:

- переключить язык на `English` → в хедере `TARGET: p53 · PDB 1TUP · "guardian of the genome"`, строка задачи по-английски, заголовок вкладки браузера `PROTEIN DOCKER — p53 (1TUP)`;
- открыть `🗂 TARGETS`: заголовок, подзаголовок, `LEVEL 1…6`, названия, `Imatinib (Gleevec®)`, `OPEN PROBLEM`, подписи снизу карточек и всплывающая подсказка карточки (`title`) — по-английски; у `RAS (wild type)` название переведено;
- переключить на `Русский` без перезагрузки → всё вернулось, `RAS (дикий тип)`;
- загрузить уровень 2 (`BCR-ABL`) — экран загрузки говорит `ЗАГРУЗКА СТРУКТУРЫ BCR-ABL · 2HYY…`, метка цели в 3D — `◎ ЦЕЛЬ: КАРМАН (сайт иматиниба)`; в английском — `POCKET (imatinib site)`;
- вернуться на уровень 1, включить `🔎 ИЗУЧЕНИЕ`, приблизиться и навести на остаток 248 — в подсказке звёздочка и текст про Arg248; переключить язык и повторить — текст английский;
- ввести в консоли `loadLevel(0)` при отключённом интернете (в DevTools вкладка Network → Offline) — тост об ошибке загрузки на текущем языке.

- [ ] **Step 8: Коммит**

```bash
git add js/levels-data.js js/levels.js js/scoring.js js/scene.js js/study.js js/state.js js/i18n.js js/lang-en.js js/lang-ru.js
git commit -m "feat(i18n): move all level text into the dictionaries

levels-data.js now holds structure only (id, pdb, open, pocket strategy);
names, subtitles, blurbs, drug names, pocket labels and p53 mutation hotspots
live under levels.<id>.* and hotspot.<id>.<resi>."
```

---

### Task 15: Строки игрового цикла — HUD, шкала, режим изучения, 3D-метки

**Files:**
- Modify: `js/lang-en.js`, `js/lang-ru.js`
- Modify: `js/hud.js` (тосты, `prompt`, источник расчёта, подписи кнопок)
- Modify: `js/scoring.js:140-156` (`quality`)
- Modify: `js/study.js` (`annotate`, метка цели, тосты, `syncInfoBtn`)
- Modify: `js/scene.js:149-180` (`syncLabels`)
- Modify: `js/perf.js` (`syncQualityBtn` через `t()`)

**Interfaces:**
- Consumes: `t()`, `numFmt()`, `levelName()`, `IS_TOUCH`.
- Produces: ничего нового.

- [ ] **Step 1: Добавить ключи в оба словаря**

В `js/lang-en.js` добавить:

```js
  // ---- toasts / prompts ----
  'toast.pickFirst':    'Pick a target first — 🗂 TARGETS',
  'toast.hint':         '💡 The translucent blinking molecule is the ideal position. Copy its pose and its rotation with your own drug.',
  'toast.vinaDown':     '⚠ Vina unavailable ({{err}}) — falling back to the learning model',
  'toast.record':       '★ NEW BEST!  {{aff}} {{unit}} · {{src}}',
  'toast.result':       '{{aff}} {{unit}} · {{pts}} points · {{src}}',
  'toast.firstTest':    '{{aff}} {{unit}} is how strongly the key "sticks". The bigger the minus, the tighter it holds and the more points you score! ({{pts}})',
  'toast.studyOn':      '🔎 Hover the target, the protein, the zinc or the DNA',
  'toast.studyOnTouch': '🔎 Tap the target, the protein, the zinc or the DNA',
  'toast.studyOff':     'Study mode off',
  'toast.boardEmpty':   'Nobody on the board yet — play and get on it!',
  'prompt.record':      'NEW BEST! Enter a nickname for the leaderboard:',
  'prompt.defaultName': 'PLAYER',
  'engine.learn':       'learning model',
  'engine.learnFallback':'learning model (Vina unavailable)',
  'engine.noServer':    'no connection to the server',

  // ---- 3D labels ----
  'label.target':       '◎ TARGET: {{label}}',
  'label.drug':         '🔹 YOUR DRUG',

  // ---- meter statuses and hints ----
  'q.far':              'FAR',
  'q.far.hint':         '🔑 steer the molecule toward the green pocket',
  'q.closer':           'CLOSING IN…',
  'q.closer.hint':      'closer still to the "switch"',
  'q.close':            'CLOSE',
  'q.close.hint':       'almost in the keyhole — bring it right up to the green marker',
  'q.clash':            'CLASHING',
  'q.clash.hint':       'the molecule is colliding with the protein — turn it so it sits flush',
  'q.seated':           '★ SNUG FIT!',
  'q.seated.hint':      '✅ great fit! press "TEST THE DRUG"',
  'q.inPocket':         'IN THE POCKET',
  'q.inPocket.hint':    'keep turning — look for the angle where the key sits tighter',

  // ---- study mode tooltips ----
  'study.proteinFallback':'the protein',
  'study.zn':           '🎯 ZINC ION (Zn²⁺)\nThe structural anchor of the {{name}} core — our docking target.',
  'study.water':        '💧 Water molecule\nPart of the crystal structure, not of the protein itself.',
  'study.het':          '🔶 {{resn}} · chain {{chain}}\nAn ion or small molecule bound to the structure{{extra}}.',
  'study.hetDrug':      ' (including the drug itself — the docking target)',
  'study.dnaChain':     '🧬 DNA · chain {{chain}}\nA strand of {{n}} nucleotides. Cancer proteins like {{name}}\ncontact DNA and control how genes work.\n🔍 Zoom in to point at a single nucleotide.',
  'study.dnaRes':       '🧬 Nucleotide {{resn}}{{resi}} · chain {{chain}}\nA single link of the DNA strand next to the {{name}} protein.',
  'study.chain':        '🔷 Chain {{chain}} — the {{name}} protein\nA ribbon of {{n}} amino acids.\n🔍 Zoom in to point at a single amino acid.',
  'study.resHead':      '🔷 {{resn}}{{resi}} · chain {{chain}}',
  'study.resPlain':     'An amino acid of the {{name}} protein.',
  'study.targetLabel':      '◎ DOCKING TARGET — hover to learn',
  'study.targetLabelTouch': '◎ DOCKING TARGET — tap to learn',
```

В `js/lang-ru.js` добавить те же ключи:

```js
  // ---- тосты / запросы ----
  'toast.pickFirst':    'Сначала выбери мишень — 🗂 УРОВНИ',
  'toast.hint':         '💡 Полупрозрачная мигающая молекула — идеальное положение. Повтори её позу и поворот своим лекарством.',
  'toast.vinaDown':     '⚠ Vina недоступна ({{err}}) — считаю обучающей моделью',
  'toast.record':       '★ РЕКОРД!  {{aff}} {{unit}} · {{src}}',
  'toast.result':       '{{aff}} {{unit}} · {{pts}} очков · {{src}}',
  'toast.firstTest':    '{{aff}} {{unit}} — это сила «прилипания» ключа. Чем больше минус, тем крепче держится и тем больше очков! ({{pts}})',
  'toast.studyOn':      '🔎 Наведи курсор на цель, белок, цинк или ДНК',
  'toast.studyOnTouch': '🔎 Нажми на цель, белок, цинк или ДНК',
  'toast.studyOff':     'Режим изучения выключен',
  'toast.boardEmpty':   'Пока никто не отметился — сыграй и попади в таблицу!',
  'prompt.record':      'РЕКОРД! Введите ник для таблицы лидеров:',
  'prompt.defaultName': 'ИГРОК',
  'engine.learn':       'обучающая модель',
  'engine.learnFallback':'обучающая модель (Vina недоступна)',
  'engine.noServer':    'нет связи с сервером',

  // ---- метки в 3D ----
  'label.target':       '◎ ЦЕЛЬ: {{label}}',
  'label.drug':         '🔹 ТВОЁ ЛЕКАРСТВО',

  // ---- статусы и подсказки шкалы ----
  'q.far':              'ДАЛЕКО',
  'q.far.hint':         '🔑 веди молекулу к зелёному карману',
  'q.closer':           'ПОДБИРАЕМСЯ…',
  'q.closer.hint':      'ещё ближе к «выключателю»',
  'q.close':            'БЛИЗКО',
  'q.close.hint':       'почти в скважине — доведи вплотную к зелёной метке',
  'q.clash':            'УПИРАЕТСЯ',
  'q.clash.hint':       'молекула сталкивается с белком — поверни её, чтобы легла плотнее',
  'q.seated':           '★ ПЛОТНО СЕЛ!',
  'q.seated.hint':      '✅ отличная посадка! жми «ТЕСТ ЛЕКАРСТВА»',
  'q.inPocket':         'В КАРМАНЕ',
  'q.inPocket.hint':    'поворачивай — ищи угол, где ключ ляжет плотнее',

  // ---- подсказки режима изучения ----
  'study.proteinFallback':'белок',
  'study.zn':           '🎯 ИОН ЦИНКА (Zn²⁺)\nСтруктурная опора ядра {{name}} — наша мишень для стыковки.',
  'study.water':        '💧 Молекула воды\nЧасть кристаллической структуры, а не самого белка.',
  'study.het':          '🔶 {{resn}} · цепь {{chain}}\nИон или малая молекула, связанная со структурой{{extra}}.',
  'study.hetDrug':      ' (в т.ч. само лекарство — цель стыковки)',
  'study.dnaChain':     '🧬 ДНК · цепь {{chain}}\nНить из {{n}} нуклеотидов. Раковые белки вроде {{name}}\nконтактируют с ДНК и управляют работой генов.\n🔍 Приблизься, чтобы навести на отдельный нуклеотид.',
  'study.dnaRes':       '🧬 Нуклеотид {{resn}}{{resi}} · цепь {{chain}}\nОтдельное звено нити ДНК рядом с белком {{name}}.',
  'study.chain':        '🔷 Цепь {{chain}} — белок {{name}}\nЛента из {{n}} аминокислот.\n🔍 Приблизься, чтобы навести на отдельную аминокислоту.',
  'study.resHead':      '🔷 {{resn}}{{resi}} · цепь {{chain}}',
  'study.resPlain':     'Аминокислота белка {{name}}.',
  'study.targetLabel':      '◎ ЦЕЛЬ стыковки — наведи, чтобы узнать',
  'study.targetLabelTouch': '◎ ЦЕЛЬ стыковки — нажми, чтобы узнать',
```

- [ ] **Step 2: Перевести scoring.js**

В `js/scoring.js` заменить тело `quality()` целиком на:

```js
function quality(fit){
  const {centerDist, clash, affinity} = fit;
  // ---- phase 1: still bringing the key toward the pocket ----
  if(centerDist>20) return {color:'#ff2e5b', status:t('q.far'),    pct:6,  hint:t('q.far.hint')};
  if(centerDist>10) return {color:'#ff8a1e', status:t('q.closer'), pct:26, hint:t('q.closer.hint')};
  if(centerDist>5)  return {color:'#ffb000', status:t('q.close'),  pct:44, hint:t('q.close.hint')};
  // ---- phase 2: in the pocket → orientation / seating now drives the score ----
  // seating quality from the binding energy: -3 (loose) … -12 (tight)
  const q = Math.max(0, Math.min(1, (-affinity-3)/9));
  const pct = Math.round(55 + q*45);
  if(clash>1.2) return {color:'#ffb000', status:t('q.clash'),  pct:Math.min(pct,62), hint:t('q.clash.hint')};
  if(q>0.75)    return {color:'#39ff14', status:t('q.seated'), pct:100,              hint:t('q.seated.hint')};
  return          {color:'#ffe600', status:t('q.inPocket'), pct,                     hint:t('q.inPocket.hint')};
}
```

- [ ] **Step 3: Перевести 3D-метки**

В `js/scene.js`, функция `syncLabels`, было:

```js
      targetLabel = viewer.addLabel("◎ ЦЕЛЬ: " + POCKET_LABEL, {
```

стало:

```js
      targetLabel = viewer.addLabel(t('label.target', {label: POCKET_LABEL}), {
```

было:

```js
      ligLabel = viewer.addLabel("🔹 ТВОЁ ЛЕКАРСТВО", {
```

стало:

```js
      ligLabel = viewer.addLabel(t('label.drug'), {
```

- [ ] **Step 4: Перевести hud.js**

В `js/hud.js`, было:

```js
function syncSolveBtn(){
  el('btnSolve').textContent = showSolution ? '💡 ПОДСКАЗКА: ВКЛ' : '💡 ПОДСКАЗКА';
```

стало:

```js
function syncSolveBtn(){
  el('btnSolve').textContent = showSolution ? t('btn.solve.on') : t('btn.solve');
```

Далее по файлу заменить строки:

```js
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
```

на (все три вхождения — в `btnSolve`, `btnDock`, `btnReset`):

```js
  if(!pocket){ showToast(t('toast.pickFirst')); return; }
```

было:

```js
    showToast('💡 Полупрозрачная мигающая молекула — идеальное положение. Повтори её позу и поворот своим лекарством.', 4200);
```

стало:

```js
    showToast(t('toast.hint'), 4200);
```

было:

```js
  btn.disabled=true; btn.textContent='⏳ СЧИТАЕМ…';
```

стало:

```js
  btn.disabled=true; btn.textContent=t('btn.dock.busy');
```

было:

```js
      affinity = fitEnergy(world).affinity;   // Vina unavailable → learning model, and say so
      source = 'обучающая модель (Vina недоступна)';
      showToast('⚠ Vina недоступна ('+(e.message||'нет связи с сервером')+') — считаю обучающей моделью', 3800);
```

стало:

```js
      affinity = fitEnergy(world).affinity;   // Vina unavailable → learning model, and say so
      source = t('engine.learnFallback');
      showToast(t('toast.vinaDown', {err: e.message || t('engine.noServer')}), 3800);
```

было:

```js
    affinity = fitEnergy(world).affinity;      // learning mode: instant, in-browser
    source = 'обучающая модель';
```

стало:

```js
    affinity = fitEnergy(world).affinity;      // learning mode: instant, in-browser
    source = t('engine.learn');
```

было:

```js
    msg = `★ РЕКОРД!  ${affinity.toFixed(1)} ккал/моль · ${source}`;
    saveScore(pts);
  } else {
    msg = `${affinity.toFixed(1)} ккал/моль · ${pts.toLocaleString('ru-RU')} очков · ${source}`;
  }
```

стало:

```js
    msg = t('toast.record', {aff: affinity.toFixed(1), unit: t('unit.kcal'), src: source});
    saveScore(pts);
  } else {
    msg = t('toast.result', {aff: affinity.toFixed(1), unit: t('unit.kcal'),
                             pts: numFmt(pts), src: source});
  }
```

было:

```js
    showToast(`${affinity.toFixed(1)} ккал/моль — это сила «прилипания» ключа. Чем больше минус, тем крепче держится и тем больше очков! (${pts.toLocaleString('ru-RU')})`, 4600);
```

стало:

```js
    showToast(t('toast.firstTest', {aff: affinity.toFixed(1), unit: t('unit.kcal'),
                                    pts: numFmt(pts)}), 4600);
```

было:

```js
  el('btnSound').title = soundOn ? 'Звук: вкл' : 'Звук: выкл';
```

стало:

```js
  el('btnSound').title = soundOn ? t('btn.sound.on') : t('btn.sound.off');
```

было:

```js
function saveScore(pts){
  let name = prompt('РЕКОРД! Введите ник для таблицы лидеров:', 'ИГРОК');
  if(!name) name='ИГРОК';
```

стало:

```js
function saveScore(pts){
  let name = prompt(t('prompt.record'), t('prompt.defaultName'));
  if(!name) name=t('prompt.defaultName');
```

было (в `syncScore` из Task 9):

```js
function syncScore(){
  el('scoreVal').textContent = score.toLocaleString('ru-RU');
  el('best').textContent = 'РЕКОРД: ' + best.toLocaleString('ru-RU');
  const h = el('hdrScore');
  if(h) h.textContent = 'СЧЁТ ' + score.toLocaleString('ru-RU') + ' · РЕКОРД ' + best.toLocaleString('ru-RU');
}
```

стало:

```js
function syncScore(){
  el('scoreVal').textContent = numFmt(score);
  el('best').textContent = t('score.best', {n: numFmt(best)});
  const h = el('hdrScore');
  if(h) h.textContent = t('score.line', {s: numFmt(score), b: numFmt(best)});
}
```

было (в `loadLeaderboard`):

```js
  el('lbList').innerHTML = b.map(r=>`<li>${r.name}<span>${r.pts.toLocaleString('ru-RU')}</span></li>`).join('');
```

стало:

```js
  el('lbList').innerHTML = b.map(r=>`<li>${r.name}<span>${numFmt(r.pts)}</span></li>`).join('');
```

- [ ] **Step 5: Перевести study.js**

В `js/study.js` заменить тело `annotate()` целиком на:

```js
function annotate(a, mode){
  const resn=(a.resn||'').toUpperCase(), resi=a.resi, chain=a.chain||'?';
  const elem=(a.elem||'').toUpperCase();
  const NM = LEVEL ? levelName(LEVEL) : t('study.proteinFallback');
  if(elem==='ZN' || resn==='ZN') return t('study.zn', {name:NM});
  if(resn==='HOH' || resn==='WAT') return t('study.water');
  if(a.het) return t('study.het', {resn, chain,
    extra: (LEVEL && !LEVEL.open && levelDrug(LEVEL)) ? t('study.hetDrug') : ''});
  const n = CHAIN_STATS[chain] ? CHAIN_STATS[chain].res.size : '?';

  if(DNA_RESN.includes(resn)){
    if(mode==='chain') return t('study.dnaChain', {chain, n, name:NM});
    return t('study.dnaRes', {resn, resi, chain, name:NM});
  }

  if(mode==='chain') return t('study.chain', {chain, name:NM, n});
  const hs = LEVEL ? hotspotText(LEVEL.id, resi) : null;
  return t('study.resHead', {resn, resi, chain}) +
         (hs ? '\n★ ' + hs : '\n' + t('study.resPlain', {name:NM}));
}
```

В том же файле, было:

```js
function syncInfoBtn(){
  el('btnInfo').textContent = infoMode ? '🔎 ИЗУЧЕНИЕ: ВКЛ' : '🔎 ИЗУЧЕНИЕ';
```

стало:

```js
function syncInfoBtn(){
  el('btnInfo').textContent = infoMode ? t('btn.study.on') : t('btn.study');
```

было:

```js
  studyTargetLabel = viewer.addLabel('◎ ЦЕЛЬ стыковки — наведи, чтобы узнать', {
```

стало:

```js
  studyTargetLabel = viewer.addLabel(t(IS_TOUCH ? 'study.targetLabelTouch' : 'study.targetLabel'), {
```

было:

```js
  showToast(on ? '🔎 Наведи курсор на цель, белок, цинк или ДНК' : 'Режим изучения выключен');
```

стало:

```js
  showToast(on ? t(IS_TOUCH ? 'toast.studyOnTouch' : 'toast.studyOn') : t('toast.studyOff'));
```

было:

```js
  if(!LEVEL && !infoMode){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
```

стало:

```js
  if(!LEVEL && !infoMode){ showToast(t('toast.pickFirst')); return; }
```

- [ ] **Step 6: Перевести кнопку качества и тост лидеров**

В `js/perf.js`, было:

```js
function syncQualityBtn(){
  const b = el('btnQuality');
  if(!b) return;
  const name = QUALITY_PREF === 'auto' ? ('АВТО (' + (qLow() ? 'лёгкая' : 'красивая') + ')')
             : QUALITY_PREF === 'low'  ? 'ЛЁГКАЯ'
             : 'КРАСИВАЯ';
  b.textContent = '⚙ ГРАФИКА: ' + name;
}
```

стало:

```js
function syncQualityBtn(){
  const b = el('btnQuality');
  if(!b) return;
  const name = QUALITY_PREF === 'auto'
    ? t('quality.auto', {resolved: t(qLow() ? 'quality.lowWord' : 'quality.highWord')})
    : t(QUALITY_PREF === 'low' ? 'quality.low' : 'quality.high');
  b.textContent = t('btn.quality', {name});
}
```

В `js/mobile.js`, было:

```js
    showToast('Пока никто не отметился — сыграй и попади в таблицу!');
```

стало:

```js
    showToast(t('toast.boardEmpty'));
```

- [ ] **Step 7: Проверить**

Открыть `http://localhost:8000/index.html?selftest`: ожидается `31 passed, 0 failed` и **ни одного** `[i18n] нет ключа:` в консоли за всю сессию.

Открыть `http://localhost:8000/index.html`, переключить язык на `English`, пропустить обучение и проверить:

- метки в 3D: `◎ TARGET: POCKET (Zn)` и `🔹 YOUR DRUG` (метки пересоздаются при движении молекулы — подвигать стрелками, если старые ещё висят; полное обновление метки при смене языка — Task 17);
- шкала: отвести молекулу далеко → `FAR` + `🔑 steer the molecule toward the green pocket`; подвести → `CLOSING IN…`, `CLOSE`; вставить в карман → `IN THE POCKET` / `CLASHING` / `★ SNUG FIT!`;
- кнопки `💡 HINT`, `🔎 STUDY`, `⚙ GRAPHICS: AUTO (pretty)`; нажать `💡 HINT` — подпись становится `💡 HINT: ON` и появляется тост про мигающую молекулу по-английски;
- нажать `▶ TEST THE DRUG`: сначала подпись `⏳ COMPUTING…`, затем тост первого теста по-английски с `kcal/mol`, числа в английском формате (`1,234`); при рекорде `prompt` просит ник по-английски и таблица лидеров показывает `BEST: …`;
- включить `🔎 STUDY`: тост `🔎 Hover the target…`, метка `◎ DOCKING TARGET — hover to learn`, подсказки при наведении на ленту, воду, цинк, ДНК и отдельный остаток — все по-английски, а на остатке 248 звёздочка с текстом про Arg248;
- переключиться на `Русский` и повторить выборочно: `ДАЛЕКО`, `ккал/моль`, формат чисел `1 234`.

В эмуляции iPhone: тост режима изучения — `🔎 Нажми на цель…`, метка цели — «нажми, чтобы узнать».

- [ ] **Step 8: Коммит**

```bash
git add js/lang-en.js js/lang-ru.js js/hud.js js/scoring.js js/study.js js/scene.js js/perf.js js/mobile.js
git commit -m "feat(i18n): translate HUD, meter statuses, study tooltips and 3D labels"
```

---

### Task 16: Тексты обучения и справочных дек

Самая объёмная проза: шесть реплик обучения (две из них с тач-вариантами), модалка «мишень пройдена» и шесть карточек справки. Дека справки перестраивается на ключи: вместо массивов объектов с готовым текстом хранятся идентификаторы карточек.

**Files:**
- Modify: `js/lang-en.js`, `js/lang-ru.js`
- Modify: `js/coach.js` (`coachGoto`, `coachShapes`, `coachSuccess`)
- Modify: `js/tutorial.js` (перевод на ключи целиком)

**Interfaces:**
- Consumes: `t()`, `IS_TOUCH`, `levelName()`.
- Produces:
  - `ABOUT_KEYS`, `HOW_KEYS` — массивы идентификаторов карточек (заменяют `ABOUT_STEPS` / `HOW_STEPS`).
  - `tutCardKey(cardId, part) → string` — учитывает тач-варианты карточки `how.2`.

- [ ] **Step 1: Ключи обучения и модалки в оба словаря**

В `js/lang-en.js` добавить:

```js
  // ---- coach (in-scene tutorial, level 1) ----
  'coach.thisProtein':  'this protein',
  'coach.0':            'This is the cancer protein <b>{{name}}</b>. Inside a tumour cell it is "broken" and keeps the cell from ever stopping its division. Let\'s work out how to switch it off. <span class="hlc">Press "Next"</span>.',
  'coach.1':            'Here is <b>your drug</b> — a tiny key molecule (the blinking blue one). This is what you act with: you steer it in and slot it into the protein.',
  'coach.2':            'And this is the <b>pocket</b> — the protein\'s weak spot, its "switch" (the green marker). We turned the cell to face it. Your goal is to slot the key in exactly here.',
  'coach.3.mouse':      'Grab the drug with the mouse and <b>lead it along the glowing track</b> straight into the pocket. Don\'t worry about missing — for now the key holds the track by itself.',
  'coach.3.touch':      'Drag your <b>finger along the glowing track</b> — the drug follows it straight into the pocket. Don\'t worry about missing — for now the key holds the track by itself.',
  'coach.4.mouse':      'You are at the pocket! Now <b>rotate</b> the drug (<span class="hlc">right-click + mouse</span>) and bring it right up, so it lies like the <b>blinking reference</b>. Once it sits snugly, the "Test" button appears.',
  'coach.4.touch':      'You are at the pocket! Switch to <span class="hlc">🔄 ROTATE</span> below and <b>turn</b> the drug with your finger so it lies like the <b>blinking reference</b>. Once it sits snugly, the "Test" button appears.',
  'coach.5':            'The key is seated! Press the pulsing <b>"▶ TEST THE DRUG"</b> button — let\'s see how tightly it holds.',
  'coach.cursor.mouse': 'grab it and lead it to the pocket',
  'coach.cursor.touch': 'drag it to the pocket',

  // ---- level-cleared modal ----
  'done.body.next':     'You fitted a drug to <b>{{name}}</b> — binding energy {{aff}} {{unit}}.<br><br>Next up: <b>{{next}}</b>. From here you play <b>on your own</b>: no hints and no magnet — we only show the blinking drug in the pocket, as the goal to reach.',
  'done.body.last':     'You fitted a drug to <b>{{name}}</b> — binding energy {{aff}} {{unit}}.<br><br>That was the last target. Pick the next one from the target menu.',
  'done.go.next':       'Level {{n}} ▶',
  'done.go.levels':     '🗂 To the targets',

  // ---- "what it is" deck ----
  'about.1.title':      'What cancer is, in plain words',
  'about.1.body':       'Picture a <span class="hl">broken mechanism</span> inside a cell: it is jammed in the "on" position and forces the cell to divide without stopping. That is cancer.<br><br>The mechanism has a weak spot — a <span class="hlc">"pocket"</span>, its "switch". The game holds <b>several real cancer proteins</b> (levels) — from p53 to "impregnable" targets that still have no drug at all.',
  'about.2.title':      'You are holding the key',
  'about.2.body':       'Your little molecule is the <span class="hlc">key</span> (or the plug).<br><br>The task is like the children\'s toy where a shape has to go into the hole that matches it: <span class="hl">slot the key exactly into the pocket</span> and jam the "switch", so the cancer mechanism stops working.<br><br>The key has to be not only steered in but also <b>turned the right way round</b>. The more precisely it enters the pocket, the greener the meter — meaning it holds tighter.',
  'about.3.title':      'Why this matters for real',
  'about.3.body':       'This is not just a game. If you find the <span class="hl">shape and position of the key</span> where it sticks hardest, that data is genuinely useful to scientists.<br><br>Such a molecule can be synthesised in a lab and turned into a <span class="hlc">real cancer drug</span>. You are literally looking for something to plug a cancer protein with.',

  // ---- "how to play" deck ----
  'how.1.title':        'Your key and your target',
  'how.1.body':         'The blue molecule labelled <span class="hlc">"YOUR DRUG"</span> is a <b>candidate drug molecule</b> (a tiny substance used to treat disease). In the game it is your key, and you control it.<br><br>The <span class="hl">pulsing green marker with the "◎ TARGET" arrow</span> is the protein\'s pocket (its "switch"). Lead the key straight into it.<br><br>The pocket is <b>not random</b>: on every level it is the real weak spot of one specific cancer protein (p53\'s zinc site, say, or the pocket a real drug sits down in). Levels are chosen with the <span class="hlc">🗂 TARGETS</span> button.',
  'how.2.title.mouse':  'Steering the key — just the mouse',
  'how.2.title.touch':  'Steering the key — with your finger',
  'how.2.body.mouse':   '<b>Move:</b> <span class="hlc">grab the molecule with the mouse and drag</span> it across the screen. The wheel over it — <b>deeper/closer</b>.<br><b>Rotate:</b> <span class="hlc">right-click + drag</span> — and the molecule turns.<br><br>First <span class="hl">bring</span> the key up to the green marker, then <span class="hl">rotate</span> it until it sits flush (meter: red → yellow → <span class="hl">GREEN = SNUG FIT</span>, with a "ding").<br><br><span style="color:#9db8e0">Orbit the camera by dragging the <b>background</b>; pan with <kbd>Shift</kbd>+mouse. Keys work too: <kbd>W</kbd>/<kbd>S</kbd>, <kbd>Q E A D Z C</kbd>.</span>',
  'how.2.body.touch':   'There are three modes at the bottom: <span class="hlc">✋ MOVE</span>, <span class="hlc">🔄 ROTATE</span>, <span class="hlc">↕ DEPTH</span>. Drag your <b>finger across the molecule</b> and it does whatever is selected.<br><br>First <span class="hl">bring</span> the key up to the green marker in "MOVE", then switch to "ROTATE" and <span class="hl">turn</span> it until it sits flush (meter: red → yellow → <span class="hl">GREEN = SNUG FIT</span>, with a "ding").<br><br><span style="color:#9db8e0">A finger on the <b>background</b> spins the cell itself; two fingers zoom.</span>',
  'how.3.title':        'Test the key and win',
  'how.3.body':         'When the meter is <span class="hl">green</span>, press <span class="hlc">"▶ TEST THE DRUG"</span>. You get a <b>binding energy</b> (kcal/mol) — how tightly the key stuck.<br><br><span class="hl">The bigger the minus</span> (−9.5, say), the stronger the hold, the more points, the fireworks 🎆 and a place on the leaderboard!<br><br>The <span class="hlc">🔎 STUDY</span> button lets you point at things and find out what does what inside the protein.',
```

В `js/lang-ru.js` добавить те же ключи с текущими русскими текстами (реплика шага 5 теряет слово «справа» — на телефоне кнопка снизу):

```js
  // ---- обучение в сцене (уровень 1) ----
  'coach.thisProtein':  'этот белок',
  'coach.0':            'Перед тобой раковый белок <b>{{name}}</b>. В опухолевой клетке он «сломан» и не даёт ей остановить деление. Сейчас разберёмся, как его «выключить». <span class="hlc">Нажми «Далее»</span>.',
  'coach.1':            'Вот <b>твоё лекарство</b> — крошечная молекула-ключ (голубая, мигает). Именно им ты будешь действовать: подводить и вставлять в белок.',
  'coach.2':            'А это <b>карман</b> — уязвимое место белка, его «выключатель» (зелёная метка). Мы повернули клетку к нему. Цель — вставить ключ точно сюда.',
  'coach.3.mouse':      'Схвати лекарство мышью и <b>веди по светящейся дорожке</b> прямо в карман. Не бойся промахнуться — сейчас ключ сам держится трека.',
  'coach.3.touch':      'Проведи <b>пальцем по светящейся дорожке</b> — лекарство пойдёт за ним прямо в карман. Не бойся промахнуться — сейчас ключ сам держится трека.',
  'coach.4.mouse':      'Ты у кармана! Теперь <b>поверни</b> лекарство (<span class="hlc">правый клик + мышь</span>) и подведи вплотную, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».',
  'coach.4.touch':      'Ты у кармана! Переключись внизу на <span class="hlc">🔄 ВРАЩАТЬ</span> и <b>поверни</b> лекарство пальцем, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».',
  'coach.5':            'Отлично, ключ сел плотно! Жми пульсирующую кнопку <b>«▶ ТЕСТ ЛЕКАРСТВА»</b> — проверим, насколько крепко он держится.',
  'coach.cursor.mouse': 'схвати и веди в карман',
  'coach.cursor.touch': 'веди пальцем в карман',

  // ---- модалка «мишень пройдена» ----
  'done.body.next':     'Ты подобрал лекарство к <b>{{name}}</b> — энергия связывания {{aff}} {{unit}}.<br><br>Дальше — уровень <b>{{next}}</b>. Теперь ты играешь <b>сам</b>: без подсказок и «примагничивания» — покажем только моргающее лекарство в кармане (цель, куда нужно дойти).',
  'done.body.last':     'Ты подобрал лекарство к <b>{{name}}</b> — энергия связывания {{aff}} {{unit}}.<br><br>Это была последняя мишень. Выбери следующую в меню уровней.',
  'done.go.next':       'Уровень {{n}} ▶',
  'done.go.levels':     '🗂 К уровням',

  // ---- дека «о чём игра» ----
  'about.1.title':      'Что такое рак — простыми словами',
  'about.1.body':       'Представь <span class="hl">сломанный механизм</span> внутри клетки: он застрял в режиме «включено» и заставляет клетку делиться без остановки. Это и есть рак.<br><br>У механизма есть уязвимое место — <span class="hlc">«карман»</span>, его «выключатель». В игре тебя ждут <b>несколько реальных раковых белков</b> (уровней) — от p53 до «неприступных» мишеней, к которым лекарства ещё нет.',
  'about.2.title':      'Ты — с ключом в руках',
  'about.2.body':       'Твоя маленькая молекула — это <span class="hlc">ключ</span> (или затычка).<br><br>Задача — как в детской игрушке, где фигурку нужно вставить в подходящее по форме отверстие: <span class="hl">вставить ключ точно в карман</span> и заклинить «выключатель», чтобы механизм рака перестал работать.<br><br>Ключ нужно не только подвести, но и <b>повернуть правильной стороной</b>. Чем точнее он входит в карман, тем «зеленее» шкала — значит, держится крепче.',
  'about.3.title':      'Зачем это по-настоящему',
  'about.3.body':       'Это не просто игра. Если ты найдёшь <span class="hl">форму и положение ключа</span>, при которых он прилипает крепче всего, — эти данные реально полезны учёным.<br><br>Такую молекулу можно синтезировать в пробирке и сделать из неё <span class="hlc">настоящее лекарство от рака</span>. Ты буквально ищешь, чем «заткнуть» раковый белок.',

  // ---- дека «как играть» ----
  'how.1.title':        'Твой ключ и цель',
  'how.1.body':         'Голубая молекула с подписью <span class="hlc">«ТВОЁ ЛЕКАРСТВО»</span> — это <b>молекула-кандидат в лекарство</b> (крошечное вещество, которым лечат). В игре это твой ключ, им ты управляешь.<br><br><span class="hl">Зелёный пульсирующий маркер со стрелкой «◎ ЦЕЛЬ»</span> — это карман белка («выключатель»). Веди ключ прямо в него.<br><br>Карман <b>не случаен</b>: на каждом уровне это реальное уязвимое место конкретного ракового белка (например, цинковый сайт p53 или карман, куда садится настоящее лекарство). Уровни выбираются кнопкой <span class="hlc">🗂 УРОВНИ</span>.',
  'how.2.title.mouse':  'Управление ключом — просто мышью',
  'how.2.title.touch':  'Управление ключом — пальцем',
  'how.2.body.mouse':   '<b>Двигать:</b> <span class="hlc">схвати молекулу мышью и тащи</span> по экрану. Колесо над ней — <b>глубже/ближе</b>.<br><b>Вращать:</b> <span class="hlc">правый клик + тащи</span> — и молекула поворачивается.<br><br>Сначала <span class="hl">подведи</span> ключ к зелёной метке, потом <span class="hl">поворачивай</span>, пока он не ляжет плотно (шкала: красный → жёлтый → <span class="hl">ЗЕЛЁНЫЙ = ПЛОТНО СЕЛ</span>, звучит «дзинь»).<br><br><span style="color:#9db8e0">Камеру крути, таща <b>фон</b>; сдвигай <kbd>Shift</kbd>+мышь. Клавиши тоже работают: <kbd>W</kbd>/<kbd>S</kbd>, <kbd>Q E A D Z C</kbd>.</span>',
  'how.2.body.touch':   'Внизу три режима: <span class="hlc">✋ ДВИГАТЬ</span>, <span class="hlc">🔄 ВРАЩАТЬ</span>, <span class="hlc">↕ ГЛУБИНА</span>. Проведи <b>пальцем по молекуле</b> — она сделает то, что выбрано.<br><br>Сначала <span class="hl">подведи</span> ключ к зелёной метке в режиме «ДВИГАТЬ», потом переключись на «ВРАЩАТЬ» и <span class="hl">поворачивай</span>, пока он не ляжет плотно (шкала: красный → жёлтый → <span class="hl">ЗЕЛЁНЫЙ = ПЛОТНО СЕЛ</span>, звучит «дзинь»).<br><br><span style="color:#9db8e0">Палец по <b>фону</b> крутит саму клетку, два пальца — зум.</span>',
  'how.3.title':        'Проверь ключ и побеждай',
  'how.3.body':         'Когда шкала <span class="hl">зелёная</span>, жми <span class="hlc">«▶ ТЕСТ ЛЕКАРСТВА»</span>. Получишь <b>энергию связывания</b> (ккал/моль) — насколько крепко ключ прилип.<br><br><span class="hl">Чем больше минус</span> (например −9.5), тем сильнее держится и тем больше очков, салют 🎆 и место в таблице лидеров!<br><br>Кнопка <span class="hlc">🔎 ИЗУЧЕНИЕ</span> даёт навести курсор и узнать, что за что отвечает в белке.',
```

- [ ] **Step 2: Перевести coach.js**

В `js/coach.js`, функция `coachGoto`, было:

```js
  const NM = LEVEL ? LEVEL.name : 'этот белок';
```

стало:

```js
  const NM = LEVEL ? levelName(LEVEL) : t('coach.thisProtein');
```

Далее заменить шесть вызовов `coachBubble`. Было (шаг 0):

```js
      coachBubble('🧬',
        `Перед тобой раковый белок <b>${NM}</b>. В опухолевой клетке он «сломан» и не даёт ей ` +
        `остановить деление. Сейчас разберёмся, как его «выключить». <span class="hlc">Нажми «Далее»</span>.`, true);
```

стало:

```js
      coachBubble('🧬', t('coach.0', {name:NM}), true);
```

было (шаг 1):

```js
      coachBubble('🔑',
        `Вот <b>твоё лекарство</b> — крошечная молекула-ключ (голубая, мигает). Именно им ты ` +
        `будешь действовать: подводить и вставлять в белок.`, true);
```

стало:

```js
      coachBubble('🔑', t('coach.1'), true);
```

было (шаг 2):

```js
      coachBubble('🎯',
        `А это <b>карман</b> — уязвимое место белка, его «выключатель» (зелёная метка). ` +
        `Мы повернули клетку к нему. Цель — вставить ключ точно сюда.`, true);
```

стало:

```js
      coachBubble('🎯', t('coach.2'), true);
```

было (шаг 3, вариант из Task 12):

```js
      coachBubble(IS_TOUCH ? '👆' : '🖱', IS_TOUCH
        ? `Проведи <b>пальцем по светящейся дорожке</b> — лекарство пойдёт за ним прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`
        : `Схвати лекарство мышью и <b>веди по светящейся дорожке</b> прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`, false);
```

стало:

```js
      coachBubble(IS_TOUCH ? '👆' : '🖱', t(IS_TOUCH ? 'coach.3.touch' : 'coach.3.mouse'), false);
```

было (шаг 4, вариант из Task 12):

```js
      coachBubble('🔄', IS_TOUCH
        ? `Ты у кармана! Переключись внизу на <span class="hlc">🔄 ВРАЩАТЬ</span> и <b>поверни</b> лекарство ` +
          `пальцем, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`
        : `Ты у кармана! Теперь <b>поверни</b> лекарство (<span class="hlc">правый клик + мышь</span>) ` +
          `и подведи вплотную, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`, false);
```

стало:

```js
      coachBubble('🔄', t(IS_TOUCH ? 'coach.4.touch' : 'coach.4.mouse'), false);
```

было (шаг 5):

```js
      coachBubble('✅',
        `Отлично, ключ сел плотно! Жми пульсирующую кнопку <b>«▶ ТЕСТ ЛЕКАРСТВА»</b> справа — ` +
        `проверим, насколько крепко он держится.`, false);
```

стало:

```js
      coachBubble('✅', t('coach.5'), false);
```

В `coachShapes`, было:

```js
    cur.querySelector('.cc-tip').textContent = IS_TOUCH ? 'веди пальцем в карман' : 'схвати и веди в карман';
```

стало:

```js
    cur.querySelector('.cc-tip').textContent = t(IS_TOUCH ? 'coach.cursor.touch' : 'coach.cursor.mouse');
```

В `coachSuccess`, было:

```js
  el('coachDoneTitle').textContent = 'МИШЕНЬ ПРОЙДЕНА!';
  if(nxt){
    el('coachDoneBody').innerHTML =
      `Ты подобрал лекарство к <b>${done.name}</b> — энергия связывания ${affinity.toFixed(1)} ккал/моль.<br><br>` +
      `Дальше — уровень <b>${nxt.name}</b>. Теперь ты играешь <b>сам</b>: без подсказок и ` +
      `«примагничивания» — покажем только моргающее лекарство в кармане (цель, куда нужно дойти).`;
    el('coachDoneGo').textContent = 'Уровень ' + (LEVEL_IDX+2) + ' ▶';
  } else {
    el('coachDoneBody').innerHTML =
      `Ты подобрал лекарство к <b>${done.name}</b> — энергия связывания ${affinity.toFixed(1)} ккал/моль.<br><br>` +
      `Это была последняя мишень. Выбери следующую в меню уровней.`;
    el('coachDoneGo').textContent = '🗂 К уровням';
  }
```

стало:

```js
  el('coachDoneTitle').textContent = t('done.title');
  const common = {name: levelName(done), aff: affinity.toFixed(1), unit: t('unit.kcal')};
  if(nxt){
    el('coachDoneBody').innerHTML = t('done.body.next',
      Object.assign({next: levelName(nxt)}, common));
    el('coachDoneGo').textContent = t('done.go.next', {n: LEVEL_IDX+2});
  } else {
    el('coachDoneBody').innerHTML = t('done.body.last', common);
    el('coachDoneGo').textContent = t('done.go.levels');
  }
```

И тост в `btnCoach`, было:

```js
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
```

стало:

```js
  if(!pocket){ showToast(t('toast.pickFirst')); return; }
```

- [ ] **Step 3: Перестроить tutorial.js на ключи**

Полностью заменить содержимое `js/tutorial.js` на:

```js
/* ============================================================
   СТАТИЧЕСКАЯ СПРАВКА («ОБ ИГРЕ») — деки, открываемые по кнопке.
   ----------------------------------------------------------
   Две деки: ABOUT_KEYS объясняет ЧТО/ЗАЧЕМ (метафора «замок и
   ключ» + настоящий смысл), HOW_KEYS объясняет управление. Обе
   живут за ОДНОЙ кнопкой (❓ ОБ ИГРЕ) как две вкладки модалки.
   Практическое онбординг для новичка — динамическое обучение
   (js/coach.js), которое идёт прямо в сцене на уровне 1; эта
   модалка — справочник, который можно открыть в любой момент.

   Здесь хранятся только идентификаторы карточек: сам текст лежит
   в словарях под <id>.title / <id>.body (см. js/lang-*.js).
   Карточка how.2 (управление) существует в двух вариантах —
   мышь и палец, — потому что инструкция обязана быть конкретной.
   ============================================================ */
const ABOUT_KEYS = ['about.1', 'about.2', 'about.3'];
const HOW_KEYS   = ['how.1',   'how.2',   'how.3'];
// иконки одинаковы в обоих языках, поэтому в словарях им не место
const TUT_ICONS = {'about.1':'🔒','about.2':'🔑','about.3':'🔬',
                   'how.1':'🔹','how.2':'🎮','how.3':'🏆'};

// ключ текста карточки: у how.2 он зависит от того, мышь или палец
function tutCardKey(cardId, part){
  if(cardId === 'how.2') return cardId + '.' + part + (IS_TOUCH ? '.touch' : '.mouse');
  return cardId + '.' + part;
}

let curKeys = [], tstep = 0;
function renderTut(){
  const id = curKeys[tstep];
  if(!id) return;
  el('tutIcon').textContent = TUT_ICONS[id] || '🧬';
  el('tutTitle').textContent = t(tutCardKey(id, 'title'));
  el('tutBody').innerHTML = t(tutCardKey(id, 'body'));
  el('tutDots').innerHTML = curKeys.map((_,i)=>`<div class="dot ${i===tstep?'on':''}"></div>`).join('');
  el('tutPrev').style.visibility = tstep===0 ? 'hidden':'visible';
  el('tutPrev').textContent = t('tut.prev');
  el('tutNext').textContent = tstep===curKeys.length-1 ? t('tut.done') : t('tut.next');
}
// which tab is active mirrors which deck is showing
function setTutTab(keys){
  el('tutTabAbout').classList.toggle('on', keys===ABOUT_KEYS);
  el('tutTabHow').classList.toggle('on', keys===HOW_KEYS);
}
function openTut(keys){ curKeys=keys; tstep=0; renderTut(); setTutTab(keys); el('tut').classList.add('show'); }
function closeTut(){ el('tut').classList.remove('show'); }
el('tutNext').onclick = ()=>{ tstep<curKeys.length-1 ? (tstep++, renderTut()) : closeTut(); };
el('tutPrev').onclick = ()=>{ if(tstep>0){tstep--; renderTut();} };
el('tutSkip').onclick = closeTut;
// tabs switch the deck in place; the single "❓ ОБ ИГРЕ" button opens on the "About" tab
el('tutTabAbout').onclick = ()=> openTut(ABOUT_KEYS);
el('tutTabHow').onclick   = ()=> openTut(HOW_KEYS);
el('btnGuide').onclick    = ()=> openTut(ABOUT_KEYS);
```

- [ ] **Step 4: Проверить**

Открыть `http://localhost:8000/index.html?selftest`: ожидается `31 passed, 0 failed` и ни одного `[i18n] нет ключа:`.

Открыть `http://localhost:8000/index.html`, переключить язык на `English`, затем `localStorage.removeItem('pd_levels'); localStorage.removeItem('pd_last_level'); location.reload()` — начать с чистого прогресса, чтобы обучение пошло само.

Пройти обучение целиком на английском: шесть реплик по-английски, на шаге 3 подпись мигающего курсора `grab it and lead it to the pocket`, после успеха модалка `TARGET CLEARED!` с текстом про энергию связывания и кнопкой `Level 2 ▶`.

Открыть `❓ ABOUT`: три карточки на вкладке `WHAT IT IS` (иконки 🔒 🔑 🔬, кнопки `◀ Back` / `Next ▶`, на последней `Done ✓`), три карточки на вкладке `HOW TO PLAY`; на десктопе вторая карточка называется `Steering the key — just the mouse`.

Переключить язык на `Русский`, повторить: обучение и деки по-русски, `МИШЕНЬ ПРОЙДЕНА!`, `Уровень 2 ▶`.

В эмуляции iPhone 12 Pro: вторая карточка `КАК ИГРАТЬ` называется «Управление ключом — пальцем» и описывает три режима; обучение на шаге 3 говорит «Проведи пальцем…», подпись курсора «веди пальцем в карман».

- [ ] **Step 5: Коммит**

```bash
git add js/lang-en.js js/lang-ru.js js/coach.js js/tutorial.js
git commit -m "feat(i18n): translate the in-scene coach and the reference decks

tutorial.js now stores card ids only; the text lives in the dictionaries, and
the controls card exists in mouse and touch variants."
```

---

### Task 17: Полное переключение на живую, проверка словарей, документация

Последний штрих: `refreshDynamicText()` из Task 13 сейчас пустая, поэтому смена языка не обновляет заголовок уровня, 3D-метки, счёт, открытые модалки и реплику обучения. Плюс автоматическая проверка, что словари не разъехались, и обновление документации.

**Files:**
- Modify: `js/i18n.js` (`refreshDynamicText`)
- Modify: `js/coach.js` (таблица реплик + `coachRefreshBubble`)
- Modify: `js/selftest.js` (сверка словарей и ключей разметки)
- Modify: `CLAUDE.md`, `README.md`

**Interfaces:**
- Consumes: всё, что было объявлено ранее.
- Produces:
  - `coachRefreshBubble() → void`
  - `i18nKeyParity() → {missingRu: string[], missingEn: string[]}`
  - `i18nMarkupKeys() → string[]`

- [ ] **Step 1: Написать падающие проверки**

В `js/selftest.js`, в конец `runSelfTest()`, добавить:

```js
  // ---- i18n: словари не разъехались ----
  const par = i18nKeyParity();
  stEq('i18n: ключи, которых нет в RU', par.missingRu, []);
  stEq('i18n: ключи, которых нет в EN', par.missingEn, []);

  // ---- i18n: каждый ключ из разметки существует ----
  stEq('i18n: ключи разметки без перевода',
       i18nMarkupKeys().filter(k => !(k in I18N_EN) || !(k in I18N_RU)), []);

  // ---- i18n: у каждого уровня полный набор текстов ----
  const parts = ['name','sub','drug','pocketLabel','blurb'];
  const gaps = [];
  LEVELS.forEach(L => parts.forEach(p => {
    const k = 'levels.' + L.id + '.' + p;
    if(!(k in I18N_EN) || !(k in I18N_RU)) gaps.push(k);
  }));
  stEq('i18n: уровни без текстов', gaps, []);

  // ---- i18n: подсказки p53 переведены полностью ----
  const hotGaps = P53_HOTSPOT_RESI.filter(r =>
    !('hotspot.p53.' + r in I18N_EN) || !('hotspot.p53.' + r in I18N_RU));
  stEq('i18n: горячие точки p53 без перевода', hotGaps, []);
```

- [ ] **Step 2: Запустить и убедиться, что проверки падают**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `Uncaught ReferenceError: i18nKeyParity is not defined`, итоговая строка не печатается.

- [ ] **Step 3: Реализовать сверку словарей**

В `js/i18n.js`, в конец файла, добавить:

```js
/* ---------- сверка словарей (используется ?selftest) ----------
   Плоские словари легко разъезжаются, когда строку добавили в один
   и забыли во втором. t() и так предупреждает в консоли, но эта
   проверка ловит расхождение до того, как игрок его увидит. */
function i18nKeyParity(){
  return {
    missingRu: Object.keys(I18N_EN).filter(k => !(k in I18N_RU)).sort(),
    missingEn: Object.keys(I18N_RU).filter(k => !(k in I18N_EN)).sort(),
  };
}
// все ключи, на которые ссылается разметка index.html
function i18nMarkupKeys(){
  const out = [];
  document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-title]').forEach(n=>{
    ['i18n','i18nHtml','i18nTitle'].forEach(a=>{ if(n.dataset[a]) out.push(n.dataset[a]); });
  });
  return out;
}
```

- [ ] **Step 4: Таблица реплик обучения**

Чтобы смена языка могла перерисовать текущую реплику, не перезапуская полёт камеры и не пересобирая магнитную дорожку, шесть реплик из Task 16 переносятся в таблицу.

В `js/coach.js`, перед `function coachGoto(n){`, добавить:

```js
/* Реплики по шагам — таблицей, чтобы одну и ту же реплику можно было
   перерисовать при смене языка (coachRefreshBubble) без повторного
   полёта камеры и без пересборки магнитной дорожки. */
const COACH_BUBBLES = [
  ()=>['🧬', t('coach.0', {name: LEVEL ? levelName(LEVEL) : t('coach.thisProtein')}), true],
  ()=>['🔑', t('coach.1'), true],
  ()=>['🎯', t('coach.2'), true],
  ()=>[IS_TOUCH ? '👆' : '🖱', t(IS_TOUCH ? 'coach.3.touch' : 'coach.3.mouse'), false],
  ()=>['🔄', t(IS_TOUCH ? 'coach.4.touch' : 'coach.4.mouse'), false],
  ()=>['✅', t('coach.5'), false],
];
function coachRefreshBubble(){
  const make = COACH_BUBBLES[coachStep];
  if(!coachActive || !make) return;
  const b = make();
  coachBubble(b[0], b[1], b[2]);
}
```

Затем в `coachGoto` удалить шесть вызовов `coachBubble(...)` из ветвей `switch` (те, что были поставлены в Task 16) и добавить один общий вызов после `switch`. Было:

```js
    case 5:   // ---- press TEST ----
      coachBlinkDrug = false; coachMagnet = false; coachTrack = null;
      el('btnDock').classList.add('pulse');
      coachBubble('✅', t('coach.5'), false);
      // pre-render the next target's 3D preview so the success modal can show it instantly
      { const nxt = LEVELS[LEVEL_IDX+1]; if(nxt) renderLevelPreview(nxt.pdb); }
      break;
  }
}
```

стало (аналогично убрать `coachBubble(...)` из ветвей 0–4):

```js
    case 5:   // ---- press TEST ----
      coachBlinkDrug = false; coachMagnet = false; coachTrack = null;
      el('btnDock').classList.add('pulse');
      // pre-render the next target's 3D preview so the success modal can show it instantly
      { const nxt = LEVELS[LEVEL_IDX+1]; if(nxt) renderLevelPreview(nxt.pdb); }
      break;
  }
  coachRefreshBubble();   // текст реплики — из таблицы COACH_BUBBLES
}
```

- [ ] **Step 5: Наполнить refreshDynamicText**

В `js/i18n.js` заменить заглушку. Было:

```js
/* наполняется в Task 16: перерисовка всего динамического текста
   (заголовки, 3D-метки, открытые модалки, таблица лидеров) */
function refreshDynamicText(){}
```

стало:

```js
/* Перерисовать весь текст, который НЕ покрыт data-i18n: подписи
   кнопок-переключателей, заголовок уровня, метки в 3D, счёт,
   таблицу лидеров, открытые модалки и текущую реплику обучения.
   Уровень при этом НЕ перезагружается — структура PDB и поза
   молекулы остаются на месте. */
function refreshDynamicText(){
  // подписи кнопок, зависящие от состояния
  syncSolveBtn();
  syncInfoBtn();
  syncQualityBtn();
  syncModeBar();
  syncScore();
  el('btnSound').title = t(soundOn ? 'btn.sound.on' : 'btn.sound.off');

  // заголовок уровня, строка задачи, метка кармана
  if(LEVEL){
    syncLevelText();
    POCKET_LABEL = levelPocketLabel(LEVEL);
  }

  // таблица лидеров (числа формата и подпись «РЕКОРД»)
  loadLeaderboard();

  // открытые модалки перерисовываются на месте
  if(el('levels').classList.contains('show')) renderLevels();
  if(el('tut').classList.contains('show'))    renderTut();
  coachRefreshBubble();

  // метки в 3D кэшируются (см. syncLabels в scene.js), поэтому их надо
  // снести и дать draw() создать их заново уже на новом языке
  if(viewer && !infoMode){
    try{ viewer.removeAllLabels(); }catch(e){}
    resetLabels();
    resetDrawState();
  }
  // в режиме изучения метка цели своя, её пересоздаёт study.js
  if(viewer && infoMode){
    removeStudyTarget();
    addStudyTarget();
  }
}
```

- [ ] **Step 6: Запустить проверки и проверить переключение**

Открыть `http://localhost:8000/index.html?selftest`.

Ожидается: `--- selftest: 36 passed, 0 failed ---` (31 + 5) и ни одного `[i18n] нет ключа:`.

Затем целевая проверка переключения «на живую». Открыть `http://localhost:8000/index.html`, дождаться уровня 1, пропустить обучение, загрузить уровень 2 (`🗂 УРОВНИ` → BCR-ABL), подвести молекулу к карману стрелками так, чтобы шкала была не «ДАЛЕКО», и **не перезагружая страницу** переключить язык через 🌐:

- заголовок в хедере, строка задачи, заголовок вкладки браузера — на новом языке;
- метка `◎ ЦЕЛЬ: КАРМАН (сайт иматиниба)` стала `◎ TARGET: POCKET (imatinib site)`, а `🔹 ТВОЁ ЛЕКАРСТВО` — `🔹 YOUR DRUG`, **без перезагрузки структуры** (белок не мигнул, поза молекулы не сбросилась);
- статус и подсказка шкалы — на новом языке;
- подписи `💡`, `🔎`, `⚙`, счёт и рекорд, таблица лидеров;
- открыть модалку уровней, **не закрывая её** переключить язык — содержимое перерисовалось на месте;
- то же с `❓ ОБ ИГРЕ`: открыть вторую карточку, переключить язык — та же карточка на новом языке, номер точки не сбросился;
- запустить `🎓 ОБУЧЕНИЕ`, дойти до шага 3 (магнитная дорожка), переключить язык — реплика на новом языке, **камера не улетела**, дорожка на месте, молекула не прыгнула; довести до конца и убедиться, что переход на шаг 4 и далее работает;
- включить `🔎 ИЗУЧЕНИЕ`, переключить язык — метка цели на новом языке, подсказки при наведении тоже.

- [ ] **Step 7: Обновить CLAUDE.md**

В `CLAUDE.md`, было:

```
functional pocket of a real cancer-target protein (loaded live from the PDB) rendered in 3D via
[3Dmol.js](https://3Dmol.org). It measures the fit, scores it, and celebrates. The UI is in
**Russian**; keep new user-facing strings in Russian to match. Deployed as a static site to
GitHub Pages.
```

стало:

```
functional pocket of a real cancer-target protein (loaded live from the PDB) rendered in 3D via
[3Dmol.js](https://3Dmol.org). It measures the fit, scores it, and celebrates. The UI is
**bilingual (English / Russian)**: every user-facing string lives in `js/lang-en.js` and
`js/lang-ru.js` — add new ones to **both**, never as a literal in a module. Plays on desktop
and on phones. Deployed as a static site to GitHub Pages.
```

было:

```
There is **no build step, no bundler, no test suite, no linter, and no package.json.** The frontend
is plain static files.
```

стало:

```
There is **no build step, no bundler, no linter, and no package.json.** The frontend is plain
static files. There is no test runner either — instead `js/selftest.js` checks the pure functions
(quality profile, language detection, `t()` substitution, segment projection, dictionary parity)
when the page is opened with `?selftest` in the URL: `index.html?selftest`, results in the console.
Run it after any change to those areas.
```

В разделе `### Module responsibilities` добавить после строки про `scene.js` описания новых модулей и поправить описание `levels-data.js`. Было:

```
- `levels-data.js` — the `LEVELS` array (the real PDB targets + per-level pocket strategy).
```

стало:

```
- `levels-data.js` — the `LEVELS` array: **structure only** (id, `pdb`, `open`, pocket strategy).
  All level text lives in the dictionaries under `levels.<id>.*` and `hotspot.<id>.<resi>`.
- `perf.js` — the graphics quality profile (`QUALITY` = `low` on touch devices, `high` otherwise;
  `pd_quality` overrides it). Owns the `devicePixelRatio` cap, `viewerOptions()` and the
  ⚙ ГРАФИКА button. Must load early: the DPR cap has to be in place before `createViewer`.
- `i18n.js` + `lang-en.js` / `lang-ru.js` — the translation runtime (`t()`, `numFmt()`,
  `applyI18n()`, `setLang()`, `refreshDynamicText()`) and the two flat dictionaries.
- `mobile.js` — the mobile UI shell: bottom sheet (☰), leaderboard modal, ligand mode switcher.
- `selftest.js` — the `?selftest` harness.
```

В том же разделе, было:

```
- `controls.js` — keyboard nudges + direct mouse manipulation of the ligand (grab/rotate/depth)
  and cursor-anchored wheel zoom. Movement is **camera-relative** via `camBasis()`.
```

стало:

```
- `controls.js` — keyboard nudges, direct **mouse and touch** manipulation of the ligand
  (grab/rotate/depth) and cursor-anchored wheel zoom. Both input paths go through the same
  `ligMove` / `ligRotate` / `ligDepth`, so mouse and finger behave identically. Movement is
  **camera-relative** via `camBasis()`. On touch, one finger on the molecule drives the mode
  selected in `#modeBar`, one finger on the background orbits the camera (3Dmol's own handling),
  two fingers zoom.
```

В разделе `### Two conventions worth knowing` переименовать заголовок в `### Conventions worth knowing` и добавить третий пункт:

```
- **Dirty-render:** `draw()` runs its cheap half every tick (distance, energy, meter, sound, coach
  auto-advance) but rebuilds the ~20 ligand/target shapes and calls `viewer.render()` only when the
  frame actually changed — see `drawKey()`/`pocketAnimates()` in `scene.js`. Call
  `resetDrawState()` whenever the scene is rebuilt from outside (new level, language switch,
  leaving study mode), or the next frame will be considered unchanged and skipped.
- **`camInteracting` must be set from every input path.** It is what stops the gameplay loop from
  fighting 3Dmol's own render while the camera moves. It was missing on touch, and that alone was
  the mobile stutter.
```

В разделе `### Persistence (localStorage)`, было:

```
All progress is client-side: `pd_last_level` (auto-resume), `pd_levels` (per-level attempted/solved/
best energy), `pd_board` (leaderboard), `pd_score_seen` (first-test explainer flag).
```

стало:

```
All progress is client-side: `pd_last_level` (auto-resume), `pd_levels` (per-level attempted/solved/
best energy), `pd_board` (leaderboard), `pd_score_seen` (first-test explainer flag),
`pd_lang` (`en`/`ru`; absent → browser language, everything but a `ru` prefix falls back to `en`),
`pd_quality` (`auto`/`low`/`high`; changing it reloads the page, because the DPR cap and
`cartoonQuality` only apply at viewer creation).
```

И в разделе про загрузку модулей, было:

```
- `js/state.js` loads **first** — it defines the DOM helper `el()` and all cross-cutting mutable
  globals (`viewer`, `lig`, `pocket`, `LEVEL`, `score`, the `coach*` flags, etc.).
```

стало:

```
- `js/state.js` loads **first** — it defines the DOM helper `el()` and all cross-cutting mutable
  globals (`viewer`, `lig`, `pocket`, `LEVEL`, `score`, `touchMode`, the `coach*` flags, etc.).
  `perf.js`, the two dictionaries and `i18n.js` follow immediately, because every later module
  calls `t()` at load time. Full order:
  `state → perf → lang-en → lang-ru → i18n → levels-data → geometry → scoring → scene →
  controls → study → hud → tutorial → levels → coach → mobile → selftest → main`.
```

- [ ] **Step 8: Обновить README.md**

Прочитать `README.md` и внести три правки, сохранив его стиль и структуру:

1. В описании игры добавить, что интерфейс двуязычный (English / Русский, кнопка 🌐 в шапке, при первом заходе выбирается по языку браузера с откатом на английский).
2. Добавить, что игра работает на телефоне: один палец по молекуле выполняет выбранный внизу режим (ДВИГАТЬ / ВРАЩАТЬ / ГЛУБИНА), один палец по фону вращает структуру, два пальца — зум; остальные кнопки под ☰.
3. В разделе про запуск добавить строку про `index.html?selftest` — самопроверку чистых функций и словарей, и про кнопку «⚙ ГРАФИКА» (авто / лёгкая / красивая), которая на слабом устройстве снижает нагрузку.

- [ ] **Step 9: Финальная проверка целиком**

Прогнать на десктопе и в эмуляции iPhone 12 Pro, на **обоих** языках:

- `index.html?selftest` → `36 passed, 0 failed`;
- за всю сессию в консоли нет ни одного `[i18n] нет ключа:` и ни одной ошибки;
- очистить хранилище (`localStorage.clear(); location.reload()`) → игра стартует на уровне 1, обучение запускается само, проходится до конца;
- пройти по всем шести уровням через `🗂 УРОВНИ` (учитывая, что часть заблокирована прогрессом): структура грузится, карман находится, метки корректны;
- `🔎 ИЗУЧЕНИЕ`, `💡 ПОДСКАЗКА`, `↺ СБРОС`, `❓ ОБ ИГРЕ`, `🏆 ЛИДЕРЫ`, `⚙ ГРАФИКА` работают;
- `⚙ ГРАФИКА` переключает три состояния, страница перезагружается, выбор сохраняется между перезагрузками;
- горизонтальной прокрутки нет ни в портрете, ни в ландшафте.

- [ ] **Step 10: Коммит**

```bash
git add js/i18n.js js/coach.js js/selftest.js CLAUDE.md README.md
git commit -m "feat(i18n): live language switching + dictionary parity checks, update docs

Switching language re-renders headings, 3D labels, score, leaderboard, open
modals and the current coach line without reloading the page or the structure.
?selftest now also verifies that the two dictionaries and the markup keys agree."
```

---

**Контрольная точка Фазы 3.** Проверить на реальном телефоне на обоих языках: игра проходится пальцем от начала до конца, текст нигде не обрезан и не вылезает за экран, переключение языка не ломает позу молекулы и не перезагружает структуру.

---

## Итоговая проверка перед завершением работы

Прежде чем объявлять работу законченной, выполнить и **привести вывод**:

1. `index.html?selftest` в консоли → `--- selftest: 36 passed, 0 failed ---`.
2. Замер холостых рендеров из Task 4 Step 7 → `0` за 5 секунд покоя на низком профиле.
3. Замер из Task 3 Step 4 → `draw() за время вращения: 0`.
4. `git log --oneline main..HEAD` → 14 коммитов (по одному на задачу, Task 1–17 минус объединённые шаги).
5. Подтверждение от пользователя, что на **реальном** телефоне вращение плавное. Без этого пункт «лаги исправлены» не считается проверенным — эмулятор не воспроизводит fill-rate мобильного GPU.

Если какой-то пункт не выполнен, сказать об этом прямо и не выдавать работу за завершённую.
