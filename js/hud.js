/* ============================================================
   HUD & gameplay actions — the bottom-right buttons (hint, engine
   toggle, drug test, reset), plus toast/fireworks, sound and the
   local leaderboard.
   ============================================================ */

/* ---------- "SHOW SOLUTION" hint: a blinking ghost of the ideal pose ---------- */
function syncSolveBtn(){
  el('btnSolve').textContent = showSolution ? '💡 ПОДСКАЗКА: ВКЛ' : '💡 ПОДСКАЗКА';
  el('btnSolve').classList.toggle('b-dock', showSolution);
  el('btnSolve').classList.toggle('b-ghost', !showSolution);
}
el('btnSolve').onclick = ()=>{
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
  showSolution = !showSolution;
  if(showSolution){
    if(!solutionPose) solutionPose = solveBestPose();   // compute once per level, then cache
    showToast('💡 Полупрозрачная мигающая молекула — идеальное положение. Повтори её позу и поворот своим лекарством.', 4200);
  }
  syncSolveBtn();
};
syncSolveBtn();

/* ---------- "DRUG TEST" → score calculation ----------
   The score uses the in-browser shape-contact model ('learn'): instant, offline, orientation-
   aware — the right fit for a learning game. The backend AutoDock Vina path ('vina') is kept
   wired below (it's a real docking engine) but there's no in-UI toggle anymore; leave `engine`
   at 'learn'. Flip this constant to 'vina' to route through the Python server instead. */
const API = 'http://localhost:8000/dock';
const engine = 'learn';

el('btnDock').onclick = async ()=>{
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
  const {mind, world} = minDistance(0);
  const btn=el('btnDock'), old=btn.textContent;
  btn.disabled=true; btn.textContent='⏳ СЧИТАЕМ…';

  let affinity, source;
  if(engine==='vina'){
    try{
      const res = await fetch(API, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          engine:'vina', receptor: LEVEL.pdb,
          ligand: world.map(w=>({x:w.x, y:w.y, z:w.z})),
          center: [pocket.x, pocket.y, pocket.z],
          pocket_atoms: POCKET_ATOMS
        })
      });
      if(!res.ok){ let d=''; try{ d=(await res.json()).detail||''; }catch(_){}
        throw new Error(d || ('HTTP '+res.status)); }
      affinity = (await res.json()).affinity;
      source = 'AutoDock Vina';
    }catch(e){
      affinity = fitEnergy(world).affinity;   // Vina unavailable → learning model, and say so
      source = 'обучающая модель (Vina недоступна)';
      showToast('⚠ Vina недоступна ('+(e.message||'нет связи с сервером')+') — считаю обучающей моделью', 3800);
    }
  } else {
    affinity = fitEnergy(world).affinity;      // learning mode: instant, in-browser
    source = 'обучающая модель';
  }
  const pts = Math.round(-affinity*1000);
  btn.disabled=false; btn.textContent=old;

  score = pts;
  el('scoreVal').textContent = score.toLocaleString('ru-RU');

  // record per-level progress (attempt / best affinity / solved + unlock next)
  recordResult(affinity, mind);

  // guided tutorial: pressing TEST on the last coaching step (drug seated in the pocket) is the
  // win — celebrate, then show the "level cleared" modal with a preview of the next target.
  if(coachActive && coachStep===5 && mind<=5){
    fireworks(); chimeWin();
    if(pts>best){ best=pts; el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU'); saveScore(pts); }
    coachSuccess(affinity);
    return;
  }

  // one-time explanation of what the score means, shown on the very first test
  const firstTest = !localStorage.getItem('pd_score_seen');

  let msg;
  if(pts>best){
    best=pts; el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU');
    fireworks(); chimeWin();
    msg = `★ РЕКОРД!  ${affinity.toFixed(1)} ккал/моль · ${source}`;
    saveScore(pts);
  } else {
    msg = `${affinity.toFixed(1)} ккал/моль · ${pts.toLocaleString('ru-RU')} очков · ${source}`;
  }

  if(firstTest){
    localStorage.setItem('pd_score_seen','1');
    showToast(`${affinity.toFixed(1)} ккал/моль — это сила «прилипания» ключа. Чем больше минус, тем крепче держится и тем больше очков! (${pts.toLocaleString('ru-RU')})`, 4600);
  } else {
    showToast(msg);
  }
};

