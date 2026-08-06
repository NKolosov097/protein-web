/* ============================================================
   Input — keyboard nudges + direct mouse manipulation of the
   ligand ("grab the key"), plus cursor-anchored zoom.
   ============================================================ */

/* ---------- keyboard controls ---------- */
const STEP=1.2, ROT=0.15;
// movement is RELATIVE to the camera (goes where you look); e.code → any keyboard layout
window.addEventListener('keydown', e=>{
  const b=camBasis();
  const mv=(v,s)=>{ lig.x+=v[0]*STEP*s; lig.y+=v[1]*STEP*s; lig.z+=v[2]*STEP*s; };
  let ok=true;
  switch(e.code){
    case 'ArrowRight': mv(b.right, 1); break;   // right on screen
    case 'ArrowLeft':  mv(b.right,-1); break;   // left
    case 'ArrowUp':    mv(b.up,    1); break;   // up
    case 'ArrowDown':  mv(b.up,   -1); break;   // down
    case 'KeyW':       mv(b.fwd,  -1); break;   // into the screen (away from camera)
    case 'KeyS':       mv(b.fwd,   1); break;   // toward the viewer
    case 'KeyQ': lig.rx+=ROT; break;
    case 'KeyE': lig.rx-=ROT; break;
    case 'KeyA': lig.ry+=ROT; break;
    case 'KeyD': lig.ry-=ROT; break;
    case 'KeyZ': lig.rz+=ROT; break;
    case 'KeyC': lig.rz-=ROT; break;
    default: ok=false;
  }
  if(ok) e.preventDefault();
});

// is the cursor (canvas-relative px) over the ligand? projects the molecule to the
// screen and checks proximity to any of its atoms → used to grab/drag it directly.
// grab radius: a finger needs a noticeably bigger one than a cursor
const GRAB_PX = IS_TOUCH ? 48 : 34;
function ligHit(mx, my){
  if(!pocket || !viewer) return false;
  const world = LIG_LOCAL.map(p=>ligWorld(p, breath));
  const pts = viewer.modelToScreen([centroid(world), ...world]);
  let d2min=Infinity;
  for(const s of pts){ const dx=s.x-mx, dy=s.y-my, d2=dx*dx+dy*dy; if(d2<d2min) d2min=d2; }
  return d2min < GRAB_PX*GRAB_PX;
}

// 3D anchor point under the cursor: the atom whose projection is nearest to it.
// Returns null when the cursor is over empty space (too far from any atom).
// We project a thinned-out sample rather than the whole protein: the anchor only
// has to "pin" the spot under the cursor while zooming, so being off by a couple of
// Ångström is invisible, while projecting every atom on each wheel tick is expensive.
let anchorPool = null, anchorPoolGen = -1;
function anchorAtoms(){
  if(anchorPoolGen !== gen || !anchorPool){
    anchorPool = downsample(proteinAtoms, 1200);
    anchorPoolGen = gen;
  }
  return anchorPool;
}
function anchorFor(mx, my){
  if(!proteinAtoms.length) return null;
  const pool = anchorAtoms();
  const scr = viewer.modelToScreen(pool);
  let best=-1, bd=Infinity;
  for(let i=0;i<scr.length;i++){
    const dx=scr[i].x-mx, dy=scr[i].y-my, d=dx*dx+dy*dy;
    if(d<bd){ bd=d; best=i; }
  }
  if(best<0 || bd > 300*300) return null;
  const a=pool[best];
  return {x:a.x, y:a.y, z:a.z};
}
// mouse wheel — intuitive zoom (up = zoom in), TOWARD THE CURSOR. Intercepted before 3Dmol.
// 3Dmol's zoom() scales about the view centre (and non-linearly, since the camera is
// perspective), so instead of predicting the shift we MEASURE it: remember the anchor's
// screen position, zoom, then translate the scene so the anchor lands back where it was.
window.addEventListener('wheel', e=>{
  if(!viewer || !el('viewer').contains(e.target)) return;
  const r = el('viewer').getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  // cursor over the molecule (or already dragging it) → wheel pushes it deeper / nearer
  if(!infoMode && (draggingLig || ligHit(mx, my))){
    e.preventDefault(); e.stopPropagation();
    // wheel up (deltaY<0) = toward the viewer, and in ligDepth "pixels down"
    // (dy>0) is the toward-the-viewer direction — hence the flipped sign.
    // 23·0.06 ≈ the same 1.4 Å step as before.
    ligDepth(e.deltaY < 0 ? 23 : -23);
    return;
  }
  e.preventDefault(); e.stopPropagation();
  const f = e.deltaY < 0 ? 1.15 : 0.87;
  const anchor = anchorFor(mx, my);
  const before = anchor ? viewer.modelToScreen([anchor])[0] : null;
  viewer.zoom(f, 0);                             // instant, so the measured translate stays accurate
  if(before){
    const after = viewer.modelToScreen([anchor])[0];
    // pin the anchor in place; translate's Y is screen-inverted, so negate the Y delta
    viewer.translate(before.x - after.x, after.y - before.y, 0);
  }
  // in study mode, switch between ribbon-view and amino-acid-view when the zoom crosses over
  if(infoMode) updateDetailLevel();
}, {passive:false, capture:true});

