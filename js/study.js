/* ============================================================
   STUDY MODE ("ИЗУЧЕНИЕ") — hover any part of the structure to learn
   what it is. Manages its own highlighting, detail level (ribbon vs
   individual residue by zoom), target marker and HTML tooltip.
   HOTSPOTS (frequent cancer mutations) are per-level — set from
   LEVEL.hotspots on load (see onModelLoaded).
   ============================================================ */

// summarise each polymer chain once (how many residues / nucleotides it has)
function buildChainStats(){
  CHAIN_STATS = {};
  proteinAtoms.forEach(a=>{
    if(a.het) return;                                  // only protein / DNA chains
    const c = a.chain || '?';
    const rn = (a.resn||'').toUpperCase();
    if(!CHAIN_STATS[c]) CHAIN_STATS[c] = {dna:DNA_RESN.includes(rn), res:new Set()};
    CHAIN_STATS[c].res.add(a.resi);
  });
}
// tooltip text. mode='chain' → describe the whole ribbon; mode='residue' → describe one unit.
function annotate(a, mode){
  const resn=(a.resn||'').toUpperCase(), resi=a.resi, chain=a.chain||'?';
  const elem=(a.elem||'').toUpperCase();
  const NM = LEVEL ? LEVEL.name : 'белок';
  if(elem==='ZN' || resn==='ZN')
    return `🎯 ИОН ЦИНКА (Zn²⁺)\nСтруктурная опора ядра ${NM} — наша мишень для стыковки.`;
  if(resn==='HOH' || resn==='WAT')
    return '💧 Молекула воды\nЧасть кристаллической структуры, а не самого белка.';
  if(a.het)
    return `🔶 ${resn} · цепь ${chain}\nИон или малая молекула, связанная со структурой${LEVEL && !LEVEL.open && LEVEL.drug ? ' (в т.ч. само лекарство — цель стыковки)' : ''}.`;
  const n = CHAIN_STATS[chain] ? CHAIN_STATS[chain].res.size : '?';

  if(DNA_RESN.includes(resn)){
    if(mode==='chain')
      return `🧬 ДНК · цепь ${chain}\nНить из ${n} нуклеотидов. Раковые белки вроде ${NM}\nконтактируют с ДНК и управляют работой генов.\n🔍 Приблизься, чтобы навести на отдельный нуклеотид.`;
    return `🧬 Нуклеотид ${resn}${resi} · цепь ${chain}\nОтдельное звено нити ДНК рядом с белком ${NM}.`;
  }

  if(mode==='chain')
    return `🔷 Цепь ${chain} — белок ${NM}\nЛента из ${n} аминокислот.\n🔍 Приблизься, чтобы навести на отдельную аминокислоту.`;
  let s = `🔷 ${resn}${resi} · цепь ${chain}`;
  s += HOTSPOTS[resi] ? '\n★ '+HOTSPOTS[resi] : `\nАминокислота белка ${NM}.`;
  return s;
}
let curHi=null, prevHi=null, focused=false;
const DIM = 0.7;   // opacity of everything except the hovered object (lower = darker)
// Base study look at a given opacity. Far ('chain') = smooth ribbons; close ('residue') =
// ribbon + sticks so the chain visibly consists of individual amino acids / nucleotides.
function paintScene(op){
  if(detailLevel==='residue'){
    // ribbon + thin sticks: you can see each amino acid that builds the chain
    viewer.setStyle({}, {cartoon:{color:'spectrum', opacity:op}, stick:{color:'spectrum', radius:0.12, opacity:op}});
    viewer.setStyle({resn:DNA_RESN}, {cartoon:{color:'#00e5ff', opacity:op}, stick:{colorscheme:'cyanCarbon', radius:0.16, opacity:op}});
  } else {
    viewer.setStyle({}, {cartoon:{color:'spectrum', opacity:op}});
    viewer.setStyle({resn:DNA_RESN}, {cartoon:{color:'#00e5ff', opacity:op}, stick:{colorscheme:'cyanCarbon', radius:0.28, opacity:op}});
  }
  viewer.setStyle({hetflag:true}, {sphere:{scale:0.4, color:'magenta', opacity: op<1 ? op : 0.9}});
}
// Study mode base (nothing hovered): the whole structure stays fully visible.
// The surface is removed entirely so nothing hides the chains inside.
function brightScene(){ paintScene(1); viewer.render(); }
// While hovering: dim the rest of the scene so the highlighted object stands out but
// everything else stays clearly visible (so you can see what the tooltip points at).
function focusDim(){ paintScene(DIM); }
// pick chain/residue detail from the current zoom
function currentLevel(){ return pxPerA() < CLOSE_PXA ? 'chain' : 'residue'; }
// entry point when study mode is switched on — drop the surface, then show everything bright
function dimAll(){ curHi=null; prevHi=null; focused=false; removeProteinSurface(); detailLevel=currentLevel(); brightScene(); }
// re-evaluate detail when the zoom changes; rebuild the base scene if it flipped
function updateDetailLevel(){
  if(!infoMode) return;
  const lvl=currentLevel();
  if(lvl===detailLevel) return;
  detailLevel=lvl; prevHi=null; curHi=null;
  if(focused) focusDim(); else paintScene(1);
  viewer.render();
}
// restore the normal (gameplay) look when study mode is switched off
function restoreNormal(){
  viewer.setStyle({}, {cartoon:{color:'spectrum'}});
  viewer.setStyle({resn:DNA_RESN}, {cartoon:{color:'spectrum'}});
  viewer.setStyle({hetflag:true}, {sphere:{scale:0.4, color:'magenta'}});
  viewer.setStyle({resn:['HOH','WAT']}, {});   // keep water hidden in gameplay
  viewer.setStyle(METAL_SEL, {sphere:{scale:0.6, color:'#ffcc33'}});   // structural metal ions stay gold
  removeProteinSurface();
  addProteinSurface(0.55);
  curHi=null; prevHi=null; focused=false;
  viewer.render();
}
// style to apply to the hovered object: `bright` = emphasised, `dim` = faded back into
// the dimmed scene. Highlighting KEEPS the object's real colour — we only raise its opacity
// to full and add sticks; we never repaint it. mode: 'chain' = whole ribbon, 'residue' = one unit.
function styleFor(a, mode){
  const resn=(a.resn||'').toUpperCase(), elem=(a.elem||'').toUpperCase();
  const isWater = resn==='HOH' || resn==='WAT';
  // ions / water / small molecules — same magenta sphere as normal, just larger when hovered
  if(a.het || elem==='ZN' || resn==='ZN')
    return {key:'H_'+a.chain+'_'+a.resi+'_'+resn,
      sel:{resn:a.resn, resi:a.resi, chain:a.chain},
      bright:{sphere:{scale:isWater?0.6:0.85, color:'magenta', opacity:1}},
      dim:{sphere:{scale:0.4, color:'magenta', opacity:DIM}}};
  // DNA — keeps its real cyan colour; far = whole strand, close = one nucleotide.
  // `dim` mirrors the base look at this zoom so un-highlighting blends back in seamlessly.
  if(DNA_RESN.includes(resn)){
    if(mode==='chain')
      return {key:'Dc_'+a.chain, sel:{chain:a.chain},
        bright:{cartoon:{color:'#00e5ff', opacity:1}, stick:{colorscheme:'cyanCarbon', radius:0.4}},
        dim:{cartoon:{color:'#00e5ff', opacity:DIM}, stick:{colorscheme:'cyanCarbon', radius:0.28, opacity:DIM}}};
    return {key:'Dr_'+a.chain+'_'+a.resi, sel:{chain:a.chain, resi:a.resi},
      bright:{cartoon:{color:'#00e5ff', opacity:1}, stick:{colorscheme:'cyanCarbon', radius:0.4}},
      dim:{cartoon:{color:'#00e5ff', opacity:DIM}, stick:{colorscheme:'cyanCarbon', radius:0.16, opacity:DIM}}};
  }
  // protein — keeps its real spectrum colour; far = whole chain, close = one residue
  if(mode==='chain')
    return {key:'Pc_'+a.chain, sel:{chain:a.chain},
      bright:{cartoon:{color:'spectrum', opacity:1}},
      dim:{cartoon:{color:'spectrum', opacity:DIM}}};
  return {key:'Pr_'+a.chain+'_'+a.resi, sel:{chain:a.chain, resi:a.resi},
    bright:{cartoon:{color:'spectrum', opacity:1}, stick:{color:'spectrum', radius:0.35}},
    dim:{cartoon:{color:'spectrum', opacity:DIM}, stick:{color:'spectrum', radius:0.12, opacity:DIM}}};
}
// highlight the hovered object; on first hover dim the whole scene, then fade the previous one back
function highlight(a, mode){
  const s=styleFor(a, mode);
  if(s.key===curHi) return;
  if(!focused){ focusDim(); focused=true; }
  if(prevHi) viewer.setStyle(prevHi.sel, prevHi.dim);
  viewer.setStyle(s.sel, s.bright);
  prevHi=s; curHi=s.key;
  viewer.render();
}
// cursor left every object → restore the full-brightness base
function clearHi(){
  if(focused || prevHi){ prevHi=null; curHi=null; focused=false; brightScene(); }
}

