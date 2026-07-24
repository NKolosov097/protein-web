"""
Этап 3 — REST API на FastAPI для настоящего расчёта докинга.

Запуск:
    pip install fastapi uvicorn
    python -m uvicorn server:app --reload --port 8000
    # именно `python -m uvicorn`, а не голый `uvicorn` — иначе
    # "uvicorn: command not found" (launcher не в PATH)

Клиент шлёт POST /dock с 3D-координатами молекулы, сервер запускает
AutoDock Vina и возвращает энергию связывания (ккал/моль).

⚠ Заглушка: реальный вызов Vina требует установленной утилиты `vina`
   и подготовленных .pdbqt файлов рецептора и лиганда. Ниже показан каркас;
   раскомментируй блок subprocess, когда установишь Vina.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
# import subprocess, re, tempfile, os   # для реального Vina

app = FastAPI(title="Protein Docker API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Atom(BaseModel):
    x: float
    y: float
    z: float


class DockRequest(BaseModel):
    ligand: list[Atom]           # координаты атомов лиганда
    center: list[float]          # центр кармана [x,y,z]


class DockResult(BaseModel):
    affinity: float              # ккал/моль (чем меньше — тем лучше)
    score: int                   # очки для игры


@app.post("/dock", response_model=DockResult)
def dock(req: DockRequest):
    # --- УПРОЩЁННАЯ модель (без Vina): чем ближе центр лиганда к карману, тем лучше ---
    cx, cy, cz = req.center
    lx = sum(a.x for a in req.ligand) / len(req.ligand)
    ly = sum(a.y for a in req.ligand) / len(req.ligand)
    lz = sum(a.z for a in req.ligand) / len(req.ligand)
    d = math.dist((lx, ly, lz), (cx, cy, cz))
    affinity = max(-11.0, min(-1.0, -11 + d * 0.38))

    # --- РЕАЛЬНЫЙ Vina (раскомментируй после установки) -------------------
    # with tempfile.TemporaryDirectory() as tmp:
    #     write_pdbqt(req.ligand, f"{tmp}/lig.pdbqt")
    #     out = subprocess.run(
    #         ["vina", "--receptor", "1tup.pdbqt", "--ligand", f"{tmp}/lig.pdbqt",
    #          "--center_x", str(cx), "--center_y", str(cy), "--center_z", str(cz),
    #          "--size_x", "20", "--size_y", "20", "--size_z", "20"],
    #         capture_output=True, text=True)
    #     m = re.search(r"^\s*1\s+(-?\d+\.\d+)", out.stdout, re.M)
    #     affinity = float(m.group(1)) if m else 0.0
    # ---------------------------------------------------------------------

    return DockResult(affinity=round(affinity, 2), score=round(-affinity * 1000))
