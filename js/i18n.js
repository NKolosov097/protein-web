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

/* expand the static text. root is an optional container (needed when a
   modal has just re-rendered its own contents) */
function applyI18n(root){
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(n=>{ n.textContent = t(n.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(n=>{ n.innerHTML = t(n.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-title]').forEach(n=>{ n.title = t(n.dataset.i18nTitle); });
}

/* filled in Task 16: repaint of all dynamic text
   (titles, 3D labels, open modals, the leaderboard) */
function refreshDynamicText(){}

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
