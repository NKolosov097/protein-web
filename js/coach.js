/* ============================================================
   COACH — dynamic, in-scene onboarding (level 1)
   ------------------------------------------------------------
   Instead of a wall-of-text modal, this walks a first-time player
   through the whole gameplay loop IN the 3D scene: it flies the
   camera to each object, blinks + narrates it, then hands over one
   action at a time (guide along a magnetic track → rotate to seat →
   press TEST). On success it shows a "level cleared" modal with an
   auto-rendered 3D preview of the next target.

   It reuses the existing gameplay machinery rather than duplicating
   it: the solution-ghost (solveBestPose/solutionPose/showSolution),
   the pulsing pocket + ligand draw in scene.js (gated by the coach*
   flags in state.js), pxPerA()/camBasis()/modelToScreen for the
   camera, and quality()/fitEnergy() for the "seated well" check.

   Step machine (matches the spec 3.1–3.5):
     0  cell overview      — pocket & drug hidden, whole protein framed
     1  the drug           — reveal + blink the ligand, fly to it
     2  the pocket         — reveal the pocket marker, fly to it
     3  guide along track  — magnetic drag from start → pocket (auto-adv)
     4  rotate to seat     — blinking reference pose, wait for green (auto-adv)
     5  press TEST         — pulse the button, wait for the click → success
   Steps 0–2 advance with the "Далее" button; 3–4 auto-advance from
   coachTick(); 5 completes when TEST is pressed (see js/hud.js).
   ============================================================ */

/* ---------- camera flights ----------
   A flight is ONE smooth diagonal move, not a chain of separate zoom/rotate/pan animations.
   We compute the *destination* view by applying the moves instantly (3Dmol's own zoomTo/rotate/
   zoom + a measured recenter), read the resulting view vector, snap back, then interpolate
   start→target every frame (slerp the rotation, lerp the translation+zoom). Because we go
   straight to the target, the camera never visibly detours "up then sideways". */
function viewerRect(){ return el('viewer').getBoundingClientRect(); }
// protein centroid ≈ the view's rotation centre (used to tell which side the pocket is on)
function proteinCentroid(){ return proteinAtoms.length ? centroid(proteinAtoms) : {x:0,y:0,z:0}; }
// >0 → P is on the near side (toward the viewer); <0 → it's on the FAR side, needs turning around
function towardViewer(P){
  const c = proteinCentroid(), b = camBasis();
  return (P.x-c.x)*b.fwd[0] + (P.y-c.y)*b.fwd[1] + (P.z-c.z)*b.fwd[2];
}
// pan a world point to the centre of the canvas (measured, so it's exact regardless of zoom)
function recenter(P, ms){
  const s = viewer.modelToScreen([P])[0], r = viewerRect();
  viewer.translate(r.width/2 - s.x, s.y - r.height/2, ms||0);
}
// shortest-arc quaternion interpolation ([x,y,z,w]) so a 180° turn still spins smoothly
function slerp(a, b, t){
  let d = a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  let bb = b;
  if(d<0){ bb=[-b[0],-b[1],-b[2],-b[3]]; d=-d; }
  if(d>0.9995){                                    // nearly aligned → normalised lerp
    const r=[a[0]+(bb[0]-a[0])*t, a[1]+(bb[1]-a[1])*t, a[2]+(bb[2]-a[2])*t, a[3]+(bb[3]-a[3])*t];
    const n=Math.hypot(r[0],r[1],r[2],r[3])||1; return [r[0]/n,r[1]/n,r[2]/n,r[3]/n];
  }
  const th0=Math.acos(d), th=th0*t, s0=Math.cos(th)-d*Math.sin(th)/Math.sin(th0), s1=Math.sin(th)/Math.sin(th0);
  return [a[0]*s0+bb[0]*s1, a[1]*s0+bb[1]*s1, a[2]*s0+bb[2]*s1, a[3]*s0+bb[3]*s1];
}
// capture the view that `apply` (a set of INSTANT camera ops) would leave us at, without moving
let camSeq = 0;
function captureTarget(apply){
  const orig = viewer.getView().slice();
  try{ apply(); }catch(e){}
  const target = viewer.getView().slice();
  viewer.setView(orig);                            // snap back — all synchronous, so never painted
  return target;
}
// interpolate the current view → target over ms (one continuous move); newer flight cancels older
function tweenView(target, ms){
  const start = viewer.getView().slice();
  const my = ++camSeq, t0 = performance.now();
  (function frame(now){
    if(my!==camSeq || !coachActive || camInteracting) return;   // yield if the user grabs the camera
    const k = Math.min(1, (now-t0)/ms);
    const e = k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;   // easeInOutQuad
    const q = slerp([start[4],start[5],start[6],start[7]], [target[4],target[5],target[6],target[7]], e);
    viewer.setView([ start[0]+(target[0]-start[0])*e, start[1]+(target[1]-start[1])*e,
                     start[2]+(target[2]-start[2])*e, start[3]+(target[3]-start[3])*e,
                     q[0], q[1], q[2], q[3] ]);
    if(k<1) requestAnimationFrame(frame);
  })(performance.now());
}
// smooth flight to look at a point up close: fit protein (zoom baseline), turn it to the front if
// the point is on the far side, zoom in, centre it — then tween there in one go. `face` off for
// open-space points (the drug); `tilt` degrees adds a downward look; `lift` px raises the framing.
function flightTo(getP, factor, ms, opts){
  opts = opts || {};
  const target = captureTarget(()=>{
    viewer.zoomTo({});
    if(opts.face && towardViewer(getP())<0) viewer.rotate(180, 'y');
    if(opts.tilt) viewer.rotate(opts.tilt, 'x');
    viewer.zoom(factor);
    recenter(getP());
    if(opts.lift) viewer.translate(0, opts.lift);        // nudge the framing up (positive = up)
  });
  tweenView(target, ms);
}

