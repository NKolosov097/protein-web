"""
Stage 3 — FastAPI REST API for the docking calculation.

Run:
    pip install fastapi uvicorn
    python -m uvicorn server:app --reload --port 8000
    # use `python -m uvicorn`, not bare `uvicorn` — otherwise
    # "uvicorn: command not found" (the launcher isn't on PATH)

Two engines (the client picks via the `engine` field):
  • "contact" (default) — the simplified shape-contact model. Computed right here, with a
    formula IDENTICAL to fitEnergy() in the frontend. For learning; always works.
  • "vina" — real AutoDock Vina. Requires the `vina` binary on PATH and a prepared receptor
    at backend/receptors/<pdb>.pdbqt. If anything is missing the server honestly answers 503,
    and the frontend falls back to the contact model and tells the user.

How to enable real Vina:
  1) install AutoDock Vina so the `vina` command is on PATH;
  2) drop receptors into backend/receptors/ (e.g. 1tup.pdbqt, 2hyy.pdbqt, …),
     prepared from the PDB via AutoDockTools / `prepare_receptor`.
"""
import math
import os
import re
import shutil
import subprocess
import tempfile

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Protein Docker API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

RECEPTOR_DIR = os.path.join(os.path.dirname(__file__), "receptors")


class Atom(BaseModel):
    x: float
    y: float
    z: float


class DockRequest(BaseModel):
    ligand: list[Atom]                 # ligand atom coordinates
    center: list[float]                # pocket centre [x,y,z]
    pocket_atoms: list[Atom] = []      # pocket "wall" atoms (for the contact model)
    engine: str = "contact"            # "contact" (learning) | "vina" (real docking)
    receptor: str = ""                 # level's PDB id → backend/receptors/<pdb>.pdbqt (for vina)


class DockResult(BaseModel):
    affinity: float              # kcal/mol (more negative = better)
    score: int                   # game points


def contact_affinity(req: DockRequest) -> float:
    """CONTACT MODEL (no Vina): both position AND orientation of the ligand matter.
    The formula is IDENTICAL to fitEnergy() in the browser so the scores agree:
      for each ligand atom take its nearest pocket-wall atom;
        ~3.2 Å → a good contact (reward),  < 2.3 Å → a clash (penalty);
      plus a proximity term — bring the molecule to the pocket.
    """
    cx, cy, cz = req.center
    n = len(req.ligand) or 1
    lx = sum(a.x for a in req.ligand) / n
    ly = sum(a.y for a in req.ligand) / n
    lz = sum(a.z for a in req.ligand) / n
    center_dist = math.dist((lx, ly, lz), (cx, cy, cz))

    good = clash = 0.0
    for w in req.ligand:
        dmin = math.inf
        for p in req.pocket_atoms:
            d = math.dist((w.x, w.y, w.z), (p.x, p.y, p.z))
            if d < dmin:
                dmin = d
        if dmin < 2.3:
            clash += 2.3 - dmin
        elif dmin < 4.5:
            good += max(0.0, 1 - abs(dmin - 3.2) / 1.3)

    prox = max(0.0, 1 - center_dist / 18)
    affinity = -1 - 5 * prox - 1.1 * good + 2.2 * clash
    return max(-12.0, min(-0.5, affinity))


def _write_ligand_pdbqt(ligand: list[Atom], path: str) -> None:
    """Minimal ligand .pdbqt (skeleton). Production Vina needs correct atom types and
    charges — here we write a generic carbon; replace with proper preparation
    (meeko / AutoDockTools) when running real calculations."""
    with open(path, "w", encoding="ascii") as f:
        f.write("ROOT\n")
        for i, a in enumerate(ligand, 1):
            f.write(
                f"HETATM{i:>5} C   LIG A   1    "
                f"{a.x:8.3f}{a.y:8.3f}{a.z:8.3f}  1.00  0.00     0.000 C\n"
            )
        f.write("ENDROOT\nTORSDOF 0\n")


def vina_affinity(req: DockRequest) -> float:
    """Real AutoDock Vina. Raises HTTPException(503) if the engine is unavailable —
    the frontend catches it and falls back to the contact model, telling the user."""
    if shutil.which("vina") is None:
        raise HTTPException(503, detail="vina не установлена в PATH на сервере")
    if not req.receptor:
        raise HTTPException(503, detail="не указан рецептор уровня")
    receptor_path = os.path.join(RECEPTOR_DIR, f"{req.receptor.lower()}.pdbqt")
    if not os.path.exists(receptor_path):
        raise HTTPException(503, detail=f"нет рецептора {req.receptor}.pdbqt на сервере")

    cx, cy, cz = req.center
    with tempfile.TemporaryDirectory() as tmp:
        lig_path = os.path.join(tmp, "lig.pdbqt")
        _write_ligand_pdbqt(req.ligand, lig_path)
        try:
            out = subprocess.run(
                ["vina", "--receptor", receptor_path, "--ligand", lig_path,
                 "--center_x", str(cx), "--center_y", str(cy), "--center_z", str(cz),
                 "--size_x", "20", "--size_y", "20", "--size_z", "20",
                 "--exhaustiveness", "8"],
                capture_output=True, text=True, timeout=120,
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(504, detail="vina не уложилась в отведённое время")
        m = re.search(r"^\s*1\s+(-?\d+\.\d+)", out.stdout, re.M)
        if not m:
            raise HTTPException(502, detail="vina не вернула результат")
        return float(m.group(1))


@app.post("/dock", response_model=DockResult)
def dock(req: DockRequest):
    if req.engine == "vina":
        affinity = vina_affinity(req)      # HTTPException(503/502/504) if Vina is unavailable
    else:
        affinity = contact_affinity(req)   # learning model — always works
    affinity = round(affinity, 2)
    return DockResult(affinity=affinity, score=round(-affinity * 1000))
