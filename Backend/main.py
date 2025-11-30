import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiofiles
import psycopg
from psycopg.rows import dict_row


# ================================
# 🔵 CONFIGURATION BASE DE DONNÉES
# ================================
def get_db_connection():
    conn = psycopg.connect(
        os.environ.get("DATABASE_URL"),
        autocommit=True,
        row_factory=dict_row
    )
    return conn


# ================================
# 🔵 MODELES Pydantic
# ================================
class EPI(BaseModel):
    id: str
    employe: str
    departement: str
    typeEPI: str
    marque: str
    taille: str
    dateRemise: str
    dateExpiration: str
    statut: str


class Formation(BaseModel):
    id: str
    employe: str
    intitule: str
    organisme: str
    dateFormation: str
    dateExpiration: str
    statut: str


class Rapport(BaseModel):
    id: str
    titre: str
    auteur: str
    contenu: str
    date: str


# ================================
# 🔵 APP FastAPI
# ================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# 🔵 ROUTES EPI
# ================================
@app.get("/api/epi")
def get_all_epi():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM epi")
    data = cur.fetchall()
    conn.close()
    return data


@app.post("/api/epi")
def create_epi(epi: EPI):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO epi (id, employe, departement, typeEPI, marque, taille, dateRemise, dateExpiration, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            epi.id, epi.employe, epi.departement, epi.typeEPI,
            epi.marque, epi.taille, epi.dateRemise, epi.dateExpiration, epi.statut
        )
    )
    conn.close()
    return epi


@app.put("/api/epi/{epi_id}")
def update_epi(epi_id: str, epi: EPI):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE epi SET
            employe=%s, departement=%s, typeEPI=%s, marque=%s, taille=%s,
            dateRemise=%s, dateExpiration=%s, statut=%s
        WHERE id=%s
        """,
        (
            epi.employe, epi.departement, epi.typeEPI, epi.marque,
            epi.taille, epi.dateRemise, epi.dateExpiration, epi.statut,
            epi_id
        )
    )
    conn.close()
    return {"message": "ÉPI mis à jour"}


@app.delete("/api/epi/{epi_id}")
def delete_epi(epi_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM epi WHERE id = %s", (epi_id,))
    conn.close()
    return {"message": "ÉPI supprimé"}


# ================================
# 🔵 ROUTES RAPPORTS / UPLOADS
# ================================
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = f"{upload_dir}/{file.filename}"

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"filename": file.filename, "path": file_path}


@app.delete("/api/rapport/{id}")
def delete_report(id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM rapport WHERE id = %s", (id,))
    conn.close()
    return {"message": "Rapport supprimé"}


# ================================
# 🔵 ROUTES GLOBALES
# ================================
@app.get("/")
def root():
    return {"message": "API QHSE fonctionne !", "version": "1.0.0"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


# ================================
# 🔵 LANCEMENT LOCAL
# ================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)