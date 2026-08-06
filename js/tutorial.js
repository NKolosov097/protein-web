/* ============================================================
   STATIC HELP ("ОБ ИГРЕ") — reference decks, opened on demand.
   ----------------------------------------------------------
   Two decks: ABOUT_STEPS explains WHAT/WHY (the lock-and-key metaphor
   + the real point), HOW_STEPS explains the controls. They now live
   behind ONE button (❓ ОБ ИГРЕ) as two tabs inside the modal. The
   hands-on onboarding for a first-time player is the dynamic coach
   (js/coach.js) that runs in-scene on level 1 — this modal is just the
   reference you can reopen any time.
   ============================================================ */
const ABOUT_STEPS = [
  { icon:'🔒', title:'Что такое рак — простыми словами',
    body:`Представь <span class="hl">сломанный механизм</span> внутри клетки: он застрял в режиме «включено» и заставляет клетку делиться без остановки. Это и есть рак.<br><br>
          У механизма есть уязвимое место — <span class="hlc">«карман»</span>, его «выключатель». В игре тебя ждут <b>несколько реальных раковых белков</b> (уровней) — от p53 до «неприступных» мишеней, к которым лекарства ещё нет.` },
  { icon:'🔑', title:'Ты — с ключом в руках',
    body:`Твоя маленькая молекула — это <span class="hlc">ключ</span> (или затычка).<br><br>
          Задача — как в детской игрушке, где фигурку нужно вставить в подходящее по форме отверстие: <span class="hl">вставить ключ точно в карман</span> и заклинить «выключатель», чтобы механизм рака перестал работать.<br><br>
          Ключ нужно не только подвести, но и <b>повернуть правильной стороной</b>. Чем точнее он входит в карман, тем «зеленее» шкала — значит, держится крепче.` },
  { icon:'🔬', title:'Зачем это по-настоящему',
    body:`Это не просто игра. Если ты найдёшь <span class="hl">форму и положение ключа</span>, при которых он прилипает крепче всего, — эти данные реально полезны учёным.<br><br>
          Такую молекулу можно синтезировать в пробирке и сделать из неё <span class="hlc">настоящее лекарство от рака</span>. Ты буквально ищешь, чем «заткнуть» раковый белок.` },
];
const HOW_STEPS = [
  { icon:'🔹', title:'Твой ключ и цель',
    body:`Голубая молекула с подписью <span class="hlc">«ТВОЁ ЛЕКАРСТВО»</span> — это <b>молекула-кандидат в лекарство</b> (крошечное вещество, которым лечат). В игре это твой ключ, им ты управляешь.<br><br>
          <span class="hl">Зелёный пульсирующий маркер со стрелкой «◎ ЦЕЛЬ»</span> — это карман белка («выключатель»). Веди ключ прямо в него.<br><br>
          Карман <b>не случаен</b>: на каждом уровне это реальное уязвимое место конкретного ракового белка (например, цинковый сайт p53 или карман, куда садится настоящее лекарство). Уровни выбираются кнопкой <span class="hlc">🗂 УРОВНИ</span>.` },
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
  { icon:'🏆', title:'Проверь ключ и побеждай',
    body:`Когда шкала <span class="hl">зелёная</span>, жми <span class="hlc">«▶ ТЕСТ ЛЕКАРСТВА»</span>. Получишь <b>энергию связывания</b> (ккал/моль) — насколько крепко ключ прилип.<br><br>
          <span class="hl">Чем больше минус</span> (например −9.5), тем сильнее держится и тем больше очков, салют 🎆 и место в таблице лидеров!<br><br>
          Кнопка <span class="hlc">🔎 ИЗУЧЕНИЕ</span> даёт навести курсор и узнать, что за что отвечает в белке.` },
];
let curSteps = [], tstep = 0;
function renderTut(){
  const s = curSteps[tstep];
  el('tutIcon').textContent = s.icon;
  el('tutTitle').textContent = s.title;
  el('tutBody').innerHTML = s.body;
  el('tutDots').innerHTML = curSteps.map((_,i)=>`<div class="dot ${i===tstep?'on':''}"></div>`).join('');
  el('tutPrev').style.visibility = tstep===0 ? 'hidden':'visible';
  el('tutNext').textContent = tstep===curSteps.length-1 ? 'Готово ✓' : 'Далее ▶';
}
// which tab is active mirrors which deck is showing
function setTutTab(steps){
  el('tutTabAbout').classList.toggle('on', steps===ABOUT_STEPS);
  el('tutTabHow').classList.toggle('on', steps===HOW_STEPS);
}
function openTut(steps){ curSteps=steps; tstep=0; renderTut(); setTutTab(steps); el('tut').classList.add('show'); }
function closeTut(){ el('tut').classList.remove('show'); }
el('tutNext').onclick = ()=>{ tstep<curSteps.length-1 ? (tstep++, renderTut()) : closeTut(); };
el('tutPrev').onclick = ()=>{ if(tstep>0){tstep--; renderTut();} };
el('tutSkip').onclick = closeTut;
// tabs switch the deck in place; the single "❓ ОБ ИГРЕ" button opens on the "About" tab
el('tutTabAbout').onclick = ()=> openTut(ABOUT_STEPS);
el('tutTabHow').onclick   = ()=> openTut(HOW_STEPS);
el('btnGuide').onclick    = ()=> openTut(ABOUT_STEPS);