/* ---------- narration bubble ---------- */
function coachBubble(icon, html, showNext){
  el('coachIcon').textContent = icon;
  el('coachText').innerHTML = html;
  el('coachNext').classList.toggle('hidden', !showNext);
  el('coach').classList.add('show');
}

/* ---------- step machine ---------- */
// current drug centre (no breathing) — the track start / camera focus
function drugCenter(){ return minDistance(0).center; }

function coachGoto(n){
  coachStep = n;
  document.body.classList.toggle('coach-actions', n===5);   // action menu only for the TEST step
  // the mode switcher is needed from step 3 on (before that the bubble covers it)
  document.body.classList.toggle('coach-modes', n>=3);
  const P = pocket;
  const NM = LEVEL ? LEVEL.name : 'этот белок';
  switch(n){
    case 0:   // ---- overview: just the protein (pulled back so it fits), no pocket, no drug ----
      coachHidePocket = true; coachHideDrug = true; coachBlinkDrug = false; coachMagnet = false;
      coachTrack = null; showSolution = false; syncSolveBtn();
      // whole cell, pulled back a bit and lifted so it doesn't sit behind the bottom bubble
      tweenView(captureTarget(()=>{ viewer.zoomTo({}); viewer.zoom(0.72); viewer.translate(0, 30); }), 800);
      coachBubble('🧬',
        `Перед тобой раковый белок <b>${NM}</b>. В опухолевой клетке он «сломан» и не даёт ей ` +
        `остановить деление. Сейчас разберёмся, как его «выключить». <span class="hlc">Нажми «Далее»</span>.`, true);
      break;
    case 1:   // ---- the drug (centre it up close) ----
      coachHidePocket = true; coachHideDrug = false; coachBlinkDrug = true; coachMagnet = false;
      coachTrack = null;
      flightTo(drugCenter, 1.7, 800, {face:true});
      coachBubble('🔑',
        `Вот <b>твоё лекарство</b> — крошечная молекула-ключ (голубая, мигает). Именно им ты ` +
        `будешь действовать: подводить и вставлять в белок.`, true);
      break;
    case 2:   // ---- the pocket: it's on the far side, so TURN the protein to face it ----
      coachHidePocket = false; coachHideDrug = false; coachBlinkDrug = false; coachMagnet = false;
      coachTrack = null;
      flightTo(()=>pocket, 1.9, 800, {face:true});
      coachBubble('🎯',
        `А это <b>карман</b> — уязвимое место белка, его «выключатель» (зелёная метка). ` +
        `Мы повернули клетку к нему. Цель — вставить ключ точно сюда.`, true);
      break;
    case 3: {  // ---- guide along the magnetic track: show both ends, tilted so the pocket is clear ----
      coachHidePocket = false; coachHideDrug = false; coachBlinkDrug = true; coachMagnet = true;
      const c = drugCenter();
      coachTrack = { a:{x:c.x,y:c.y,z:c.z}, b:{x:P.x,y:P.y,z:P.z} };
      const mid = { x:(c.x+P.x)/2, y:(c.y+P.y)/2, z:(c.z+P.z)/2 };
      // one smooth move: turn the pocket to the front, tilt down so it's clearly visible, frame both ends
      tweenView(captureTarget(()=>{
        viewer.zoomTo({});
        if(towardViewer(pocket)<0) viewer.rotate(180, 'y');
        viewer.rotate(22, 'x');
        viewer.zoom(1.05);
        recenter(mid);
      }), 900);
      coachBubble(IS_TOUCH ? '👆' : '🖱', IS_TOUCH
        ? `Проведи <b>пальцем по светящейся дорожке</b> — лекарство пойдёт за ним прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`
        : `Схвати лекарство мышью и <b>веди по светящейся дорожке</b> прямо в карман. ` +
          `Не бойся промахнуться — сейчас ключ сам держится трека.`, false);
      break;
    }
    case 4:   // ---- rotate to seat (reference ghost blinks) ----
      coachHidePocket = false; coachHideDrug = false; coachBlinkDrug = false; coachMagnet = false;
      coachTrack = null;
      if(!solutionPose) solutionPose = solveBestPose();
      showSolution = true; syncSolveBtn();
      // zoom into the pocket, keeping step 3's turned/tilted orientation; the tween goes straight
      // there so there's no jarring pull-back to the whole protein.
      tweenView(captureTarget(()=>{ viewer.zoomTo({}); viewer.zoom(1.7); recenter(pocket); }), 700);
      coachBubble('🔄', IS_TOUCH
        ? `Ты у кармана! Переключись внизу на <span class="hlc">🔄 ВРАЩАТЬ</span> и <b>поверни</b> лекарство ` +
          `пальцем, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`
        : `Ты у кармана! Теперь <b>поверни</b> лекарство (<span class="hlc">правый клик + мышь</span>) ` +
          `и подведи вплотную, чтобы оно легло как <b>моргающий эталон</b>. Когда сядет плотно — появится кнопка «Тест».`, false);
      break;
    case 5:   // ---- press TEST ----
      coachBlinkDrug = false; coachMagnet = false; coachTrack = null;
      el('btnDock').classList.add('pulse');
      coachBubble('✅',
        `Отлично, ключ сел плотно! Жми пульсирующую кнопку <b>«▶ ТЕСТ ЛЕКАРСТВА»</b> справа — ` +
        `проверим, насколько крепко он держится.`, false);
      // pre-render the next target's 3D preview so the success modal can show it instantly
      { const nxt = LEVELS[LEVEL_IDX+1]; if(nxt) renderLevelPreview(nxt.pdb); }
      break;
  }
}