/* ---------- manipulating the molecule: the shared math ----------
   These four functions are the only place where a pointer changes the molecule's
   pose. Both the mouse branch and the touch branch below call them, so the math
   is never duplicated and finger and mouse behave identically. */

// COACH: magnetic track — pull the molecule's centroid onto the "start → pocket" line
function snapToTrack(){
  if(!coachMagnet || !coachTrack) return;
  const c = centroid(LIG_LOCAL.map(p=>ligWorld(p, breath)));
  const q = projectOnSegment(c, coachTrack.a, coachTrack.b);
  lig.x += q.x - c.x; lig.y += q.y - c.y; lig.z += q.z - c.z;
}

// move in the screen plane, 1:1 with the pointer (px → Ångström)
function ligMove(dx, dy){
  const b=camBasis(), k=1/(pxPerA()||8);
  lig.x += (b.right[0]*dx - b.up[0]*dy)*k;   // screen-down (dy>0) = −up
  lig.y += (b.right[1]*dx - b.up[1]*dy)*k;
  lig.z += (b.right[2]*dx - b.up[2]*dy)*k;
  snapToTrack();
}

// screen trackball: spin about the CAMERA's axes so the surface always follows the
// pointer — drag right and it turns right, no matter how the camera is oriented or
// how the molecule is already turned
function ligRotate(dx, dy){
  const b=camBasis(), k=0.01;
  let R = eulerToMat(lig.rx, lig.ry, lig.rz);
  R = matMul3(axisAngleMat(b.up,    dx*k), R);   // horizontal → yaw about screen-up
  R = matMul3(axisAngleMat(b.right, dy*k), R);   // vertical   → pitch about screen-right
  const a = matToEuler(R);
  lig.rx=a.rx; lig.ry=a.ry; lig.rz=a.rz;
}

// depth: finger/cursor up (dy<0) pushes the molecule AWAY from the viewer,
// down brings it closer (+fwd in camBasis points at the camera)
function ligDepth(dy){
  const b=camBasis(), step = dy*0.06;
  lig.x += b.fwd[0]*step; lig.y += b.fwd[1]*step; lig.z += b.fwd[2]*step;
}

/* ---------- direct mouse manipulation of the ligand ("grab the key") ----------
   Best practice from 3D editors: you grab the object itself with the mouse.
     • left-drag ON the molecule   → move it in the screen plane
     • right-drag ON the molecule  → rotate it (trackball)
     • wheel over the molecule     → push it deeper / nearer (handled above)
     • Shift + left-drag           → pan the camera (unchanged)
     • left-drag on empty space    → orbit the camera (3Dmol default, not intercepted)
   We intercept in the capture phase and stopPropagation so 3Dmol doesn't also move
   the camera; empty-space clicks fall through to 3Dmol untouched. */
