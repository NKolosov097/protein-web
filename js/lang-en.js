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

  // ---- coach ----
  'coach.skip':         'SKIP THE TUTORIAL ✕',
  'coach.next':         'Next ▶',
  'done.title':         'TARGET CLEARED!',

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
};
