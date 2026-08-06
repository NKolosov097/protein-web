/* ============================================================
   I18N — RU / EN bilingual runtime
   ------------------------------------------------------------
   Flat dictionaries (js/lang-en.js, js/lang-ru.js) plus t() with
   {{name}} interpolation. Static text in index.html is tagged with
   data-i18n / data-i18n-html / data-i18n-title and expanded by
   applyI18n(); dynamic text is built through t().

   Project rule: NEW user-facing strings go into BOTH dictionaries.
   A missing key does not stay silent — t() returns the key itself
   and warns in the console, so the hole shows up immediately, and
   the ?selftest check catches dictionaries drifting apart.
   ============================================================ */

/* Pure function, hence checked in selftest.js.
   An explicit choice by the player (pd_lang) wins over everything.
   Otherwise the browser language decides: an ru prefix → Russian,
   EVERYTHING else → English. */
function pickLang(saved, navLang){
  if(saved === 'ru' || saved === 'en') return saved;
  return /^ru\b/i.test(navLang || '') ? 'ru' : 'en';
}
function detectLang(){
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return pickLang(localStorage.getItem('pd_lang'), nav);
}

const I18N = { en: I18N_EN, ru: I18N_RU };
let LANG = detectLang();

function t(key, vars){
  const d = I18N[LANG] || I18N.en;
  let s = d[key];
  if(s == null){
    console.warn('[i18n] missing key: ' + key + ' (' + LANG + ')');
    return key;
  }
  if(vars) s = s.replace(/\{\{(\w+)\}\}/g, (m, k)=> vars[k] != null ? String(vars[k]) : m);
  return s;
}
function numFmt(n){ return Number(n).toLocaleString(LANG === 'ru' ? 'ru-RU' : 'en-US'); }

/* ---------- level text ----------
   levels-data.js keeps the structure only; everything readable is here. */
function levelName(L){        return L ? t('levels.' + L.id + '.name')        : ''; }
function levelSub(L){         return L ? t('levels.' + L.id + '.sub')         : ''; }
function levelBlurb(L){       return L ? t('levels.' + L.id + '.blurb')       : ''; }
function levelPocketLabel(L){ return L ? t('levels.' + L.id + '.pocketLabel') : t('pocket.default'); }
// an empty string means no real drug exists for this target
function levelDrug(L){        return L ? t('levels.' + L.id + '.drug')        : ''; }
// hint about a frequent cancer mutation in residue resi, or null
function hotspotText(levelId, resi){
  const d = I18N[LANG] || I18N.en;
  const k = 'hotspot.' + levelId + '.' + resi;
  return d[k] != null ? d[k] : null;
}

/* expand the static text. root is an optional container (needed when a
   modal has just re-rendered its own contents) */
function applyI18n(root){
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(n=>{ n.textContent = t(n.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(n=>{ n.innerHTML = t(n.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-title]').forEach(n=>{ n.title = t(n.dataset.i18nTitle); });
}

/* Repaint every piece of text NOT covered by data-i18n: the captions of the
   stateful buttons, the level heading, the 3D labels, the score, the
   leaderboard, any open modal and the current coach line. The level is NOT
   reloaded — the PDB structure and the molecule's pose stay where they are. */
function refreshDynamicText(){
  // button captions that depend on state
  syncSolveBtn();
  syncInfoBtn();
  syncQualityBtn();
  syncModeBar();
  syncScore();
  el('btnSound').title = t(soundOn ? 'btn.sound.on' : 'btn.sound.off');

  // level heading, mission line, pocket label
  if(LEVEL){
    syncLevelText();
    POCKET_LABEL = levelPocketLabel(LEVEL);
  }

  // leaderboard (number formatting and the "BEST" caption)
  loadLeaderboard();

  // open modals are re-rendered in place
  if(el('levels').classList.contains('show')) renderLevels();
  if(el('tut').classList.contains('show'))    renderTut();
  coachRefreshBubble();

  // the 3D labels are cached (see syncLabels in scene.js), so they have to be
  // dropped and left for draw() to recreate them in the new language
  if(viewer && !infoMode){
    try{ viewer.removeAllLabels(); }catch(e){}
    resetLabels();
    resetDrawState();
  }
  // in study mode the target label is its own, recreated by study.js
  if(viewer && infoMode){
    removeStudyTarget();
    addStudyTarget();
  }
}

function setLang(code){
  if(code !== 'ru' && code !== 'en') return;
  LANG = code;
  localStorage.setItem('pd_lang', code);
  document.documentElement.lang = code;
  applyI18n();
  refreshDynamicText();
  syncLangMenu();
}

/* ---------- the 🌐 dropdown ---------- */
function syncLangMenu(){
  el('langMenu').querySelectorAll('button').forEach(b=>{
    b.classList.toggle('on', b.dataset.lang === LANG);
  });
}
el('btnLang').onclick = e=>{
  e.stopPropagation();
  el('langMenu').classList.toggle('show');
};
el('langMenu').querySelectorAll('button').forEach(b=>{
  b.onclick = ()=>{ setLang(b.dataset.lang); el('langMenu').classList.remove('show'); };
});
// a click outside closes the list
document.addEventListener('click', e=>{
  if(!el('langWrap').contains(e.target)) el('langMenu').classList.remove('show');
});

document.documentElement.lang = LANG;
syncLangMenu();
applyI18n();

/* ---------- dictionary parity (used by ?selftest) ----------
   Flat dictionaries drift apart easily when a string is added to one and
   forgotten in the other. t() already warns in the console, but this check
   catches the divergence before a player ever sees it. */
function i18nKeyParity(){
  return {
    missingRu: Object.keys(I18N_EN).filter(k => !(k in I18N_RU)).sort(),
    missingEn: Object.keys(I18N_RU).filter(k => !(k in I18N_EN)).sort(),
  };
}
// every key referenced from the index.html markup
function i18nMarkupKeys(){
  const out = [];
  document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-title]').forEach(n=>{
    ['i18n','i18nHtml','i18nTitle'].forEach(a=>{ if(n.dataset[a]) out.push(n.dataset[a]); });
  });
  return out;
}
