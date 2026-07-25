/* ============================================================
   3Dmol scene — startup, level loading, surface, labels, the
   per-frame gameplay render (ligand + target + force lines) and
   the animation loop.
   ============================================================ */

/* ---------- 3Dmol init ---------- */
function init(){
  viewer = $3Dmol.createViewer("viewer", { backgroundColor:0x05060f });
  el('load').style.display='none';     // nothing is loading until a level is picked
  loadLeaderboard();
  // first visit → the full story (concept + controls); closeTut() then loads the default level.
  // otherwise → jump straight into a level (last played, or level 1 if none was ever chosen).
  if(!localStorage.getItem('pd_seen')) openTut(ABOUT_STEPS.concat(HOW_STEPS));
  else loadLevel(defaultLevelIdx());
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

  // wipe the previous structure and gameplay overlays
  try{ viewer.removeAllModels(); }catch(e){}
  try{ viewer.removeAllSurfaces(); }catch(e){}
  viewer.removeAllShapes(); viewer.removeAllLabels(); resetLabels();
  proteinAtoms = []; hoverAtoms = []; pocket = null; wasInPocket = false;
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

  viewer.zoomTo(); viewer.zoom(0.9); viewer.render();
  el('load').style.display='none';
  animate(myGen);            // loop: ligand "breathing" + recompute
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
  // target marker label (◎ "TARGET") — static, so create it a single time
  if(!targetLabel){
    targetLabel = viewer.addLabel("◎ ЦЕЛЬ: " + POCKET_LABEL, {
      position:{x:pocket.x, y:pocket.y+12, z:pocket.z},
      backgroundColor:'#04220a', backgroundOpacity:0.75,
      fontColor:'#39ff14', fontSize:12, borderThickness:1.4, borderColor:'#39ff14',
      inFront:true, alignment:'bottomCenter'
    });
  }
  // ligand label (🔹 "YOUR DRUG") — follows the molecule, so rebuild only when it moved
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
}
// forget cached labels after they are wiped externally (e.g. study mode clears all labels)
function resetLabels(){ targetLabel=null; ligLabel=null; lastLigLabelPos=''; }

/* ---------- draw ligand + force lines ---------- */
function draw(t=0){
  // STUDY MODE: the study code manages highlights (setStyle) and its own HTML tooltip,
  // and renders on demand — so we stop the gameplay animation entirely here (no per-frame
  // re-render of the heavy stick view, no ligand shapes).
  if(infoMode) return;

  viewer.removeAllShapes();
  // NOTE: labels are NOT cleared here — they are managed by syncLabels() below so they
  // are not destroyed/recreated every frame (that caused the labels to flicker/"jump").

  const {mind, world, center} = minDistance(t);
  const fit = fitEnergy(world);
  const {color, status, pct, hint} = quality(fit);
  const inPocket = mind <= 5;

  // ---- TARGET MARKER: pulsing pocket (zinc site) ----
  const pulse = 2.4 + 0.5*Math.sin(t*1.5);
  viewer.addSphere({center:pocket, radius:pulse, color:'#39ff14', opacity:0.22});
  viewer.addSphere({center:pocket, radius:0.9, color:'#39ff14', opacity:0.9});
  // arrow pointing INTO the pocket from "above" ON SCREEN — anchored to the camera's up
  // axis (not world-Y), so it always lines up with the target and its tip sits on the
  // marker no matter how the camera is turned. (Previously it floated off to the side.)
  const up = camBasis().up;
  viewer.addArrow({
    start:{x:pocket.x+up[0]*9,   y:pocket.y+up[1]*9,   z:pocket.z+up[2]*9},
    end:  {x:pocket.x+up[0]*2.4, y:pocket.y+up[1]*2.4, z:pocket.z+up[2]*2.4},
    radius:0.55, color:'#39ff14', radiusRatio:2.2
  });
  // target + ligand labels — created once and refreshed only on movement (see syncLabels)
  syncLabels();

  // ligand atoms — spheres with glow (brighter inside the pocket)
  const glow = inPocket ? 0.55 : 0.42;
  world.forEach((w,i)=>{
    viewer.addSphere({center:w, radius:glow, color:LIG_LOCAL[i].c});
    if(inPocket) viewer.addSphere({center:w, radius:glow+0.25, color:'#39ff14', opacity:0.25});
  });
  // bonds within the ligand
  for(let i=0;i<6;i++){
    viewer.addCylinder({start:world[i], end:world[(i+1)%6], radius:0.12, color:'#4de3ff'});
  }
  viewer.addCylinder({start:world[0], end:world[6], radius:0.12, color:'#39ff14'});

  // guide line: from molecule to target, colour by distance
  viewer.addCylinder({
    start:center, end:pocket, radius:0.08,
    color, dashed:true, fromCap:1, toCap:1
  });

  // ---- SOLUTION GHOST: a SEPARATE blinking molecule showing the ideal pose to copy ----
  // Constant size (no "inflation"); the pulse is pure brightness/opacity so it reads clearly.
  if(showSolution && solutionPose){
    const blink = 0.65 + 0.35*(0.5+0.5*Math.sin(t*3));   // bright opacity pulse: 0.65 … 1.0
    const gw = poseWorld(solutionPose);
    gw.forEach((w,i)=>viewer.addSphere({center:w, radius:0.55, color:LIG_LOCAL[i].c, opacity:blink}));
    for(let i=0;i<6;i++) viewer.addCylinder({start:gw[i], end:gw[(i+1)%6], radius:0.16, color:'#eaffff', opacity:blink});
    viewer.addCylinder({start:gw[0], end:gw[6], radius:0.16, color:'#39ff14', opacity:blink});
  }

  // HUD
  el('barFill').style.width = pct+'%';
  el('barFill').style.background = color;
  el('barFill').style.boxShadow = '0 0 14px '+color;
  el('status').textContent = status;
  el('status').style.color = color;
  el('hint').textContent = hint;
  el('distVal').textContent = mind<900 ? mind.toFixed(2) : '—';

  // sound — a short pleasant blip only when entering the pocket (no drone)
  zoneSound(mind);

  viewer.render();
  return mind;
}

/* ---------- animation loop ("living", breathing molecule) ---------- */
// myGen ties the loop to the level it started for; switching levels bumps `gen`
// so any older loop stops on its next tick (prevents overlapping renders).
function animate(myGen){
  if(myGen !== gen) return;
  breath += 0.06;
  draw(breath);
  requestAnimationFrame(()=>setTimeout(()=>animate(myGen), 45)); // ~20 fps
}
