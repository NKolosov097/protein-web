# 🧬 Protein Docker — a "drug-fitting" game

**▶️ [PLAY ONLINE](https://NKolosov097.github.io/protein-web/)**

A browser game featuring **real cancer-target proteins** (loaded live from the PDB) rendered
in 3D. You steer a small drug-like molecule toward each protein's functional pocket; the game
measures the contact, awards points, and celebrates with sound and fireworks.

The interface is **bilingual — English / Русский**. Switch any time with the **🌐** button in the
header; the choice is remembered. On a first visit the language follows your browser (a `ru`
prefix gives Russian, everything else falls back to English).

It also **plays on a phone**. One finger on the molecule performs whatever mode is selected in the
bottom bar — **✋ ДВИГАТЬ / 🔄 ВРАЩАТЬ / ↕ ГЛУБИНА** (move / rotate / depth); one finger on the
background spins the structure; two fingers zoom. The rest of the buttons live behind **☰**.

## Levels (🗂 УРОВНИ)

Six real targets. Pick one from the **🗂 УРОВНИ** screen; each solved *druggable* target gets a
✔ and unlocks the next druggable one. The two **open problems** — proteins with *no known drug
yet* — are **unlocked from the start** and are never "solved": there is no reference answer to
beat, only your personal best (framed as a real contribution to unsolved science).

| # | Target | PDB | Pocket | Status |
|---|---|---|---|---|
| 1 | p53 — "guardian of the genome" | 1TUP | zinc site (Zn²⁺) | ✔ druggable |
| 2 | BCR-ABL | 2HYY | imatinib (Gleevec®) site | ✔ druggable |
| 3 | EGFR | 1M17 | erlotinib (Tarceva®) site | ✔ druggable |
| 4 | KRAS G12C | 6OIM | sotorasib (AMG 510) site, 2021 | ✔ druggable |
| 5 | MYC | 1NKP | protein surface | 🔬 **open problem** |
| 6 | RAS (wild type) | 5P21 | nucleotide site | 🔬 **open problem** |

The docking pocket is found automatically per level: an explicit ion (p53's zinc), or the
largest **bound ligand** in the crystal — i.e. the *actual real drug* — skipping common
cofactors/ions (GDP, Mg²⁺, water…). For the open targets, which carry no drug, the pocket
falls back to the protein's centre / nucleotide site. To add or change a level, edit the
`LEVELS` array in `js/levels-data.js` (usually just a 4-letter PDB code) — it holds the structure
only; the level's name, subtitle and description go into both dictionaries (`js/lang-en.js` and
`js/lang-ru.js`) under `levels.<id>.*`.

## Running it (Stages 1 & 2 — ready to play)

Just open `index.html` with a double-click in your browser (Chrome/Edge).
An internet connection is required: 3Dmol.js and the 1TUP structure are loaded from the network.

Two things worth knowing:

- **`index.html?selftest`** runs the built-in self-check of the pure functions and of the two
  dictionaries, and prints the result in the browser console. There is no test runner in this
  project, so this is what to run after touching that logic.
- **⚙ ГРАФИКА** cycles the graphics profile — *auto / light / pretty*. On a phone or a weak GPU
  the light profile caps the pixel ratio, coarsens the ribbons and draws the translucent surface
  only around the pocket, which is what keeps rotation smooth. The choice is remembered.

### Controls
| Action | Keys |
|---|---|
| Move on screen (X/Y) | `← ↑ → ↓` |
| Depth (closer / farther) | `W` / `S` |
| Rotate the molecule | `Q`/`E`, `A`/`D`, `Z`/`C` |
| Rotate the scene | mouse drag |
| Pan the camera | **Shift + mouse drag** (Blender-style) |
| Zoom in / out | mouse wheel |
| Study the protein | **🔎 STUDY** button → hover the cursor |
| Test the drug | **▶ TEST DRUG** button |
| Sound on/off | 🔇 icon in the top-left header |
| Help / about | **❓ ОБ ИГРЕ** button → tabs "About" / "How to play" |
| Replay the guided tutorial | **🎓 ОБУЧЕНИЕ** button |

Movement is **camera-relative** — the molecule goes where you look, regardless of keyboard layout.

## Guided tutorial (level 1)

Level 1 doesn't drop you into a wall of text — a **dynamic in-scene coach** teaches the whole
loop hands-on, flying the camera and narrating each object as you go (`js/coach.js`):

1. **Overview** — the whole cancer protein, pocket and drug hidden.
2. **Your drug** — the camera flies to the ligand; it blinks and is labelled.
3. **The pocket** — the camera **turns the protein** so the pocket (usually on the far side)
   faces you, then flies in; the pocket marker appears and pulses.
4. **Guide it in** — the view tilts to show the pocket clearly, a glowing **track** appears from
   the drug to the pocket, and the drug is *magnetically snapped* onto it while you drag, so a
   first-timer can't lose it in space.
5. **Seat it** — a blinking **reference pose** shows how the key should sit; rotate (right-drag)
   until it clicks into place.
6. **Test** — the action menu reappears with the **▶ TEST DRUG** button pulsing; press it to clear
   the level. A "level cleared" modal shows an **auto-rendered 3D preview** of the next target.

While the coach runs, the bottom meter and the right-hand action menu are hidden so the 3D scene
is fully visible; the narration sits at the bottom and the action menu returns for the test.

The coach runs every time you load level 1 (skip it with **ПРОПУСТИТЬ ОБУЧЕНИЕ ✕**, or replay it
with **🎓 ОБУЧЕНИЕ**). On **later druggable levels** you're on your own — only the blinking
reference drug is shown in the pocket as the goal (toggle it with **💡 ПОДСКАЗКА**); the open
problems (no reference drug exists) show just the pocket marker.

**Goal:** guide the molecule into the pocket. A dashed guide line runs from the molecule to
the target, and the meter at the bottom changes color with distance to the pocket:

| Distance to pocket | Status | Meter |
|---|---|---|
| > 20 Å | FAR | red |
| 10–20 Å | CLOSING IN… | amber |
| 5–10 Å | CLOSE | yellow |
| ≤ 5 Å | ★ IN THE POCKET! | green (a chime plays) |

When the meter is green, press **▶ TEST DRUG** to get a binding energy (kcal/mol) and points.

## What's implemented
- ✅ **Stage 1** — 3D surface (VDW) + cartoon ribbons, mouse rotation, wheel zoom, Shift-pan
- ✅ **Stage 2** — the ligand, controls, a highlighted target pocket (Zn site), guide line, glow
- ✅ **Stage 3** — Python backend (FastAPI) with a fallback to an in-browser calculation
- ✅ **Stage 4 (mini)** — points, fireworks (particles), a local leaderboard, sound (header icon)
- ✅ **Guided tutorial** — a dynamic in-scene coach that teaches level 1 hands-on (see above)
- ✅ **Study mode** — hovering shows what each residue does, including cancer "hotspots" of p53

### Study mode
Toggle the **🔎 STUDY** button, then hover over the protein, the zinc ion, or the DNA. The
translucent surface is removed so the ribbons inside are fully visible; the hovered object
keeps its **real color** and is highlighted while the rest of the scene is only slightly dimmed.

Highlighting is **zoom-aware**:
- **Zoomed out** — hovering highlights the *whole ribbon/chain*; the tooltip says what it's
  made of (how many amino acids / nucleotides).
- **Zoomed in** — hovering highlights a *single amino acid* (or nucleotide); the tooltip
  describes that specific residue and flags p53 cancer mutation hotspots (e.g. Arg175, Arg248, Arg273).

So you can zoom in and point at one amino acid to read about it, or zoom out to grasp the
whole chain.

## Stage 3 (backend) — available

By default **TEST DRUG** scores with the in-browser shape-contact model (instant, offline,
orientation-aware) — the old in-UI engine toggle was removed to keep the menu clear. The Python
backend path is still wired: flip the `engine` constant in `js/hud.js` from `'learn'` to `'vina'`
and **TEST DRUG** will POST the coordinates to `http://localhost:8000/dock` (falling back to the
browser model if the server or Vina is unavailable).

### Running the server
If Python is not installed on this machine (only the Microsoft Store stub), install it first:

1. Download Python 3.11+ from https://python.org (tick **"Add python.exe to PATH"** during
   installation), or run `winget install Python.Python.3.12`.
2. Then:
   ```
   cd backend
   pip install fastapi uvicorn
   python -m uvicorn server:app --reload --port 8000
   ```
   > **Note:** run it as `python -m uvicorn`, **not** the bare `uvicorn ...`.
   > `pip` installs the `uvicorn` launcher into a `Scripts` folder that is often
   > **not on `PATH`**, so `uvicorn: command not found` just means the module is
   > there but the shortcut isn't visible. `python -m uvicorn` always works.
   > (On some systems Python is invoked as `py -m uvicorn ...` instead.)
3. Reload the game page — calculations now run on the server.

Currently `server.py` uses a simplified model (distance to the pocket). The real **AutoDock
Vina** block in the file is commented out — enable it after installing the `vina` utility and
preparing the `.pdbqt` receptor/ligand files.
