/* ============================================================
   3Dmol scene — startup, level loading, surface, labels, the
   per-frame gameplay render (ligand + target + force lines) and
   the animation loop.
   ============================================================ */

/* ---------- 3Dmol init ---------- */
function init(){
  // опции берём из профиля качества (js/perf.js): на 'low' — грубее
  // ленты и без сглаживания, плюс там же ограничен devicePixelRatio
  viewer = $3Dmol.createViewer("viewer", viewerOptions());
  el('load').style.display='none';     // nothing is loading until a level is picked
  loadLeaderboard();
  // jump straight into a level (last played, or level 1 if none was ever chosen). Onboarding is
  // no longer a modal wall — the dynamic in-scene coach (js/coach.js) runs on level 1 instead;
  // the "❓ ОБ ИГРЕ" button reopens the static reference decks any time.
  loadLevel(defaultLevelIdx());
}
// which level to open on startup: the last one the player chose, else the first (level 1)
function defaultLevelIdx(){
  const last = parseInt(localStorage.getItem('pd_last_level'), 10);
  return (Number.isInteger(last) && LEVELS[last]) ? last : 0;
}

/* ---------- load a chosen level (PDB structure) ---------- */
let loadTimer = null;
function loadLevel(i){
  LEVEL_IDX = i; LEVEL = LEVELS[i];
  localStorage.setItem('pd_last_level', i);   // remember it → auto-loaded next time (see defaultLevelIdx)
  const myGen = ++gen;                 // invalidate any running animation loop / pending load
  closeLevels(); hideTip();
  if(infoMode) setInfoMode(false);     // study mode off when switching targets
  if(coachActive) endCoach();          // drop any running coach when switching targets

  // wipe the previous structure and gameplay overlays
  try{ viewer.removeAllModels(); }catch(e){}
  try{ viewer.removeAllSurfaces(); }catch(e){}
  viewer.removeAllShapes(); viewer.removeAllLabels(); resetLabels();
  proteinAtoms = []; hoverAtoms = []; pocket = null; wasInPocket = false;
  resetDrawState();                    // новая сцена → первый кадр обязан перерисоваться
  solutionPose = null; showSolution = false; syncSolveBtn();   // drop any hint from the previous level

  // HUD / title reflect the current target
  document.title = 'PROTEIN DOCKER — ' + LEVEL.name + ' (' + LEVEL.pdb + ')';
  el('hdrSub').textContent = 'МИШЕНЬ: ' + LEVEL.name + ' · PDB ' + LEVEL.pdb + ' · ' + LEVEL.sub;
  el('mission').innerHTML = LEVEL.open
    ? '🔬 <b>Открытая задача:</b> лекарства ещё нет ни у кого — ищи, куда «прицепить» ключ на белке <b>' + LEVEL.name + '</b>'
    : '🎯 <b>Задача:</b> приведи молекулу-ключ в зелёный карман и заткни «выключатель» рака';
  score = 0; el('scoreVal').textContent = '0';

  // loading screen + a safety timeout so a bad/absent PDB id is recoverable
  el('loadTxt').textContent = 'ЗАГРУЗКА СТРУКТУРЫ ' + LEVEL.name + ' · ' + LEVEL.pdb + '…';
  el('load').style.display = 'flex';
  clearTimeout(loadTimer);
  loadTimer = setTimeout(()=>{ if(myGen===gen && !proteinAtoms.length) levelLoadError(); }, 18000);

  $3Dmol.download('pdb:' + LEVEL.pdb, viewer, {}, function(model){
    if(myGen !== gen) return;          // a newer level started while this was downloading
    let atoms = [];
    try{ atoms = model ? model.selectedAtoms({}) : []; }catch(e){}
    if(!atoms.length){ levelLoadError(); return; }
    clearTimeout(loadTimer);
    onModelLoaded(atoms, myGen);
  });
}

function levelLoadError(){
  clearTimeout(loadTimer);
  el('load').style.display='none';
  showToast('⚠ Не удалось загрузить ' + (LEVEL ? LEVEL.pdb : '') + ' из PDB. Проверь интернет.', 3200);
  openLevels();
}

