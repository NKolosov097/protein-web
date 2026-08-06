/* ============================================================
   PROTEIN DOCKER — shared state
   ------------------------------------------------------------
   Every JS file on the page is a plain (classic) <script>, so all
   top-level declarations here live in one shared global scope and
   are visible to the other modules. This file only holds the
   cross-cutting game state + the tiny $-style DOM helper; feature
   modules keep their own local state next to the code that uses it.
   Loaded FIRST (see index.html), so `el` and this state exist before
   any other module registers a handler or runs its startup code.
   ============================================================ */

const el = id => document.getElementById(id);

let viewer, proteinAtoms = [], hoverAtoms = [], pocket = null, SURF = null;
// protein atoms near the pocket — used by the shape-contact scoring (see fitEnergy)
let POCKET_ATOMS = [];
let infoMode = false, hoverInfo = null;   // study mode + current tooltip
let CHAIN_STATS = {};                      // per-chain summary (residue count, DNA/protein)
let detailLevel = 'chain';                 // current study detail: 'chain' (far) or 'residue' (close)
// study-mode zoom threshold: at >= this many screen-pixels per Ångström we consider the
// view "close" and switch from whole-ribbon view to individual-amino-acid view
const CLOSE_PXA = 15;

// ligand state (the small "drug" molecule)
const lig = { x:0, y:0, z:35, rx:0, ry:0, rz:0 };
// "show solution" ghost: the ideal pose for the current level (computed on demand), and
// whether it is currently displayed. It is a SEPARATE body — not the molecule you control.
let solutionPose = null, showSolution = false;
// local coordinates of the ligand atoms (a simple molecule ~ benzene ring + tail)
const LIG_LOCAL = [
  {x: 0.0, y: 1.4, z:0, c:'#22e0ff'},
  {x: 1.2, y: 0.7, z:0, c:'#22e0ff'},
  {x: 1.2, y:-0.7, z:0, c:'#22e0ff'},
  {x: 0.0, y:-1.4, z:0, c:'#a15bff'},
  {x:-1.2, y:-0.7, z:0, c:'#22e0ff'},
  {x:-1.2, y: 0.7, z:0, c:'#22e0ff'},
  {x: 0.0, y: 2.9, z:0, c:'#39ff14'},   // "active group"
];

let score = 0, best = 0, breath = 0;

// current level + docking target (set on load)
let LEVEL = null, LEVEL_IDX = 0, gen = 0, POCKET_LABEL = 'КАРМАН';
let HOTSPOTS = {};   // per-level cancer-mutation hotspots (set on load)
// "ding" on entering the pocket — fires once per boundary crossing (see zoneSound)
let wasInPocket = false;
// true while the CAMERA is being moved (orbit / pan). The animation loop freezes the
// gameplay redraw during this time so it doesn't fight 3Dmol's own render — see animate().
let camInteracting = false;
// the molecule is being dragged with a finger in "depth" mode (see touchMode in controls.js).
// Lives here because it is read both in scene.js (pocketAnimates) and in controls.js.
let depthLig = false;
// what a single finger dragged ACROSS THE MOLECULE does (the #modeBar switcher).
// Written in mobile.js, read in controls.js.
let touchMode = 'move';   // 'move' | 'rotate' | 'depth'

// ---- guided tutorial ("coach") state (see js/coach.js) ----
// A step-driven, in-scene onboarding that flies the camera, blinks objects, draws a magnetic
// track and highlights the test button. Auto-runs on level 1; these flags let draw() (scene.js)
// and the drag handler (controls.js) react to the current coaching step without coach.js having
// to reach into their internals.
let coachActive = false, coachStep = -1;
let coachHidePocket = false, coachHideDrug = false, coachBlinkDrug = false, coachMagnet = false;
let coachTrack = null;   // {a:{x,y,z}, b:{x,y,z}} — straight path "drug start → pocket" for the magnet

// standard residues — everything else (except water) is treated as hetero (ion / small molecule)
const AA_RESN = new Set('ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL MSE SEC'.split(' '));
const DNA_RESN = ['DA','DC','DG','DT','A','C','G','T','U','DU'];
// structural metal ions — coloured gold so the target (e.g. p53's Zn) never looks like water/a drug
const METAL_SEL = {elem:['Zn','Mg','Mn','Fe','Ca','Cu','Ni','Co']};
