/* ============================================================
   LEVELS — real cancer targets from the PDB.
   ------------------------------------------------------------
   Only the STRUCTURE of a level lives here. All text (name,
   subtitle, blurb, drug name, pocket label, mutation hints) lives
   in the dictionaries js/lang-*.js under the keys levels.<id>.*
   and hotspot.<id>.<resi> — see the levelName() and hotspotText()
   helpers in js/i18n.js.

   pdb    — the 4-character structure id, downloaded on the fly.
   pocket — how to find the "pocket" (the docking target):
     {type:'elem', value:'ZN'}  — by chemical element (an ion);
     {type:'resn', value:'STI'} — by residue/ligand name;
     {type:'auto'}              — automatically: the largest bound
                                  ligand (the real drug in the
                                  crystal), else a surface pocket.
   open:true — an "open problem": no drug exists yet for anyone,
               there is no reference, the level is never "solved".
   hotspots  — whether the level has a table of frequent cancer
               mutations (texts come from hotspot.<id>.<resi>).
   ============================================================ */
const LEVELS = [
  { id:'p53',       pdb:'1TUP', open:false, hotspots:true,
    pocket:{type:'elem', value:'ZN'} },

  { id:'bcrabl',    pdb:'2HYY', open:false, hotspots:false,
    pocket:{type:'auto'} },

  { id:'egfr',      pdb:'1M17', open:false, hotspots:false,
    pocket:{type:'auto'} },

  { id:'kras_g12c', pdb:'6OIM', open:false, hotspots:false,
    pocket:{type:'auto'} },

  // ---------- OPEN PROBLEMS: no drug exists yet for anyone ----------
  { id:'myc',       pdb:'1NKP', open:true,  hotspots:false,
    pocket:{type:'auto'} },

  { id:'ras_wt',    pdb:'5P21', open:true,  hotspots:false,
    pocket:{type:'auto'} },
];

// p53 residue numbers that have mutation hints in the dictionaries
const P53_HOTSPOT_RESI = [175, 176, 179, 238, 242, 245, 248, 249, 273, 282];