/* ---------- per-frame hook (called from draw in scene.js) ----------
   Drawing only: the glowing track + the position of the "grab here" cursor.
   The auto-advance check (coachTick) is called from draw() SEPARATELY and
   earlier, because it has to run every tick even when the frame is not
   redrawn (dirty-render, see scene.js). */
function coachShapes(world, center){
  // glowing dotted track the player should follow (steps that set coachTrack)
  if(coachTrack){
    const a = coachTrack.a, b = coachTrack.b, N = 14;
    for(let i=0;i<=N;i++){
      const t = i/N;
      const p = {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, z:a.z+(b.z-a.z)*t};
      const blink = 0.35 + 0.45*(0.5+0.5*Math.sin(breath*3 - i*0.5));   // travelling shimmer
      viewer.addSphere({center:p, radius:0.5, color:'#39ff14', opacity:blink});
    }
  }
  // blinking "grab here" cursor over the drug (step 3, until the player grabs it)
  const cur = el('coachCursor');
  if(coachStep===3 && !draggingLig){
    const s = viewer.modelToScreen([center])[0];
    const r = el('viewer').getBoundingClientRect();
    cur.style.left = (r.left + s.x) + 'px';
    cur.style.top  = (r.top  + s.y) + 'px';
    cur.querySelector('.cc-tip').textContent = IS_TOUCH ? 'веди пальцем в карман' : 'схвати и веди в карман';
    cur.style.display = 'block';
  } else {
    cur.style.display = 'none';
  }
}
// auto-advance for the hands-on steps
function coachTick(mind, fit){
  if(coachStep===3 && mind<=5.5){ coachGoto(4); return; }        // reached the pocket → seat it
  if(coachStep===4){
    const q = Math.max(0, Math.min(1, (-fit.affinity-3)/9));     // seating quality, same as quality()
    if(mind<=6 && fit.clash<=1.8 && q>0.45) coachGoto(5);        // decently seated → reveal the TEST button
  }
}