el('btnReset').onclick = ()=>{
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
  lig.x=pocket.x+26; lig.y=pocket.y+14; lig.z=pocket.z+22;
  lig.rx=lig.ry=lig.rz=0; score=0; el('scoreVal').textContent='0';
};

/* ---------- toast + fireworks ---------- */
function showToast(msg, ms=1800){
  const t=el('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),ms);
}
function fireworks(){
  const cols=['#39ff14','#22e0ff','#a15bff','#ffb000','#ff2e5b'];
  for(let i=0;i<60;i++){
    const s=document.createElement('div');
    const a=Math.random()*Math.PI*2, v=120+Math.random()*220;
    s.style.cssText=`position:fixed;z-index:40;left:50%;top:50%;width:7px;height:7px;border-radius:50%;
      pointer-events:none;background:${cols[i%cols.length]};box-shadow:0 0 10px currentColor`;
    document.body.appendChild(s);
    const dx=Math.cos(a)*v, dy=Math.sin(a)*v;
    s.animate([{transform:'translate(0,0)',opacity:1},
               {transform:`translate(${dx}px,${dy}px)`,opacity:0}],
              {duration:900+Math.random()*500,easing:'cubic-bezier(.1,.7,.3,1)'})
     .onfinish=()=>s.remove();
  }
}

/* ---------- sound (WebAudio) — short pleasant blips, no drone ---------- */
let actx, soundOn=false;   // sound OFF by default (toggled with the button)
function initAudio(){
  if(actx) return;
  actx=new (window.AudioContext||window.webkitAudioContext)();
}
// a single short tone with a soft envelope
function blip(freq, dur=0.14, type='sine', vol=0.14){
  if(!soundOn||!actx) return;
  const o=actx.createOscillator(), g=actx.createGain();
  o.type=type; o.frequency.value=freq;
  o.connect(g); g.connect(actx.destination);
  const t=actx.currentTime;
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vol,t+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
// "ding" on entering the pocket — fires once per boundary crossing
function zoneSound(d){
  const now = d<=5;
  if(now && !wasInPocket){ blip(880,0.12); setTimeout(()=>blip(1320,0.16),90); } // pleasant two-note chord
  wasInPocket = now;
}
// cheerful arpeggio on a new record
function chimeWin(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'triangle',0.16),i*90)); }
// sound toggle — now a compact round icon in the header (see index.html #hdr)
el('btnSound').onclick = ()=>{
  soundOn=!soundOn; initAudio();
  el('btnSound').textContent = soundOn ? '🔊' : '🔇';
  el('btnSound').classList.toggle('on', soundOn);
  el('btnSound').title = soundOn ? 'Звук: вкл' : 'Звук: выкл';
};
// unlock audio on first click (browser autoplay policy)
window.addEventListener('click', initAudio, {once:true});

/* ---------- local leaderboard (mini Stage 4) ---------- */
function getBoard(){ try{return JSON.parse(localStorage.getItem('pd_board')||'[]')}catch{return[]} }
function saveScore(pts){
  let name = prompt('РЕКОРД! Введите ник для таблицы лидеров:', 'ИГРОК');
  if(!name) name='ИГРОК';
  const b=getBoard(); b.push({name:name.slice(0,10), pts});
  b.sort((a,z)=>z.pts-a.pts); localStorage.setItem('pd_board', JSON.stringify(b.slice(0,5)));
  loadLeaderboard();
}
function loadLeaderboard(){
  const b=getBoard();
  if(!b.length){ el('lb').style.display='none'; return; }
  el('lb').style.display='block';
  el('lbList').innerHTML = b.map(r=>`<li>${r.name}<span>${r.pts.toLocaleString('ru-RU')}</span></li>`).join('');
  best = Math.max(best, b[0].pts);
  el('best').textContent='РЕКОРД: '+best.toLocaleString('ru-RU');
}