let panning=false, lastPX=0, lastPY=0;
let draggingLig=false, rotatingLig=false, lastLX=0, lastLY=0;
window.addEventListener('mousedown', e=>{
  if(!viewer || !el('viewer').contains(e.target)) return;
  // Shift = pan the camera (works in every mode, like Blender)
  if(e.shiftKey && e.button===0){
    panning=true; camInteracting=true; lastPX=e.clientX; lastPY=e.clientY;
    if(infoMode){ hoverInfo=null; hideTip(); }
    e.preventDefault(); e.stopPropagation(); return;
  }
  if(infoMode) return;                 // study mode owns the cursor (hover tooltips)
  // coach intro steps (overview / drug / pocket): the drug isn't in play yet — any drag orbits
  // the camera so the player can look around without disturbing the (hidden) molecule.
  if(coachActive && coachStep<3){ camInteracting=true; return; }
  const r=el('viewer').getBoundingClientRect();
  // not on the molecule → let 3Dmol orbit the camera; freeze the gameplay redraw meanwhile
  if(!ligHit(e.clientX-r.left, e.clientY-r.top)){ camInteracting=true; return; }
  if(e.button===2)      rotatingLig=true;   // right-drag → rotate
  else if(e.button===0) draggingLig=true;   // left-drag  → move
  else return;
  lastLX=e.clientX; lastLY=e.clientY;
  el('viewer').style.cursor='grabbing';
  e.preventDefault(); e.stopPropagation();
}, true);
window.addEventListener('mousemove', e=>{
  if(panning){
    const dx=e.clientX-lastPX, dy=e.clientY-lastPY;
    lastPX=e.clientX; lastPY=e.clientY;
    viewer.translate(dx, -dy, 0);   // 3Dmol's translate Y is screen-inverted → negate dy
    e.preventDefault(); e.stopPropagation(); return;
  }
  if(draggingLig || rotatingLig){
    const dx=e.clientX-lastLX, dy=e.clientY-lastLY;
    lastLX=e.clientX; lastLY=e.clientY;
    if(draggingLig) ligMove(dx, dy); else ligRotate(dx, dy);
    e.preventDefault(); e.stopPropagation(); return;
  }
}, true);
window.addEventListener('mouseup', e=>{
  camInteracting=false;   // camera released → gameplay loop resumes on its next tick
  if(panning){ panning=false; e.stopPropagation(); }
  if(draggingLig||rotatingLig){ draggingLig=rotatingLig=false; el('viewer').style.cursor='grab'; e.stopPropagation(); }
}, true);
// don't pop the context menu when right-dragging to rotate the molecule
el('viewer').addEventListener('contextmenu', e=>e.preventDefault());
// grab-cursor affordance: shows the molecule is draggable when you hover it
el('viewer').addEventListener('mousemove', e=>{
  if(infoMode || panning || draggingLig || rotatingLig) return;
  const r=el('viewer').getBoundingClientRect();
  el('viewer').style.cursor = ligHit(e.clientX-r.left, e.clientY-r.top) ? 'grab' : '';
});

/* ---------- TOUCH CONTROLS ----------
   A gesture scheme without conflicts:
     one finger ON THE MOLECULE  → the active mode (#modeBar): move / rotate / depth
     one finger ON THE BACKGROUND→ camera orbit, done by 3Dmol (not intercepted)
     two or more fingers         → camera zoom / pan, done by 3Dmol
   3Dmol listens for touch* on its own canvas and maps them onto its mouse
   handlers, so "not intercepting" simply means not calling stopPropagation.
   We listen on #viewer in the CAPTURE phase, i.e. before the canvas, and
   swallow the event only when we take the molecule ourselves.

   camInteracting is raised on any touch: without it animate() does not freeze
   during a touch rotation and keeps rebuilding shapes on top of 3Dmol's render
   every 45ms — that was the cause of the stutter. */
let touchId = null, lastTX = 0, lastTY = 0;

el('viewer').addEventListener('touchstart', e=>{
  if(!viewer) return;
  camInteracting = true;                       // any touch = the scene is busy
  if(e.touches.length !== 1) return;           // two fingers → 3Dmol pinch/pan
  const tp = e.touches[0], r = el('viewer').getBoundingClientRect();
  const mx = tp.clientX - r.left, my = tp.clientY - r.top;
  if(infoMode){ studyTap(mx, my); return; }    // study mode: a tap means "what is this?"
  // coach intro steps: the molecule is not in play yet, any gesture orbits the camera
  if(coachActive && coachStep < 3) return;
  if(!ligHit(mx, my)) return;                  // missed the molecule → camera orbit
  touchId = tp.identifier; lastTX = tp.clientX; lastTY = tp.clientY;
  if(touchMode === 'rotate')     rotatingLig = true;
  else if(touchMode === 'depth') depthLig    = true;
  else                           draggingLig = true;
  e.preventDefault(); e.stopPropagation();
}, {passive:false, capture:true});

el('viewer').addEventListener('touchmove', e=>{
  if(touchId === null) return;
  let tp = null;
  for(const x of e.touches) if(x.identifier === touchId) tp = x;
  if(!tp) return;
  const dx = tp.clientX - lastTX, dy = tp.clientY - lastTY;
  lastTX = tp.clientX; lastTY = tp.clientY;
  if(draggingLig)      ligMove(dx, dy);
  else if(rotatingLig) ligRotate(dx, dy);
  else if(depthLig)    ligDepth(dy);
  e.preventDefault(); e.stopPropagation();
}, {passive:false, capture:true});

function endTouch(e){
  camInteracting = e.touches.length > 0;       // fingers left → the camera is still busy
  if(touchId !== null){
    touchId = null;
    draggingLig = rotatingLig = depthLig = false;
    e.stopPropagation();
  }
}
el('viewer').addEventListener('touchend',    endTouch, {passive:true, capture:true});
el('viewer').addEventListener('touchcancel', endTouch, {passive:true, capture:true});
