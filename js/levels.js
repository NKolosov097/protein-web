/* ============================================================
   LEVEL SELECT + progress
   ----------------------------------------------------------
   Progress is stored per level in localStorage:
     pd_levels = { <id>: { attempted, solved, best } }
   • best   — best (most negative) binding energy seen, kcal/mol
   • solved — a normal target docked while inside the pocket
   • open levels are never "solved"; they only track attempted + best.
   A level is unlocked once the PREVIOUS one is solved (normal) or
   attempted (open). Level 1 is always unlocked.
   ============================================================ */
function getProg(){ try{ return JSON.parse(localStorage.getItem('pd_levels')||'{}'); }catch{ return {}; } }
function setProg(p){ localStorage.setItem('pd_levels', JSON.stringify(p)); }
function isUnlocked(i, prog){
  if(LEVELS[i].open) return true;   // open science problems are available from the start
  if(i===0) return true;
  const P = LEVELS[i-1], pr = prog[P.id] || {};
  return P.open ? !!pr.attempted : !!pr.solved;
}
// called after every "TEST DRUG": store the attempt and maybe mark the level solved
function recordResult(aff, mind){
  if(!LEVEL) return;
  const prog = getProg(), pr = prog[LEVEL.id] || {};
  pr.attempted = true;
  if(pr.best==null || aff < pr.best) pr.best = aff;      // more negative = stronger = better
  let newlySolved = false;
  if(!LEVEL.open && mind <= 5 && !pr.solved){ pr.solved = true; newlySolved = true; }
  prog[LEVEL.id] = pr; setProg(prog);
  if(newlySolved){
    const next = LEVELS[LEVEL_IDX+1];
    // open levels are already available from the start, so only announce a genuine unlock
    const msg = (next && !next.open) ? t('lv.clearedNext', {name: levelName(next)})
                                     : t('lv.cleared');
    setTimeout(()=>showToast(msg, 3200), 700);
  }
}

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
function openLevels(){ renderLevels(); el('levels').classList.add('show'); }
function closeLevels(){ el('levels').classList.remove('show'); }
// the ✕ always closes the picker; if no target is loaded yet, remind why one is needed
function dismissLevels(){
  closeLevels();
  if(!LEVEL) showToast(t('lv.pickToast'), 2600);
}
el('btnLevels').onclick   = ()=> openLevels();
el('levelsClose').onclick = dismissLevels;
// a tap on the dimmed area outside the card dismisses it too (the ✕ and the card
// itself are other targets, so this only fires for the backdrop)
el('levels').onclick = e=>{ if(e.target === el('levels')) dismissLevels(); };
