# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Protein Docker** — a browser game where the player steers a small "drug" molecule into the
functional pocket of a real cancer-target protein (loaded live from the PDB) rendered in 3D via
[3Dmol.js](https://3Dmol.org). It measures the fit, scores it, and celebrates. The UI is
**bilingual (English / Russian)**: every user-facing string lives in `js/lang-en.js` and
`js/lang-ru.js` — add new ones to **both**, never as a literal in a module. Plays on desktop
and on phones. Deployed as a static site to GitHub Pages.

## Running & tooling

There is **no build step, no bundler, no linter, and no package.json.** The frontend is plain
static files. There is no test runner either — instead `js/selftest.js` checks the pure functions
(quality profile, language detection, `t()` substitution, segment projection, dictionary parity)
when the page is opened with `?selftest` in the URL: `index.html?selftest`, results in the console.
Run it after any change to those areas.

- **Run the game:** open `index.html` directly in a browser, or serve the folder
  (`python -m http.server`) and open it. An **internet connection is required** — `3Dmol-min.js`
  is loaded from a CDN and every level downloads its PDB structure from the network at runtime.
- **Optional backend** (`backend/server.py`, FastAPI) is **off by default** and not needed to play.
  To enable it, flip `const engine` in `js/hud.js` from `'learn'` to `'vina'`, then:
  ```
  cd backend
  pip install fastapi uvicorn
  python -m uvicorn server:app --reload --port 8000
  ```
  Use `python -m uvicorn`, not bare `uvicorn` (the launcher is often not on PATH).

## Architecture

### Single shared global scope — load order is load-bearing

Every file in `js/` is a **classic `<script>`, not an ES module.** There are no `import`/`export`
statements; all top-level `const`/`let`/`function` declarations live in **one shared global scope**
and call each other by bare name. `index.html` loads them in strict dependency order (see the
comment block there). The two anchors:

- `js/state.js` loads **first** — it defines the DOM helper `el()` and all cross-cutting mutable
  globals (`viewer`, `lig`, `pocket`, `LEVEL`, `score`, `touchMode`, the `coach*` flags, etc.).
  `perf.js`, the two dictionaries and `i18n.js` follow immediately, because every later module
  calls `t()` at load time. Full order:
  `state → perf → lang-en → lang-ru → i18n → levels-data → geometry → scoring → scene →
  controls → study → hud → tutorial → levels → coach → mobile → selftest → main`.
- `js/main.js` loads **last** — its only job is to call `init()`.

Feature modules keep their own local state next to their code; only genuinely cross-cutting state
lives in `state.js`. When adding a file, insert its `<script>` tag at the right point in the
dependency chain in `index.html`.

### Module responsibilities

- `scene.js` — 3Dmol setup (`init`), level loading (`loadLevel` → `onModelLoaded`), the surface,
  cached labels, the per-frame gameplay render (`draw`), and the `requestAnimationFrame` loop.
- `controls.js` — keyboard nudges, direct **mouse and touch** manipulation of the ligand
  (grab/rotate/depth) and cursor-anchored wheel zoom. Both input paths go through the same
  `ligMove` / `ligRotate` / `ligDepth`, so mouse and finger behave identically. Movement is
  **camera-relative** via `camBasis()`. On touch, one finger on the molecule drives the mode
  selected in `#modeBar`, one finger on the background orbits the camera (3Dmol's own handling),
  two fingers zoom.
- `geometry.js` — pure math: vectors, Euler↔matrix, and `camBasis()` (world-space right/up/fwd
  derived from the live camera, used everywhere for screen-relative movement).
- `scoring.js` — `findPocket()` (per-level docking target), `buildPocketAtoms()`, `fitEnergy()`
  (the binding-energy model), `solveBestPose()` (the hint pose), and `quality()` (energy → meter
  color/status/hint).
- `study.js` — "ИЗУЧЕНИЕ" hover-to-learn mode; manages its own highlighting, tooltip, and a
  zoom-based detail level (whole-chain when zoomed out, single residue when zoomed in).
- `hud.js` — the action buttons, drug-test scoring flow, toast/fireworks, WebAudio blips, and the
  localStorage leaderboard.
- `levels-data.js` — the `LEVELS` array: **structure only** (id, `pdb`, `open`, pocket strategy).
  All level text lives in the dictionaries under `levels.<id>.*` and `hotspot.<id>.<resi>`.
- `perf.js` — the graphics quality profile (`QUALITY` = `low` on touch devices, `high` otherwise;
  `pd_quality` overrides it). Owns the `devicePixelRatio` cap, `viewerOptions()` and the
  ⚙ ГРАФИКА button. Must load early: the DPR cap has to be in place before `createViewer`.
- `i18n.js` + `lang-en.js` / `lang-ru.js` — the translation runtime (`t()`, `numFmt()`,
  `applyI18n()`, `setLang()`, `refreshDynamicText()`) and the two flat dictionaries.
- `mobile.js` — the mobile UI shell: bottom sheet (☰), leaderboard modal, ligand mode switcher.
- `selftest.js` — the `?selftest` harness.
- `levels.js` — level picker UI + progress/unlock logic.
- `tutorial.js` — the static "ОБ ИГРЕ" reference decks (tabbed modal).
- `coach.js` — the dynamic in-scene onboarding that runs on level 1 (camera flights, magnetic
  track, blinking objects, and the level-cleared modal with an offscreen 3D preview of the next target).

### Levels and pocket finding

To add/change a level, edit the `LEVELS` array in `js/levels-data.js` — usually just a 4-letter
`pdb` id. Each level declares how to locate its docking pocket via `pocket`:
`{type:'elem', value:'ZN'}` (an ion), `{type:'resn', value:'STI'}` (a named ligand), or
`{type:'auto'}` (the largest non-cofactor bound ligand — i.e. the real crystallized drug — falling
back to a surface-pocket heuristic for `open:true` targets that have no drug). `findPocket()` in
`scoring.js` implements these.

### Scoring model is duplicated in two languages — keep them in sync

`fitEnergy()` in `js/scoring.js` (JS) and `contact_affinity()` in `backend/server.py` (Python)
implement the **same** shape-contact binding formula intentionally, so the browser and the server
produce identical numbers. If you change one, change the other to match. (The backend also has a
real AutoDock Vina path, currently gated behind missing `.pdbqt` receptors and off by default.)

### Conventions worth knowing

- **`gen` (generation counter):** `loadLevel()` bumps the global `gen`; async work (PDB downloads,
  the animation loop) captures `myGen` and bails when `myGen !== gen`. This is how switching levels
  cancels a stale in-flight load or a previous render loop. Preserve this guard in any new async path.
- **Camera state via 3Dmol view vectors:** `viewer.getView()`/`setView()` return/accept
  `[cx, cy, cz, rotationRadius, qx, qy, qz, qw]` (last four = rotation quaternion). `coach.js` uses
  this to compute a target view instantly, snap back, then interpolate (slerp the quaternion). To
  reset orientation, force the quaternion to identity `[0,0,0,1]`. `zoomTo()` recenters on the
  **protein centroid**, which is *not* the pocket — to center the target, measure its screen
  position with `modelToScreen()` and `translate()` it to the middle (see `recenter()` in `coach.js`
  and the framing block in `onModelLoaded`).
- **Dirty-render:** `draw()` runs its cheap half every tick (distance, energy, meter, sound, coach
  auto-advance) but rebuilds the ~20 ligand/target shapes and calls `viewer.render()` only when the
  frame actually changed — see `drawKey()`/`pocketAnimates()` in `scene.js`. Call
  `resetDrawState()` whenever the scene is rebuilt from outside (new level, language switch,
  leaving study mode), or the next frame will be considered unchanged and skipped.
- **`camInteracting` must be set from every input path.** It is what stops the gameplay loop from
  fighting 3Dmol's own render while the camera moves. It was missing on touch, and that alone was
  the mobile stutter.

### Persistence (localStorage)

All progress is client-side: `pd_last_level` (auto-resume), `pd_levels` (per-level attempted/solved/
best energy), `pd_board` (leaderboard), `pd_score_seen` (first-test explainer flag),
`pd_lang` (`en`/`ru`; absent → browser language, everything but a `ru` prefix falls back to `en`),
`pd_quality` (`auto`/`low`/`high`; changing it reloads the page, because the DPR cap and
`cartoonQuality` only apply at viewer creation).
