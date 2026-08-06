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
