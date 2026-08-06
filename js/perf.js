/* ============================================================
   PERF — graphics quality profile.
   ------------------------------------------------------------
   One profile per session: 'low' (phones and weak GPUs) or 'high'
   (what the game always did). The player's preference lives in
   localStorage under 'pd_quality' and is 'auto' | 'low' | 'high'.

   This file is loaded RIGHT AFTER state.js, because the
   devicePixelRatio cap is applied here at load time — i.e. safely
   before createViewer() runs inside init() (main.js).
   ============================================================ */

// coarse pointer (a finger) — the main tell of a phone/tablet
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

// Pure function, so selftest.js can check it: an explicit choice by the
// player wins over everything, otherwise the pointer type decides.
function resolveQuality(saved, coarse){
  if(saved === 'low' || saved === 'high') return saved;
  return coarse ? 'low' : 'high';
}

let QUALITY_PREF = localStorage.getItem('pd_quality') || 'auto';
if(QUALITY_PREF !== 'auto' && QUALITY_PREF !== 'low' && QUALITY_PREF !== 'high') QUALITY_PREF = 'auto';
let QUALITY = resolveQuality(QUALITY_PREF, IS_TOUCH);
function qLow(){ return QUALITY === 'low'; }

/* ---------- devicePixelRatio cap ----------
   3Dmol has no pixel-ratio API: the build has no setPixelRatio and
   Renderer.setSize reads window.devicePixelRatio directly. So the only
   way is to shadow the getter BEFORE the viewer is created. On a phone
   with DPR 3 this cuts the frame area by 4×. */
const DPR_CAP = 1.5;
if(qLow()){
  const real = window.devicePixelRatio || 1;
  if(real > DPR_CAP){
    try{
      Object.defineProperty(window, 'devicePixelRatio', { get: ()=>DPR_CAP, configurable: true });
    }catch(e){
      console.warn('[perf] could not cap devicePixelRatio:', e);
    }
  }
}

/* options for $3Dmol.createViewer: on 'low' — coarser ribbons, no antialiasing */
function viewerOptions(){
  const o = { backgroundColor: 0x05060f };
  if(qLow()){ o.cartoonQuality = 3; o.antialias = false; }
  return o;
}

/* changing the preference. The DPR cap and cartoonQuality only take effect when
   the viewer is created, so the honest way to apply them is a reload; the PDB
   structure is in the browser cache by then, so it comes back quickly. */
function setQualityPref(pref){
  if(pref !== 'auto' && pref !== 'low' && pref !== 'high') return;
  localStorage.setItem('pd_quality', pref);
  location.reload();
}

/* ---------- the graphics-quality button ----------
   Cycles auto → low → high → auto. The caption shows the current
   preference and, for auto, what it picked on this device.
   The caption goes through t(), and i18n.js is loaded AFTER this file
   (perf.js has to run early for the devicePixelRatio cap), so the
   initial wiring lives at the end of js/mobile.js, not here. */
function nextQualityPref(pref){
  if(pref === 'auto') return 'low';
  if(pref === 'low')  return 'high';
  if(pref === 'high') return 'auto';
  return 'low';
}
function syncQualityBtn(){
  const b = el('btnQuality');
  if(!b) return;
  const name = QUALITY_PREF === 'auto'
    ? t('quality.auto', {resolved: t(qLow() ? 'quality.lowWord' : 'quality.highWord')})
    : t(QUALITY_PREF === 'low' ? 'quality.low' : 'quality.high');
  b.textContent = t('btn.quality', {name});
}
