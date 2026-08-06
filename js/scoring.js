/* ============================================================
   Docking target + shape-contact scoring
   ------------------------------------------------------------
   Finds the pocket for the current level, samples the protein wall
   around it, and turns a ligand pose into a binding energy. The same
   model runs in the browser and in server.py so the number matches.
   ============================================================ */

// common cofactors / ions / crystallization additives — skipped when auto-picking the drug
const COMMON_HET = new Set(('HOH WAT GDP GTP GNP GSP GCP GPP GDP MG MN NA CL K CA ZN FE CU NI ' +
  'SO4 PO4 PO3 EDO GOL ACT DMS PEG BME MES EPE TRS FMT NO3 CO3 IOD BR ATP ADP AMP NAD FAD NAG BMA MAN').split(' '));

/* find the docking target for the current level */
function findPocket(atoms){
  const U = s => (s||'').toUpperCase();
  const strat = (LEVEL && LEVEL.pocket) || {type:'auto'};
  const label = levelPocketLabel(LEVEL);   // the text lives in the dictionaries, see js/i18n.js

  if(strat.type==='elem'){
    const a = atoms.find(x => U(x.elem)===strat.value || U(x.resn)===strat.value);
    if(a) return {pos:{x:a.x,y:a.y,z:a.z}, label};
  }
  if(strat.type==='resn'){
    const sel = atoms.filter(x => U(x.resn)===strat.value);
    if(sel.length) return {pos:centroid(sel), label};
  }
  // auto: the bound drug = the largest hetero group that is not water / a common cofactor
  const groups = {};
  atoms.forEach(a=>{
    if(!a.het) return;
    const rn=U(a.resn); if(rn==='HOH'||rn==='WAT') return;
    const k = a.chain+'|'+a.resi+'|'+rn;
    (groups[k] = groups[k] || {n:0, pts:[], rn});
    groups[k].n++; groups[k].pts.push(a);
  });
  const keys = Object.keys(groups);
  if(keys.length){
    const uncommon = keys.filter(k => !COMMON_HET.has(groups[k].rn));
    const pool = (uncommon.length ? uncommon : keys).sort((a,b)=>groups[b].n-groups[a].n);
    const top = groups[pool[0]];
    // use a bound molecule only if it's substantial — a real drug/nucleotide (e.g. RAS's
    // GNP marks the functional site), NOT a lone crystallisation ion / additive
    if(uncommon.length || top.n >= 8) return {pos:centroid(top.pts), label};
  }
  // no meaningful ligand (the "undruggable" open targets) → a concave spot on the SURFACE,
  // not the buried centre of mass
  return {pos:findSurfacePocket(atoms), label};
}
// A lightweight pocket finder for targets with no bound ligand: scans protein atoms for a
// spot that is enclosed at medium range yet not densely packed up close — i.e. a concave
// surface pocket rather than the buried core or a flat patch. Runs once per level load,
// downsampled so it stays cheap. Approximate (a game heuristic, not a validated detector).
function findSurfacePocket(atoms){
  const prot = atoms.filter(a=>!a.het);
  if(!prot.length) return centroid(atoms);
  const cands = downsample(prot, 1000), cloud = downsample(prot, 2500);
  const R1=5.5*5.5, R2=11*11;
  let best=null, bestScore=-Infinity;
  for(const a of cands){
    let near=0, mid=0;
    for(const p of cloud){
      const dx=a.x-p.x, dy=a.y-p.y, dz=a.z-p.z, d2=dx*dx+dy*dy+dz*dz;
      if(d2<R1) near++;
      if(d2<R2) mid++;
    }
    const score = mid - 2.6*near;         // enclosed (mid) but accessible (low near) → a pocket
    if(score>bestScore){ bestScore=score; best=a; }
  }
  return best ? {x:best.x, y:best.y, z:best.z} : centroid(prot);
}

/* ---------- shape-contact scoring (orientation matters) ----------
   The protein wall around the pocket is sampled once per level (POCKET_ATOMS).
   For every ligand atom we look at its nearest protein atom:
     • ~3.2 Å  → a "good" van-der-Waals contact  (reward)
     • < 2.3 Å → a steric clash / overlap        (penalty)
   Summed with a proximity term (bring the molecule to the pocket), this turns
   into a binding energy where BOTH position AND orientation change the result —
   the same model runs in the browser and in server.py so the number matches. */
