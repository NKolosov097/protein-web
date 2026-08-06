/* ============================================================
   RUSSIAN dictionary. Flat key → string.
   The key set must match js/lang-en.js exactly — ?selftest checks it.
   ============================================================ */
const I18N_RU = {
  'selftest.vars':      'у {{name}} есть {{n}}',

  // ---- loading / header ----
  'load.default':       'ЗАГРУЗКА СТРУКТУРЫ…',
  'load.level':         'ЗАГРУЗКА СТРУКТУРЫ {{name}} · {{pdb}}…',
  'hdr.targetNone':     'МИШЕНЬ: —',
  'hdr.target':         'МИШЕНЬ: {{name}} · PDB {{pdb}} · {{sub}}',
  'btn.sound.title':    'Звук вкл/выкл',
  'btn.sound.on':       'Звук: вкл',
  'btn.sound.off':      'Звук: выкл',
  'btn.menu.title':     'Меню',
  'btn.lang.title':     'Язык',

  // ---- score / leaderboard ----
  'score.label':        'СЧЁТ',
  'score.best':         'РЕКОРД: {{n}}',
  'score.line':         'СЧЁТ {{s}} · РЕКОРД {{b}}',
  'board.title':        '◆ ЛИДЕРЫ',

  // ---- meter ----
  'meter.contact':      'КОНТАКТ С КАРМАНОМ',
  'meter.distLabel':    'до цели:',
  'meter.inPocket':     '≤ 5 Å = в кармане',
  'mission.closed':     '🎯 <b>Задача:</b> приведи молекулу-ключ в зелёный карман и заткни «выключатель» рака',
  'mission.open':       '🔬 <b>Открытая задача:</b> лекарства ещё нет ни у кого — ищи, куда «прицепить» ключ на белке <b>{{name}}</b>',

  // ---- controls help (desktop only) ----
  'help.title':         '<b>ЛЕКАРСТВО</b> <span style="color:#6f8bbf">(мышь)</span>',
  'help.move':          '🖱 тащи молекулу — двигать',
  'help.rotate':        '🖱 правый клик + тащи — вращать',
  'help.wheel':         'колесо над молекулой — глубже / ближе',
  'help.camera':        '<b style="color:var(--cyan)">КАМЕРА:</b> тащи фон — поворот · <kbd>Shift</kbd>+мышь — сдвиг · колесо — зум',
  'help.keys':          'Клавиши: <kbd>← ↑ → ↓</kbd> <kbd>W</kbd>/<kbd>S</kbd> двигать · <kbd>Q E A D Z C</kbd> вращать',

  // ---- action buttons ----
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

  // ---- touch mode switcher ----
  'mode.move':          '✋ ДВИГАТЬ',
  'mode.rotate':        '🔄 ВРАЩАТЬ',
  'mode.depth':         '↕ ГЛУБИНА',

  // ---- about / how-to modal ----
  'tut.skip':           'ПРОПУСТИТЬ ✕',
  'tut.tabAbout':       'О ЧЁМ ИГРА',
  'tut.tabHow':         'КАК ИГРАТЬ',
  'tut.prev':           '◀ Назад',
  'tut.next':           'Далее ▶',
  'tut.done':           'Готово ✓',

  // ---- level picker ----
  'levels.close':       'ЗАКРЫТЬ ✕',
  'levels.title':       '🎯 ВЫБЕРИ РАКОВУЮ МИШЕНЬ',
  'levels.sub':         'Каждый уровень — <b>настоящий</b> раковый белок из базы PDB. <b>✔</b> — мишени, к которым лекарство уже подобрали (повтори успех учёных). <i>🔬</i> — мишени, к которым лекарства <i>ещё нет ни у кого</i>: они <i>открыты сразу</i>, тут нет «правильного ответа», любой твой результат — вклад в реальный поиск.',

  // ---- coach ----
  'coach.skip':         'ПРОПУСТИТЬ ОБУЧЕНИЕ ✕',
  'coach.next':         'Далее ▶',
  'done.title':         'МИШЕНЬ ПРОЙДЕНА!',
};
