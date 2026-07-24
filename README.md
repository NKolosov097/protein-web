# 🧬 Protein Docker — a "drug-fitting" game

**▶️ [Играть онлайн](https://NKolosov097.github.io/protein-web/)**

A browser game featuring the real **p53 protein (PDB 1TUP)** rendered in 3D. You steer a
small drug-like molecule toward the protein's functional pocket; the game measures the
contact, awards points, and celebrates with sound and fireworks.

## Running it (Stages 1 & 2 — ready to play)

Just open `index.html` with a double-click in your browser (Chrome/Edge).
An internet connection is required: 3Dmol.js and the 1TUP structure are loaded from the network.

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

Movement is **camera-relative** — the molecule goes where you look, regardless of keyboard layout.

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
- ✅ **Stage 4 (mini)** — points, fireworks (particles), a local leaderboard, sound (toggle button)
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

## Stage 3 (backend) — connected

The **TEST DRUG** button sends the molecule's coordinates to `http://localhost:8000/dock`.
If the server is **not running**, the game computes the result in the browser instead (fallback) —
the toast will read "browser"; with the server running it reads "Python server".

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
