/* ============================================================
   MOBILE UI SHELL
   ------------------------------------------------------------
   Behaviour of the mobile-only layout elements (see css/mobile.css):
     ☰            → bottom sheet with the secondary buttons
     🏆 ЛИДЕРЫ    → the #lb panel shown as a modal (hidden on phones)
     #modeBar     → what a finger dragged across the molecule does
   The touch handling itself lives in controls.js next to the mouse
   code, so the move/trackball math is never duplicated.
   ============================================================ */

/* ---------- bottom sheet ---------- */
function openSheet(){
  el('actionsRest').classList.add('open');
  el('sheetBack').classList.add('show');
}
function closeSheet(){
  el('actionsRest').classList.remove('open');
  el('lb').classList.remove('asModal');
  el('sheetBack').classList.remove('show');
}
el('btnMenu').onclick = ()=>{
  el('actionsRest').classList.contains('open') ? closeSheet() : openSheet();
};
el('sheetBack').onclick = closeSheet;
// any action from the sheet closes it — otherwise the sheet stays over the scene
el('actionsRest').querySelectorAll('button').forEach(b=>{
  if(b.id === 'btnBoard' || b.id === 'btnQuality') return;   // board opens a modal, quality reloads
  b.addEventListener('click', closeSheet);
});

/* ---------- leaderboard as a modal ---------- */
el('btnBoard').onclick = ()=>{
  loadLeaderboard();                       // pull a fresh table and record
  if(el('lb').style.display === 'none' || !getBoard().length){
    showToast(t('toast.boardEmpty'));
    closeSheet();
    return;
  }
  el('actionsRest').classList.remove('open');
  el('lb').classList.add('asModal');
  el('sheetBack').classList.add('show');   // a tap on the scrim closes it
};

/* ---------- mode switcher ---------- */
function syncModeBar(){
  el('modeBar').querySelectorAll('button').forEach(b=>{
    b.classList.toggle('on', b.dataset.mode === touchMode);
  });
}
el('modeBar').querySelectorAll('button').forEach(b=>{
  b.onclick = ()=>{ touchMode = b.dataset.mode; syncModeBar(); };
});
syncModeBar();

/* ---------- graphics-quality button ----------
   Wired here rather than in perf.js: its caption goes through t(), and
   perf.js is loaded before i18n.js (it has to cap devicePixelRatio early). */
el('btnQuality').onclick = ()=> setQualityPref(nextQualityPref(QUALITY_PREF));
syncQualityBtn();