// study mode wipes gameplay overlays, so it needs its OWN persistent target marker + label
// (otherwise you can't tell which atom — e.g. the gold zinc — is the docking target).
let studyTargetLabel = null;
function addStudyTarget(){
  if(!pocket) return;
  viewer.addSphere({center:pocket, radius:1.7, color:'#39ff14', opacity:0.25});   // halo, non-pickable
  studyTargetLabel = viewer.addLabel('◎ ЦЕЛЬ стыковки — наведи, чтобы узнать', {
    position:{x:pocket.x, y:pocket.y+12, z:pocket.z},
    backgroundColor:'#04220a', backgroundOpacity:0.8,
    fontColor:'#39ff14', fontSize:12, borderThickness:1.4, borderColor:'#39ff14',
    inFront:true, alignment:'bottomCenter'
  });
  viewer.render();
}
function removeStudyTarget(){
  if(studyTargetLabel){ viewer.removeLabel(studyTargetLabel); studyTargetLabel=null; }
}
function setInfoMode(on){
  infoMode=on; hoverInfo=null;
  el('btnInfo').textContent = on ? '🔎 ИЗУЧЕНИЕ: ВКЛ' : '🔎 ИЗУЧЕНИЕ';
  el('btnInfo').classList.toggle('b-dock', on);
  el('btnInfo').classList.toggle('b-ghost', !on);
  el('viewer').style.cursor = on ? 'crosshair' : '';
  if(on){
    viewer.removeAllShapes(); viewer.removeAllLabels();  // clear leftover gameplay ligand/target
    resetLabels();  // labels were wiped — drop cached refs so draw() recreates them on exit
    dimAll();
    addStudyTarget();   // keep the docking target identifiable while studying
  } else {
    removeStudyTarget();
    restoreNormal(); hideTip();
    resetDrawState();                  // scene was rebuilt — bring the gameplay shapes back
  }
  showToast(on ? '🔎 Наведи курсор на цель, белок, цинк или ДНК' : 'Режим изучения выключен');
}
el('btnInfo').onclick = ()=>{
  if(!LEVEL && !infoMode){ showToast('Сначала выбери мишень — 🗂 УРОВНИ'); return; }
  setInfoMode(!infoMode);
};

