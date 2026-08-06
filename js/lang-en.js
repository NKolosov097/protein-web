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
  'lv.clearedNext':     '✔ Target cleared! Unlocked: {{name}}',
  'lv.cleared':         '✔ Target cleared! 🎉',
  'lv.lockedToast':     '🔒 Deal with the previous target first',
  'lv.pickToast':       'Open 🗂 TARGETS when you are ready to pick a target',
  'lv.loadError':       '⚠ Could not load {{pdb}} from the PDB. Check your connection.',

  // ---- coach ----
  'coach.skip':         'SKIP THE TUTORIAL ✕',
  'coach.next':         'Next ▶',
  'done.title':         'TARGET CLEARED!',
};
