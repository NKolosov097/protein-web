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
}

if(SELFTEST){
  window.addEventListener('load', ()=>{
    stPass = 0; stFail = 0;
    runSelfTest();
    console.log('--- selftest: ' + stPass + ' passed, ' + stFail + ' failed ---');
  });
}