// build the scene once a structure's atoms are in
function onModelLoaded(atoms, myGen){
  // STAGE 1 look: translucent surface + cartoon + neon hetero spheres
  viewer.setStyle({}, { cartoon:{ color:'spectrum' } });
  addProteinSurface(0.55);
  viewer.setStyle({ hetflag:true }, { sphere:{ scale:0.4, color:'magenta' } });
  viewer.setStyle({ resn:['HOH','WAT'] }, {});   // hide crystallographic water (clutter, and it looks like the target)
  viewer.setStyle(METAL_SEL, { sphere:{ scale:0.6, color:'#ffcc33' } });   // structural metal ions (incl. the Zn target) — gold, not magenta

  // collect atom coordinates for distance / picking
  proteinAtoms = atoms.map(a => {
    const rn=(a.resn||'').toUpperCase();
    const het = a.hetflag || !(AA_RESN.has(rn) || DNA_RESN.includes(rn));
    return {x:a.x, y:a.y, z:a.z, resn:a.resn, resi:a.resi, chain:a.chain, elem:a.elem,
      het, ion: het && rn!=='HOH'};   // ion = hetero but not water
  });
  hoverAtoms = proteinAtoms;
  buildChainStats();
  HOTSPOTS = LEVEL.hotspots || {};

  // target pocket per level (ion / named ligand / auto-detected drug / centroid)
  const pk = findPocket(proteinAtoms);
  pocket = pk.pos; POCKET_LABEL = pk.label;
  POCKET_ATOMS = buildPocketAtoms();   // protein wall around the target → shape-fit scoring

  // ligand starts outside so the player guides it toward the target
  lig.x = pocket.x + 26; lig.y = pocket.y + 14; lig.z = pocket.z + 22;
  lig.rx = lig.ry = lig.rz = 0;

  // Frame the level so the TARGET is always front-and-centre when it opens, no matter how the
  // player orbited the previous level. Two steps:
  //   1. Reset the camera ORIENTATION to the default. zoomTo() re-centers and re-fits, but keeps
  //      whatever rotation was carried over from the previous level, so we force the rotation
  //      quaternion back to identity (the same view level 1 shows on a fresh load).
  //   2. Centre the POCKET (not the protein centroid) on screen. zoomTo() only centres the whole
  //      protein; the target sits away from that centroid, so we measure the pocket's screen
  //      position and pan it to the middle (lifted 55px so it clears the bottom meter panel).
  viewer.zoomTo();
  const view = viewer.getView();
  view[4] = 0; view[5] = 0; view[6] = 0; view[7] = 1;   // rotation quaternion → identity (default view)
  viewer.setView(view);
  viewer.zoom(0.9);
  const ps = viewer.modelToScreen([pocket])[0], vr = el('viewer').getBoundingClientRect();
  viewer.translate(vr.width/2 - ps.x, ps.y - vr.height/2 + 55);   // pan pocket → centre, then lift 55px
  viewer.render();
  el('load').style.display='none';
  animate(myGen);            // loop: ligand "breathing" + recompute

  // onboarding vs "show me the goal":
  //  • level 1 → run the dynamic coach every time (spec: it teaches the whole loop hands-on).
  //  • other druggable levels → auto-show the blinking reference pose as the goal to aim for
  //    (the player does everything themselves; 💡 ПОДСКАЗКА still toggles it off/on).
  //  • open problems (no reference drug exists) → nothing to show, just the pocket marker.
  if(LEVEL_IDX===0){
    startCoach();
  } else if(!LEVEL.open){
    solutionPose = solveBestPose(); showSolution = true; syncSolveBtn();
  }
}

/* ---------- protein surface ---------- */
// (Re)build the VDW surface at a given opacity. Recreating it is the only reliable way
// to change its transparency — setSurfaceMaterialStyle often has no visible effect.
function addProteinSurface(op){
  const surfP = viewer.addSurface($3Dmol.SurfaceType.VDW,
    {opacity:op, colorscheme:'cyanCarbon'}, {hetflag:false});
  Promise.resolve(surfP).then(ret=>{
    SURF = (ret && typeof ret==='object' && 'surfid' in ret) ? ret.surfid : ret;
  }).catch(()=>{});
}
function removeProteinSurface(){
  try{ viewer.removeAllSurfaces(); }catch(e){}
  SURF = null;
}

