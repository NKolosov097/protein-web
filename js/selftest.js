/* ============================================================
   SELF-TEST — a tiny harness for checking the pure functions.
   Runs only with `?selftest` in the URL: open
   index.html?selftest and watch the console. There is no test
   runner in this project (no build step, no npm) — this is its
   stand-in for logic that needs neither DOM nor 3D.
   ============================================================ */
const SELFTEST = /[?&]selftest\b/.test(location.search);
let stPass = 0, stFail = 0;

function stEq(name, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok) stPass++; else stFail++;
  if(ok) console.log('PASS  ' + name);
  else console.error('FAIL  ' + name +
    '\n   got:  ' + JSON.stringify(got) +
    '\n   want: ' + JSON.stringify(want));
}

function runSelfTest(){
  // ---- perf: resolving the quality profile ----
  stEq('resolveQuality: auto + coarse → low',   resolveQuality('auto',  true),  'low');
  stEq('resolveQuality: auto + fine → high',    resolveQuality('auto',  false), 'high');
  stEq('resolveQuality: пусто + coarse → low',  resolveQuality(null,    true),  'low');
  stEq('resolveQuality: пусто + fine → high',   resolveQuality('',      false), 'high');
  stEq('resolveQuality: явный low перебивает',  resolveQuality('low',   false), 'low');
  stEq('resolveQuality: явный high перебивает', resolveQuality('high',  true),  'high');
  stEq('resolveQuality: мусор → как auto',      resolveQuality('bogus', true),  'low');

  // ---- perf: the quality-preference cycle ----
  stEq('nextQualityPref: auto → low',  nextQualityPref('auto'), 'low');
  stEq('nextQualityPref: low → high',  nextQualityPref('low'),  'high');
  stEq('nextQualityPref: high → auto', nextQualityPref('high'), 'auto');
  stEq('nextQualityPref: мусор → low', nextQualityPref('zzz'),  'low');

  // ---- geometry: projecting a point onto a segment (the coach's magnetic track) ----
  const A = {x:0,y:0,z:0}, B = {x:10,y:0,z:0};
  stEq('projectOnSegment: середина',        projectOnSegment({x:5,  y:3, z:0}, A, B), {x:5, y:0, z:0});
  stEq('projectOnSegment: зажим в начало',  projectOnSegment({x:-7, y:2, z:0}, A, B), {x:0, y:0, z:0});
  stEq('projectOnSegment: зажим в конец',   projectOnSegment({x:99, y:0, z:5}, A, B), {x:10,y:0, z:0});
  stEq('projectOnSegment: точка на отрезке',projectOnSegment({x:2,  y:0, z:0}, A, B), {x:2, y:0, z:0});
  stEq('projectOnSegment: вырожденный отрезок',
       projectOnSegment({x:4,y:4,z:4}, {x:1,y:1,z:1}, {x:1,y:1,z:1}), {x:1,y:1,z:1});

  // ---- i18n: language choice on the first visit ----
  stEq('pickLang: сохранён ru',        pickLang('ru',   'en-US'), 'ru');
  stEq('pickLang: сохранён en',        pickLang('en',   'ru-RU'), 'en');
  stEq('pickLang: мусор → браузер',    pickLang('zz',   'ru-RU'), 'ru');
  stEq('pickLang: пусто + ru-RU',      pickLang(null,   'ru-RU'), 'ru');
  stEq('pickLang: пусто + ru',         pickLang(null,   'ru'),    'ru');
  stEq('pickLang: пусто + ru-BY',      pickLang(null,   'ru-BY'), 'ru');
  stEq('pickLang: пусто + en-GB',      pickLang(null,   'en-GB'), 'en');
  stEq('pickLang: пусто + de',         pickLang(null,   'de'),    'en');
  stEq('pickLang: пусто + пусто',      pickLang(null,   ''),      'en');
  stEq('pickLang: "rue" не русский',   pickLang(null,   'rue'),   'en');

  // ---- i18n: interpolation and missing keys ----
  const savedLang = LANG;
  LANG = 'en';
  stEq('t: подстановка',        t('selftest.vars', {name:'p53', n:7}), 'p53 has 7');
  stEq('t: лишние скобки целы', t('selftest.vars', {name:'x'}),        'x has {{n}}');
  stEq('t: нет ключа → ключ',   t('selftest.absent.key'),              'selftest.absent.key');
  stEq('numFmt: en',            numFmt(1234567),                        '1,234,567');
  LANG = 'ru';
  // ru-RU puts a non-breaking or narrow no-break space between groups
  // (U+00A0 / U+202F) — which one depends on the browser, so we compare via a
  // substitution instead of a literal with a plain space (otherwise it flakes)
  stEq('numFmt: ru', numFmt(1234567).replace(/[\s\u00A0\u202F]/g, '_'), '1_234_567');
  LANG = savedLang;

  // ---- i18n: the dictionaries have not drifted apart ----
  const par = i18nKeyParity();
  stEq('i18n: \u043A\u043B\u044E\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 RU', par.missingRu, []);
  stEq('i18n: \u043A\u043B\u044E\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 EN', par.missingEn, []);

  // ---- i18n: every key referenced from the markup exists ----
  stEq('i18n: \u043A\u043B\u044E\u0447\u0438 \u0440\u0430\u0437\u043C\u0435\u0442\u043A\u0438 \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430',
       i18nMarkupKeys().filter(k => !(k in I18N_EN) || !(k in I18N_RU)), []);

  // ---- i18n: every level has a full set of texts ----
  const parts = ['name','sub','drug','pocketLabel','blurb'];
  const gaps = [];
  LEVELS.forEach(L => parts.forEach(p => {
    const k = 'levels.' + L.id + '.' + p;
    if(!(k in I18N_EN) || !(k in I18N_RU)) gaps.push(k);
  }));
  stEq('i18n: \u0443\u0440\u043E\u0432\u043D\u0438 \u0431\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u043E\u0432', gaps, []);

  // ---- i18n: the p53 hotspots are fully translated ----
  const hotGaps = P53_HOTSPOT_RESI.filter(r =>
    !('hotspot.p53.' + r in I18N_EN) || !('hotspot.p53.' + r in I18N_RU));
  stEq('i18n: \u0433\u043E\u0440\u044F\u0447\u0438\u0435 \u0442\u043E\u0447\u043A\u0438 p53 \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430', hotGaps, []);
}

if(SELFTEST){
  window.addEventListener('load', ()=>{
    stPass = 0; stFail = 0;
    runSelfTest();
    console.log('--- selftest: ' + stPass + ' passed, ' + stFail + ' failed ---');
  });
}