// custom nearest-atom picking under the cursor (via 3D→screen projection).
// PRIMARY criterion is proximity to the cursor on screen, so we always highlight the
// object the cursor is actually over. Depth (distance to the camera) is used only as a
// TIE-BREAKER between atoms that overlap the cursor — then the front-most one wins.
// (This avoids the old bug where a far-but-frontmost atom, e.g. a residue from another
//  chain, hijacked the tooltip instead of the ribbon right under the cursor.)
function pickAtom(mx, my){
  if(!hoverAtoms.length){ hoverInfo=null; return; }
  const scr = viewer.modelToScreen(hoverAtoms);   // list of {x,y} in canvas pixels
  const f = camBasis().fwd;                         // view axis; larger dot = closer to the camera
  const RAD = 15;                                   // px: how close to the cursor an atom must be
  const ION = 22;                                   // px: ions get a slightly larger, priority radius
  const TIE = 4;                                    // px: atoms within this of the closest "overlap"

  const dists = new Array(scr.length);
  let dmin = Infinity, ionBest = -1, ionMin = Infinity;
  for(let i=0;i<scr.length;i++){
    const dx=scr[i].x-mx, dy=scr[i].y-my;
    const d = Math.sqrt(dx*dx+dy*dy);
    dists[i] = d;
    if(d < dmin) dmin = d;
    const a = hoverAtoms[i];
    if(a.ion && d<ION && d<ionMin){ ionMin=d; ionBest=i; } // nearest ion under the cursor
  }

  let idx = -1;
  if(ionBest>=0){                                   // an ion under the cursor always wins
    idx = ionBest;
  } else if(dmin < RAD){
    // among the atoms that overlap the cursor (within TIE px of the closest one),
    // pick the front-most so we highlight the ribbon on top rather than one behind it
    let bestDepth = -Infinity;
    for(let i=0;i<scr.length;i++){
      if(dists[i] <= dmin + TIE){
        const a = hoverAtoms[i];
        const depth = a.x*f[0]+a.y*f[1]+a.z*f[2];
        if(depth > bestDepth){ bestDepth=depth; idx=i; }
      }
    }
  }

  if(idx>=0){
    const a=hoverAtoms[idx];
    updateDetailLevel();     // keep the base scene in sync with the current zoom
    // far away → highlight the whole ribbon; zoomed in → highlight the single residue
    const mode = a.het ? 'chain' : detailLevel;
    hoverInfo={pos:{x:a.x,y:a.y,z:a.z}, text:annotate(a, mode)};
    highlight(a, mode);
  } else { hoverInfo=null; clearHi(); }
}
// screen-pixels per Ångström at the current zoom (measured along the camera's right axis,
// which always projects fully) — used to decide "far" (ribbon) vs "close" (residue)
function pxPerA(){
  if(!pocket) return 0;
  const b=camBasis();
  const p0={x:pocket.x, y:pocket.y, z:pocket.z};
  const p1={x:pocket.x+b.right[0]*10, y:pocket.y+b.right[1]*10, z:pocket.z+b.right[2]*10};
  const s=viewer.modelToScreen([p0,p1]);
  return Math.hypot(s[1].x-s[0].x, s[1].y-s[0].y)/10;
}
// HTML tooltip that is always clamped inside the viewport, so long multi-line text is never
// cut off at a screen edge (unlike a 3D label anchored to the atom).
function showTip(text, cx, cy){
  const t=el('tip');
  t.textContent=text;
  t.style.display='block';
  const pad=10, w=t.offsetWidth, h=t.offsetHeight;
  let x=cx+16, y=cy+16;
  if(x+w+pad > window.innerWidth)  x = cx - w - 16;   // no room on the right → flip left of cursor
  if(x < pad) x = pad;
  if(y+h+pad > window.innerHeight) y = cy - h - 16;   // no room below → flip above the cursor
  if(y < pad) y = pad;
  t.style.left = x+'px';
  t.style.top  = y+'px';
}
function hideTip(){ el('tip').style.display='none'; }

let lastHoverT=0;
el('viewer').addEventListener('mousemove', e=>{
  if(!infoMode || panning) return;
  const t=performance.now();
  // pickAtom projects every hoverAtom, so poll less often on weak devices
  if(t-lastHoverT < (qLow() ? 60 : 40)) return;    // ~17 / ~25 times per second
  lastHoverT=t;
  const r=el('viewer').getBoundingClientRect();
  pickAtom(e.clientX-r.left, e.clientY-r.top);
  if(hoverInfo) showTip(hoverInfo.text, e.clientX, e.clientY); else hideTip();
});
el('viewer').addEventListener('mouseleave', ()=>{ hoverInfo=null; clearHi(); hideTip(); });
