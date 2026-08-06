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
}

if(SELFTEST){
  window.addEventListener('load', ()=>{
    stPass = 0; stFail = 0;
    runSelfTest();
    console.log('--- selftest: ' + stPass + ' passed, ' + stFail + ' failed ---');
  });
}
