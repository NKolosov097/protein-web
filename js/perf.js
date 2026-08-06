/* ============================================================
   PERF — профиль качества графики.
   ------------------------------------------------------------
   Один профиль на сессию: 'low' (телефоны и слабые GPU) или
   'high' (как было). Предпочтение игрока живёт в localStorage
   под 'pd_quality' и может быть 'auto' | 'low' | 'high'.

   Файл грузится СРАЗУ ПОСЛЕ state.js, потому что кап
   devicePixelRatio применяется здесь же, на загрузке — то есть
   заведомо раньше createViewer() внутри init() (main.js).
   ============================================================ */

// грубый указатель (палец) — основной признак телефона/планшета
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

// Чистая функция, поэтому её можно проверить в selftest.js:
// явный выбор игрока перебивает всё, иначе решает тип указателя.
function resolveQuality(saved, coarse){
  if(saved === 'low' || saved === 'high') return saved;
  return coarse ? 'low' : 'high';
}

let QUALITY_PREF = localStorage.getItem('pd_quality') || 'auto';
if(QUALITY_PREF !== 'auto' && QUALITY_PREF !== 'low' && QUALITY_PREF !== 'high') QUALITY_PREF = 'auto';
let QUALITY = resolveQuality(QUALITY_PREF, IS_TOUCH);
function qLow(){ return QUALITY === 'low'; }

/* ---------- кап devicePixelRatio ----------
   У 3Dmol нет API для пиксельного отношения: в сборке нет
   setPixelRatio, а Renderer.setSize читает window.devicePixelRatio
   напрямую. Поэтому единственный путь — подменить геттер ДО
   создания вьюера. На телефоне с DPR 3 это срезает площадь кадра
   в 4 раза. */
const DPR_CAP = 1.5;
if(qLow()){
  const real = window.devicePixelRatio || 1;
  if(real > DPR_CAP){
    try{
      Object.defineProperty(window, 'devicePixelRatio', { get: ()=>DPR_CAP, configurable: true });
    }catch(e){
      console.warn('[perf] не удалось ограничить devicePixelRatio:', e);
    }
  }
}

/* опции для $3Dmol.createViewer: на 'low' грубее ленты и без сглаживания */
function viewerOptions(){
  const o = { backgroundColor: 0x05060f };
  if(qLow()){ o.cartoonQuality = 3; o.antialias = false; }
  return o;
}

/* смена предпочтения. Кап DPR и cartoonQuality применяются только при
   создании вьюера, поэтому честный способ применить их — перезагрузка;
   структура PDB к этому моменту уже в кэше браузера, так что это быстро. */
function setQualityPref(pref){
  if(pref !== 'auto' && pref !== 'low' && pref !== 'high') return;
  localStorage.setItem('pd_quality', pref);
  location.reload();
}