function buildPocketAtoms(){
  if(!pocket) return [];
  const R2 = 14*14, out = [];
  for(const a of proteinAtoms){
    if(a.het) continue;                       // protein / DNA walls only (not the bound drug/ions/water)
    const dx=a.x-pocket.x, dy=a.y-pocket.y, dz=a.z-pocket.z;
    if(dx*dx+dy*dy+dz*dz < R2) out.push({x:a.x, y:a.y, z:a.z});
  }
  // cap the sample (per-frame cost + server payload) by evenly striding
  const CAP = 700;
  if(out.length > CAP){
    const stride = Math.ceil(out.length/CAP), s = [];
    for(let i=0;i<out.length;i+=stride) s.push(out[i]);
    return s;
  }
  return out;
}
function fitEnergy(world){
  const c = centroid(world);
  const centerDist = pocket ? dist(c, pocket) : 1e9;
  let good=0, clash=0;
  const PA = POCKET_ATOMS;
  for(let j=0;j<world.length;j++){
    const w=world[j]; let d2min=Infinity;
    for(let i=0;i<PA.length;i++){
      const dx=w.x-PA[i].x, dy=w.y-PA[i].y, dz=w.z-PA[i].z;
      const d2=dx*dx+dy*dy+dz*dz;
      if(d2<d2min) d2min=d2;
    }
    const d=Math.sqrt(d2min);
    if(d<2.3)       clash += (2.3-d);                              // overlap depth
    else if(d<4.5)  good  += Math.max(0, 1-Math.abs(d-3.2)/1.3);   // bump peaking at ~3.2 Å
  }
  const prox = Math.max(0, 1-centerDist/18);
  let aff = -1 - 5*prox - 1.1*good + 2.2*clash;   // more negative = stronger binding
  aff = Math.max(-12, Math.min(-0.5, aff));
  return {affinity:aff, centerDist, good, clash};
}

// Find an ideal pose to show as the blinking "answer": a coarse grid search over
// orientations and small position offsets around the pocket, maximising fitEnergy.
// Computed once per level (cached in solutionPose). ~6k evaluations → instant.
function solveBestPose(){
  if(!pocket) return null;
  const ANG = [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3];
  const OFF = [-2.4, 0, 2.4];
  let best=null, bestAff=Infinity;
  for(const ox of OFF) for(const oy of OFF) for(const oz of OFF){
    const px=pocket.x+ox, py=pocket.y+oy, pz=pocket.z+oz;
    for(const rx of ANG) for(const ry of ANG) for(const rz of ANG){
      const pose={x:px, y:py, z:pz, rx, ry, rz};
      const aff = fitEnergy(poseWorld(pose)).affinity;
      if(aff<bestAff){ bestAff=aff; best=pose; }
    }
  }
  return best;
}

// map shape-fit → colour / status / meter fill.
// Two phases: first GET to the pocket (position), then SEAT it well (orientation).
function quality(fit){
  const {centerDist, clash, affinity} = fit;
  // ---- phase 1: still bringing the key toward the pocket ----
  // device-neutral wording: the same hint is true for a mouse and for a finger
  // (on a phone "right click" and "mouse" simply do not exist)
  if(centerDist>20) return {color:'#ff2e5b', status:t('q.far'),    pct:6,  hint:t('q.far.hint')};
  if(centerDist>10) return {color:'#ff8a1e', status:t('q.closer'), pct:26, hint:t('q.closer.hint')};
  if(centerDist>5)  return {color:'#ffb000', status:t('q.close'),  pct:44, hint:t('q.close.hint')};
  // ---- phase 2: in the pocket → orientation / seating now drives the score ----
  // seating quality from the binding energy: -3 (loose) … -12 (tight)
  const q = Math.max(0, Math.min(1, (-affinity-3)/9));
  const pct = Math.round(55 + q*45);
  if(clash>1.2) return {color:'#ffb000', status:t('q.clash'),  pct:Math.min(pct,62), hint:t('q.clash.hint')};
  if(q>0.75)    return {color:'#39ff14', status:t('q.seated'), pct:100,              hint:t('q.seated.hint')};
  return          {color:'#ffe600', status:t('q.inPocket'), pct,                     hint:t('q.inPocket.hint')};
}
