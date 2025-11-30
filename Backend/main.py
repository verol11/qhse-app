from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import os
import shutil
import aiofiles

# PostgreSQL driver compatible Python 3.13
import psycopg
from psycopg.rows import dict_row

# ----------------------------------------------------
# CONFIG FASTAPI
# ----------------------------------------------------
app = FastAPI(title="API QHSE", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# CONFIG UPLOADS
# ----------------------------------------------------
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ----------------------------------------------------
# CONFIG DATABASE
# ----------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

# ----------------------------------------------------
# MODELES
# ----------------------------------------------------
class Formation(BaseModel):
    id: Optional[str] = None
    nom: str
    prenom: str
    departement: str
    fonction: str
    typeFormation: str
    intitule: str
    centreFormation: str
    dateFormation: str
    dateExpiration: str


class Materiel(BaseModel):
    id: Optional[str] = None
    categorie: str
    designation: str
    numeroSerie: str
    caracteristiques: str
    dateControle: str
    prochainControle: str
    statut: str


class Visite(BaseModel):
    id: Optional[str] = None
    nom: str
    prenom: str
    departement: str
    fonction: str
    typeVisite: str
    intitule: str
    centreMedical: str
    dateVisite: str
    dateExpiration: str


class Plan(BaseModel):
    id: Optional[str] = None
    titre: str
    description: str
    responsable: str
    departement: str
    dateDebut: str
    dateEcheance: str
    priorite: str
    avancement: int
    statut: str
    processus: str
    mesureEfficacite: Optional[str] = None
    commentaire: Optional[str] = None


class EPI(BaseModel):
    id: Optional[str] = None
    employe: str
    departement: str
    typeEPI: str
    marque: str
    taille: str
    dateRemise: str
    dateExpiration: str
    statut: str


# ----------------------------------------------------
# INIT DB
# ----------------------------------------------------
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS formations (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            departement TEXT NOT NULL,
            fonction TEXT NOT NULL,
            typeFormation TEXT NOT NULL,
            intitule TEXT NOT NULL,
            centreFormation TEXT NOT NULL,
            dateFormation TEXT NOT NULL,
            dateExpiration TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS materiel (
            id TEXT PRIMARY KEY,
            categorie TEXT NOT NULL,
            designation TEXT NOT NULL,
            numeroSerie TEXT NOT NULL,
            caracteristiques TEXT NOT NULL,
            dateControle TEXT NOT NULL,
            prochainControle TEXT NOT NULL,
            statut TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visites (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            departement TEXT NOT NULL,
            fonction TEXT NOT NULL,
            typeVisite TEXT NOT NULL,
            intitule TEXT NOT NULL,
            centreMedical TEXT NOT NULL,
            dateVisite TEXT NOT NULL,
            dateExpiration TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            description TEXT NOT NULL,
            responsable TEXT NOT NULL,
            departement TEXT NOT NULL,
            dateDebut TEXT NOT NULL,
            dateEcheance TEXT NOT NULL,
            priorite TEXT NOT NULL,
            avancement INTEGER NOT NULL,
            statut TEXT NOT NULL,
            processus TEXT NOT NULL,
            mesureEfficacite TEXT,
            commentaire TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS epi (
            id TEXT PRIMARY KEY,
            employe TEXT NOT NULL,
            departement TEXT NOT NULL,
            typeEPI TEXT NOT NULL,
            marque TEXT NOT NULL,
            taille TEXT NOT NULL,
            dateRemise TEXT NOT NULL,
            dateExpiration TEXT NOT NULL,
            statut TEXT NOT NULL
        )
    ''')

    conn.commit()
    conn.close()

init_db()


# ----------------------------------------------------
# ROUTES FORMATIONS
# ----------------------------------------------------
@app.get("/api/formations")
async def get_formations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM formations")
    items = cursor.fetchall()
    conn.close()
    return items


@app.post("/api/formations")
async def create_formation(item: Formation):
    item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO formations VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ''', (
        item.id, item.nom, item.prenom, item.departement, item.fonction,
        item.typeFormation, item.intitule, item.centreFormation,
        item.dateFormation, item.dateExpiration
    ))

    conn.commit()
    conn.close()
    return item


# ----------------------------------------------------
# ROUTES MATERIEL
# ----------------------------------------------------
@app.get("/api/materiel")
async def get_materiel():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM materiel")
    items = cursor.fetchall()
    conn.close()
    return items


@app.post("/api/materiel")
async def create_materiel(item: Materiel):
    item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO materiel VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    ''', (
        item.id, item.categorie, item.designation, item.numeroSerie,
        item.caracteristiques, item.dateControle, item.prochainControle,
        item.statut
    ))

    conn.commit()
    conn.close()
    return item


# ----------------------------------------------------
# ROUTES VISITES
# ----------------------------------------------------
@app.get("/api/visites")
async def get_visites():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visites")
    items = cursor.fetchall()
    conn.close()
    return items


@app.post("/api/visites")
async def create_visite(item: Visite):
    item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO visites VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ''', (
        item.id, item.nom, item.prenom, item.departement, item.fonction,
        item.typeVisite, item.intitule, item.centreMedical,
        item.dateVisite, item.dateExpiration
    ))

    conn.commit()
    conn.close()
    return item


# ----------------------------------------------------
# ROUTES PLANS
# ----------------------------------------------------
@app.get("/api/plans")
async def get_plans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM plans")
    items = cursor.fetchall()
    conn.close()
    return items


@app.post("/api/plans")
async def create_plan(item: Plan):
    item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO plans VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ''', (
        item.id, item.titre, item.description, item.responsable,
        item.departement, item.dateDebut, item.dateEcheance,
        item.priorite, item.avancement, item.statut, item.processus,
        item.mesureEfficacite, item.commentaire
    ))

    conn.commit()
    conn.close()
    return item


# ----------------------------------------------------
# ROUTES EPI
# ----------------------------------------------------
@app.get("/api/epi")
async def get_epi():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM epi")
    items = cursor.fetchall()
    conn.close()
    return items


@app.post("/api/epi")
async def create_epi(item: EPI):
    item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO epi VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ''', (
        item.id, item.employe, item.departement, item.typeEPI,
        item.marque, item.taille, item.dateRemise,
        item.dateExpiration, item.statut
    ))

    conn.commit()
    conn.close()
    return item


# ----------------------------------------------------
# UPLOAD FICHIERS
# ----------------------------------------------------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    return {"file_url": f"/uploads/{filename}", "id": file_id}


# ----------------------------------------------------
# ROUTES GENERALES
# ----------------------------------------------------
@app.get("/")
async def root():
    return {"message": "API QHSE fonctionne!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ----------------------------------------------------
# LAUNCH (local uniquement)
# ----------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