/* ---------- start / stop ---------- */
function startCoach(){
  if(!pocket || !viewer) return;
  // reset the drug to its starting spot, clear any hint / score
  lig.x = pocket.x+26; lig.y = pocket.y+14; lig.z = pocket.z+22; lig.rx=lig.ry=lig.rz=0;
  solutionPose = null; showSolution = false; syncSolveBtn();
  setScore(0);
  el('btnDock').classList.remove('pulse');
  document.body.classList.add('coaching');   // hide meter / controls hint / action menu (see css)
  camInteracting = false;                     // clear any stale flag so the first flight runs
  coachActive = true;
  coachGoto(0);
}
// tear down the coach and return to normal gameplay (pocket + drug visible, no track/magnet)
function endCoach(){
  coachActive = false; coachStep = -1;
  coachHidePocket = coachHideDrug = coachBlinkDrug = coachMagnet = false;
  coachTrack = null;
  document.body.classList.remove('coaching', 'coach-actions', 'coach-modes');
  el('btnDock').classList.remove('pulse');
  el('coach').classList.remove('show');
  el('coachCursor').style.display = 'none';
  showSolution = false; syncSolveBtn();
}

/* ---------- success: "level cleared" modal + next-target preview ---------- */
let coachNextIdx = -1;
function coachSuccess(affinity){
  const done = LEVEL;
  const nxt = LEVELS[LEVEL_IDX+1];
  coachNextIdx = nxt ? LEVEL_IDX+1 : -1;
  endCoach();   // stop coaching; the modal takes over

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

  // preview slot: spinner while the next target renders (kicked off in step 5), image when ready
  const img = el('cdPreview'), spin = el('cdSpin');
  img.style.display = 'none'; spin.style.display = nxt ? 'block' : 'none';
  el('coachDone').classList.add('show');
  if(nxt){
    renderLevelPreview(nxt.pdb).then(uri=>{
      spin.style.display = 'none';
      if(uri){ img.src = uri; img.style.display = 'block'; }   // else: leave the gradient placeholder
    });
  }
}
el('coachDoneGo').onclick = ()=>{
  el('coachDone').classList.remove('show');
  if(coachNextIdx>=0) loadLevel(coachNextIdx); else openLevels();
};

/* ---------- offscreen 3D snapshot of a level (for the success modal) ----------
   Renders a PDB in a hidden throwaway viewer and returns a PNG data-URL, cached per id.
   Best-effort: on any failure (offline, bad id) it resolves null and the modal keeps its
   gradient placeholder. */
// cache the PROMISE (not just the result) so the warm-up call in step 5 and the modal's own call
// share one render instead of racing two downloads of the same structure
const previewPromise = {};
function renderLevelPreview(pdb){
  if(previewPromise[pdb]) return previewPromise[pdb];
  const p = new Promise(resolve=>{
    let host = el('pvHost');
    if(!host){
      host = document.createElement('div'); host.id = 'pvHost';
      host.style.cssText = 'position:fixed;left:-9999px;top:0;width:480px;height:340px;';
      document.body.appendChild(host);
    }
    host.innerHTML = '';
    let v;
    // the preview is a 480×340 PNG, ribbon quality does not matter here,
    // and on a phone this viewer is alive alongside the main one
    try{ v = $3Dmol.createViewer(host, qLow()
      ? {backgroundColor:0x0a0e22, cartoonQuality:3, antialias:false}
      : {backgroundColor:0x0a0e22}); }
    catch(e){ resolve(null); return; }
    let done = false;
    const finish = val => { if(done) return; done = true; resolve(val); };
    const to = setTimeout(()=>finish(null), 15000);
    $3Dmol.download('pdb:'+pdb, v, {}, function(model){
      if(!model){ clearTimeout(to); finish(null); return; }
      try{
        v.setStyle({}, {cartoon:{color:'spectrum'}});
        v.setStyle({hetflag:true}, {sphere:{scale:0.4, color:'magenta'}});
        v.setStyle({resn:['HOH','WAT']}, {});
        if(!qLow()) v.addSurface($3Dmol.SurfaceType.VDW, {opacity:0.5, colorscheme:'cyanCarbon'}, {hetflag:false});
        v.zoomTo(); v.zoom(0.95); v.render();
        // the VDW surface builds asynchronously — give it a beat before snapshotting
        setTimeout(()=>{ let uri=null; try{ uri = v.pngURI(); }catch(e){} clearTimeout(to); finish(uri||null); }, 700);
      }catch(e){ clearTimeout(to); finish(null); }
    });
  });
  previewPromise[pdb] = p;
  return p;
}

/* ---------- buttons ---------- */
el('coachNext').onclick = ()=>{ if(coachStep<3) coachGoto(coachStep+1); };
el('coachSkip').onclick = endCoach;
el('btnCoach').onclick   = ()=>{
  if(!pocket){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
  if(infoMode) setInfoMode(false);
  startCoach();
};
