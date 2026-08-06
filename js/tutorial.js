/* ============================================================
   STATIC HELP ("ОБ ИГРЕ") — reference decks, opened on demand.
   ----------------------------------------------------------
   Two decks: ABOUT_KEYS explains WHAT/WHY (the lock-and-key metaphor
   + the real point), HOW_KEYS explains the controls. They live behind
   ONE button (❓ ОБ ИГРЕ) as two tabs inside the modal. The hands-on
   onboarding for a first-time player is the dynamic coach (js/coach.js)
   that runs in-scene on level 1 — this modal is just the reference you
   can reopen any time.

   Only card ids are stored here: the text itself lives in the
   dictionaries under <id>.title / <id>.body (see js/lang-*.js).
   The how.2 card (controls) exists in two variants — mouse and
   finger — because that instruction has to be concrete.
   ============================================================ */
const ABOUT_KEYS = ['about.1', 'about.2', 'about.3'];
const HOW_KEYS   = ['how.1',   'how.2',   'how.3'];
// the icons are the same in both languages, so they do not belong in the dictionaries
const TUT_ICONS = {'about.1':'🔒','about.2':'🔑','about.3':'🔬',
                   'how.1':'🔹','how.2':'🎮','how.3':'🏆'};

// the text key of a card: for how.2 it depends on mouse vs finger
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