/* ---------- persistent labels (created once, refreshed only on movement) ---------- */
// Recreating labels every animation frame made them flicker/"jump", so we cache them
// and only rebuild the ligand label when the molecule actually moves.
let targetLabel=null, ligLabel=null, lastLigLabelPos='';
function syncLabels(){
  // target marker label (◎ "TARGET") — static, so create it a single time; the coach can hide
  // the pocket entirely (intro steps), so drop the label with it and recreate it once shown.
  if(!coachHidePocket){
    if(!targetLabel){
      targetLabel = viewer.addLabel("◎ ЦЕЛЬ: " + POCKET_LABEL, {
        position:{x:pocket.x, y:pocket.y+12, z:pocket.z},
        backgroundColor:'#04220a', backgroundOpacity:0.75,
        fontColor:'#39ff14', fontSize:12, borderThickness:1.4, borderColor:'#39ff14',
        inFront:true, alignment:'bottomCenter'
      });
    }
  } else if(targetLabel){ viewer.removeLabel(targetLabel); targetLabel = null; }

  // ligand label (🔹 "YOUR DRUG") — follows the molecule, so rebuild only when it moved
  if(!coachHideDrug){
    const key = lig.x+','+lig.y+','+lig.z;
    if(key!==lastLigLabelPos){
      if(ligLabel) viewer.removeLabel(ligLabel);
      ligLabel = viewer.addLabel("🔹 ТВОЁ ЛЕКАРСТВО", {
        position:{x:lig.x, y:lig.y+4.5, z:lig.z},
        backgroundColor:'#0a1330', backgroundOpacity:0.72,
        fontColor:'#22e0ff', fontSize:12, borderThickness:1.4, borderColor:'#22e0ff',
        inFront:true, alignment:'bottomCenter'
      });
      lastLigLabelPos = key;
    }
  } else if(ligLabel){ viewer.removeLabel(ligLabel); ligLabel = null; lastLigLabelPos = ''; }
}
// forget cached labels after they are wiped externally (e.g. study mode clears all labels)
function resetLabels(){ targetLabel=null; ligLabel=null; lastLigLabelPos=''; }

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

  // ---- TARGET MARKER: pulsing pocket (zinc site) ---- (coach may hide it early on)
  if(!coachHidePocket){
    // The big translucent halo normally marks the pocket, but it grows to ~2.9Å — wide enough to
    // ENVELOP the solution-ghost drug and wash it out (it reads as a dark blinking ball hiding the
    // hint). When the ghost is shown it already marks the spot, so shrink the halo to a small pip
    // that sits inside the empty benzene-ring centre instead of swallowing the whole molecule.
    // на 'low' в покое пульс замирает (см. pocketAnimates), иначе неподвижная
    // сцена никогда не станет «чистой» и рендеры пойдут вхолостую
    const ph = pocketAnimates() ? Math.sin(t*1.5) : 0;
    const pulse = showSolution ? 1.0 + 0.15*ph : 2.4 + 0.5*ph;
    viewer.addSphere({center:pocket, radius:pulse, color:'#39ff14', opacity:0.22});
    if(!showSolution) viewer.addSphere({center:pocket, radius:0.9, color:'#39ff14', opacity:0.9});
    // arrow pointing INTO the pocket from "above" ON SCREEN — anchored to the camera's up
    // axis (not world-Y), so it always lines up with the target and its tip sits on the
    // marker no matter how the camera is turned. (Previously it floated off to the side.)
    const up = camBasis().up;
    viewer.addArrow({
      start:{x:pocket.x+up[0]*9,   y:pocket.y+up[1]*9,   z:pocket.z+up[2]*9},
      end:  {x:pocket.x+up[0]*2.4, y:pocket.y+up[1]*2.4, z:pocket.z+up[2]*2.4},
      radius:0.55, color:'#39ff14', radiusRatio:2.2
    });
  }
  // target + ligand labels — created once and refreshed only on movement (see syncLabels).
  // syncLabels() itself honours the coach hide flags so labels vanish with their objects.
  syncLabels();

  // ligand atoms — spheres with glow (brighter inside the pocket). Coach can hide the drug
  // entirely (intro steps) or make it "breathe" brighter to draw attention (coachBlinkDrug).
  if(!coachHideDrug){
    const glow = inPocket ? 0.55 : 0.42;
    const op = coachBlinkDrug ? 0.4 + 0.6*(0.5+0.5*Math.sin(t*3)) : 1;
    world.forEach((w,i)=>{
      viewer.addSphere({center:w, radius:glow, color:LIG_LOCAL[i].c, opacity:op});
      if(inPocket) viewer.addSphere({center:w, radius:glow+0.25, color:'#39ff14', opacity:0.25*op});
    });
    // bonds within the ligand
    for(let i=0;i<6;i++){
      viewer.addCylinder({start:world[i], end:world[(i+1)%6], radius:0.12, color:'#4de3ff', opacity:op});
    }
    viewer.addCylinder({start:world[0], end:world[6], radius:0.12, color:'#39ff14', opacity:op});
  }

  // guide line: from molecule to target, colour by distance (only when both ends are shown)
  if(!coachHideDrug && !coachHidePocket){
    viewer.addCylinder({
      start:center, end:pocket, radius:0.08,
      color, dashed:true, fromCap:1, toCap:1
    });
  }

  // ---- SOLUTION GHOST: a SEPARATE blinking molecule showing the ideal pose to copy ----
  // Constant size (no "inflation"); the pulse is pure brightness/opacity so it reads clearly.
  if(showSolution && solutionPose){
    const blink = 0.65 + 0.35*(0.5+0.5*Math.sin(t*3));   // bright opacity pulse: 0.65 … 1.0
    const gw = poseWorld(solutionPose);
    gw.forEach((w,i)=>viewer.addSphere({center:w, radius:0.55, color:LIG_LOCAL[i].c, opacity:blink}));
    for(let i=0;i<6;i++) viewer.addCylinder({start:gw[i], end:gw[(i+1)%6], radius:0.16, color:'#eaffff', opacity:blink});
    viewer.addCylinder({start:gw[0], end:gw[6], radius:0.16, color:'#39ff14', opacity:blink});
  }

  // guided tutorial overlay: track + "grab here" cursor (adds shapes, so before render).
  // Автопереходы (coachTick) уже вызваны выше, до гейта dirty-render.
  if(coachActive) coachShapes(world, center);

  viewer.render();
  return mind;
}

