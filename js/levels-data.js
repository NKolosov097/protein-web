/* ============================================================
   LEVELS — real cancer targets from the PDB.
   Each structure is downloaded by its own 4-character PDB id
   (like p53 · 1TUP was before). If some id fails to load, the
   game shows an error and returns to the level picker — then it's
   enough to fix the `pdb` field below.

   pocket: how to find the "pocket" (the docking target):
     {type:'elem', value:'ZN'}  — by chemical element (an ion);
     {type:'resn', value:'STI'} — by residue/ligand name;
     {type:'auto'}              — automatically: the largest bound
                                  ligand (the real drug in the
                                  crystal), else the protein centre.
   open:true  — an "open problem": no drug exists yet, no reference,
                the level is never marked "solved".
   ============================================================ */
// p53 "hotspots" (frequent cancer mutations) — for level 1 only
const P53_HOTSPOTS = {
  175:'Arg175 — САМАЯ частая раковая мутация p53. Держит укладку домена у цинка.',
  176:'Cys176 — удерживает ион цинка (структурный центр).',
  179:'His179 — координирует цинк.',
  238:'Cys238 — координирует цинк.',
  242:'Cys242 — координирует цинк.',
  245:'Gly245 — горячая точка мутаций, критична для укладки белка.',
  248:'Arg248 — НАПРЯМУЮ читает ДНК в большой бороздке. Частая мутация в раке.',
  249:'Arg249 — структурная горячая точка (часто мутирует при раке печени).',
  273:'Arg273 — ключевой контакт с остовом ДНК. Одна из главных раковых мутаций.',
  282:'Arg282 — стабилизирует ДНК-связывающую поверхность.',
};
const LEVELS = [
  { id:'p53', name:'p53', pdb:'1TUP', sub:'«страж генома»', open:false,
    drug:null, pocket:{type:'elem', value:'ZN', label:'КАРМАН (Zn)'},
    hotspots:P53_HOTSPOTS,
    blurb:'p53 сломан более чем в половине всех опухолей. Цель — структурный ион цинка (Zn²⁺), на котором держится укладка белка.' },

  { id:'bcrabl', name:'BCR-ABL', pdb:'2HYY', sub:'иматиниб · Гливек®', open:false,
    drug:'Иматиниб (Гливек®)', pocket:{type:'auto', label:'КАРМАН (сайт иматиниба)'},
    blurb:'Слитый белок BCR-ABL «залипает» во включённом состоянии и вызывает лейкоз. Гливек садится в его АТФ-карман — первый громкий успех точечной терапии. Карман показан по реальному лекарству в структуре.' },

  { id:'egfr', name:'EGFR', pdb:'1M17', sub:'эрлотиниб · Тарцева®', open:false,
    drug:'Эрлотиниб (Тарцева®)', pocket:{type:'auto', label:'КАРМАН (сайт эрлотиниба)'},
    blurb:'Мутантный EGFR гонит клетки лёгкого делиться без остановки. Эрлотиниб блокирует его киназный карман. Цель — по реальной молекуле лекарства в структуре 1M17.' },

  { id:'kras_g12c', name:'KRAS G12C', pdb:'6OIM', sub:'соторасиб · 2021', open:false,
    drug:'Соторасиб (AMG 510)', pocket:{type:'auto', label:'КАРМАН (сайт соторасиба)'},
    blurb:'KRAS 40 лет считался «недоступным». В 2021-м соторасиб впервые связал мутант G12C — настоящий прорыв. Карман — по реальному лиганду в структуре.' },

  // ---------- OPEN PROBLEMS: no drug exists yet for anyone ----------
  { id:'myc', name:'MYC', pdb:'1NKP', sub:'🔬 открытая задача', open:true,
    drug:null, pocket:{type:'auto', label:'ПОВЕРХНОСТЬ MYC'},
    blurb:'MYC разгоняет рост огромного числа опухолей, но у него нет удобного кармана — прямого лекарства не существует до сих пор. Это «святой Грааль» онкологии. Эталона нет: любой твой результат — поиск на переднем крае науки.' },

  { id:'ras_wt', name:'RAS (дикий тип)', pdb:'5P21', sub:'🔬 открытая задача', open:true,
    drug:null, pocket:{type:'auto', label:'ПОВЕРХНОСТЬ RAS'},
    blurb:'Обычный (немутантный) RAS из семейства KRAS/HRAS — гладкий и «скользкий», зацепиться почти негде. Большинство форм RAS до сих пор недоступны для лекарств. Эталона нет: ищи, куда «прицепить» ключ.' },
];