/* ---------- animation loop ("living", breathing molecule) ---------- */
// myGen ties the loop to the level it started for; switching levels bumps `gen`
// so any older loop stops on its next tick (prevents overlapping renders).
//
// ~20 fps, throttled against the display refresh (rAF + time delta) rather than the old
// rAF(setTimeout) combo, so the redraw lands on a real frame instead of mid-cycle.
//
// While the CAMERA is being moved (camInteracting: orbit / pan), we SKIP the gameplay
// redraw entirely. 3Dmol already re-renders the scene for the camera move, so rebuilding
// the ~20 ligand/target shapes and firing a second full render on top of it only competes
// with the rotation and causes the stutter. The shapes stay in place and turn with the
// scene; the "breathing" just pauses for the duration of the drag (invisible while turning).
let lastFrameTs = 0;
function animate(myGen){
  if(myGen !== gen) return;
  requestAnimationFrame(ts=>{
    if(myGen !== gen) return;                 // level switched → let this loop die
    if(ts - lastFrameTs >= (qLow() ? 80 : 45)){   // ~12 fps на 'low', ~20 fps на 'high'
      lastFrameTs = ts;
      if(!camInteracting){ breath += 0.06; draw(breath); }
    }
    animate(myGen);                           // schedule the next frame
  });
}
