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
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="API QHSE", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configuration PostgreSQL
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    """Initialise la base de données PostgreSQL"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table formations
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
    
    # Table materiel
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
    
    # Table visites
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
    
    # Table plans
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
    
    # Table epi
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
    
    # Table incidents
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            typeIncident TEXT NOT NULL,
            gravite TEXT NOT NULL,
            date TEXT NOT NULL,
            heure TEXT NOT NULL,
            lieu TEXT NOT NULL,
            description TEXT NOT NULL,
            personne TEXT NOT NULL,
            temoin TEXT,
            action TEXT,
            statut TEXT NOT NULL
        )
    ''')
    
    # Table permis
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS permis (
            id TEXT PRIMARY KEY,
            numero TEXT NOT NULL,
            typeTravail TEXT NOT NULL,
            localisation TEXT NOT NULL,
            demandeur TEXT NOT NULL,
            executant TEXT NOT NULL,
            departement TEXT NOT NULL,
            descriptionTache TEXT NOT NULL,
            equipement TEXT NOT NULL,
            dateDebut TEXT NOT NULL,
            dateFin TEXT NOT NULL,
            heureDebut TEXT NOT NULL,
            heureFin TEXT NOT NULL,
            statut TEXT NOT NULL
        )
    ''')
    
    # Table risques
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risques (
            id TEXT PRIMARY KEY,
            permis_id TEXT NOT NULL,
            risque TEXT NOT NULL,
            niveau TEXT NOT NULL,
            mesures TEXT NOT NULL,
            FOREIGN KEY (permis_id) REFERENCES permis (id) ON DELETE CASCADE
        )
    ''')
    
    # Table ged
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ged (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            type TEXT NOT NULL,
            categorie TEXT NOT NULL,
            description TEXT NOT NULL,
            dateCreation TEXT NOT NULL,
            dateModification TEXT NOT NULL,
            auteur TEXT NOT NULL,
            statut TEXT NOT NULL,
            fichier TEXT
        )
    ''')
    
    # Table plan_formations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS plan_formations (
            id TEXT PRIMARY KEY,
            intitule TEXT NOT NULL,
            typeFormation TEXT NOT NULL,
            description TEXT NOT NULL,
            publicCible TEXT NOT NULL,
            formateur TEXT NOT NULL,
            dateDebut TEXT NOT NULL,
            dateFin TEXT NOT NULL,
            duree TEXT NOT NULL,
            lieu TEXT NOT NULL,
            cout REAL NOT NULL,
            statut TEXT NOT NULL
        )
    ''')
    
    # Table planning_hse
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS planning_hse (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            typeActivite TEXT NOT NULL,
            description TEXT NOT NULL,
            dateDebut TEXT NOT NULL,
            dateFin TEXT NOT NULL,
            heureDebut TEXT NOT NULL,
            heureFin TEXT NOT NULL,
            responsable TEXT NOT NULL,
            lieu TEXT NOT NULL,
            statut TEXT NOT NULL,
            priorite TEXT NOT NULL
        )
    ''')
    
    # Table veille_reglementaire
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS veille_reglementaire (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            reference TEXT NOT NULL,
            typeReglementation TEXT NOT NULL,
            organisme TEXT NOT NULL,
            datePublication TEXT NOT NULL,
            dateApplication TEXT NOT NULL,
            description TEXT NOT NULL,
            statut TEXT NOT NULL,
            impact TEXT NOT NULL
        )
    ''')
    
    # Table aspects_environnementaux
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aspects_environnementaux (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            categorie TEXT NOT NULL,
            aspect TEXT NOT NULL,
            activite_source TEXT NOT NULL,
            localisation TEXT NOT NULL,
            description TEXT NOT NULL,
            condition_fonctionnement TEXT NOT NULL,
            impact_environnemental TEXT NOT NULL,
            criticite TEXT NOT NULL,
            statut TEXT NOT NULL,
            indicateur TEXT NOT NULL,
            unite_mesure TEXT NOT NULL,
            methode_suivi TEXT NOT NULL,
            frequence_mesure TEXT NOT NULL,
            cible TEXT NOT NULL,
            objectif TEXT NOT NULL,
            donnees_mesurees TEXT,
            date_derniere_mesure TEXT NOT NULL,
            responsable TEXT NOT NULL,
            mesures_maitrise TEXT NOT NULL,
            plan_actions TEXT NOT NULL,
            conformite_reglementaire TEXT NOT NULL,
            commentaires TEXT
        )
    ''')
    
    # Table rapports
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rapports (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            type TEXT NOT NULL,
            periode TEXT NOT NULL,
            dateGeneration TEXT NOT NULL,
            auteur TEXT NOT NULL,
            contenu TEXT NOT NULL,
            statut TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialiser la base au démarrage
init_db()

# === MODÈLES (identique à votre code original) ===
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

class Incident(BaseModel):
    id: Optional[str] = None
    type: str
    typeIncident: str
    gravite: str
    date: str
    heure: str
    lieu: str
    description: str
    personne: str
    temoin: Optional[str] = None
    action: Optional[str] = None
    statut: str

class Risque(BaseModel):
    id: Optional[str] = None
    risque: str
    niveau: str
    mesures: str

class Permis(BaseModel):
    id: Optional[str] = None
    numero: str
    typeTravail: str
    localisation: str
    demandeur: str
    executant: str
    departement: str
    descriptionTache: str
    equipement: str
    dateDebut: str
    dateFin: str
    heureDebut: str
    heureFin: str
    statut: str
    risques: Optional[List[Risque]] = []

class GED(BaseModel):
    id: Optional[str] = None
    titre: str
    type: str
    categorie: str
    description: str
    dateCreation: str
    dateModification: str
    auteur: str
    statut: str
    fichier: Optional[str] = None

class PlanFormation(BaseModel):
    id: Optional[str] = None
    intitule: str
    typeFormation: str
    description: str
    publicCible: str
    formateur: str
    dateDebut: str
    dateFin: str
    duree: str
    lieu: str
    cout: float
    statut: str
    participants: List[str] = []

class PlanningHSE(BaseModel):
    id: Optional[str] = None
    titre: str
    typeActivite: str
    description: str
    dateDebut: str
    dateFin: str
    heureDebut: str
    heureFin: str
    responsable: str
    lieu: str
    statut: str
    priorite: str

class VeilleReglementaire(BaseModel):
    id: Optional[str] = None
    titre: str
    reference: str
    typeReglementation: str
    organisme: str
    datePublication: str
    dateApplication: str
    description: str
    statut: str
    impact: str

class AspectEnvironnemental(BaseModel):
    id: Optional[str] = None
    type: str
    categorie: str
    aspect: str
    activite_source: str
    localisation: str
    description: str
    condition_fonctionnement: str
    impact_environnemental: str
    criticite: str
    statut: str
    indicateur: str
    unite_mesure: str
    methode_suivi: str
    frequence_mesure: str
    cible: str
    objectif: str
    donnees_mesurees: Optional[str] = None
    date_derniere_mesure: str
    responsable: str
    mesures_maitrise: str
    plan_actions: str
    conformite_reglementaire: str
    commentaires: Optional[str] = None

class Rapport(BaseModel):
    id: Optional[str] = None
    titre: str
    type: str
    periode: str
    dateGeneration: str
    auteur: str
    contenu: str
    statut: str

# === ROUTES (identique à votre code mais avec PostgreSQL) ===

# Routes Formations
@app.get("/api/formations")
async def get_formations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM formations")
    formations = cursor.fetchall()
    conn.close()
    return formations

@app.post("/api/formations")
async def create_formation(formation: Formation):
    formation.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO formations (id, nom, prenom, departement, fonction, typeFormation, intitule, centreFormation, dateFormation, dateExpiration)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (formation.id, formation.nom, formation.prenom, formation.departement, formation.fonction, formation.typeFormation, formation.intitule, formation.centreFormation, formation.dateFormation, formation.dateExpiration))
    conn.commit()
    conn.close()
    return formation

@app.put("/api/formations/{formation_id}")
async def update_formation(formation_id: str, formation: Formation):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE formations 
        SET nom=%s, prenom=%s, departement=%s, fonction=%s, typeFormation=%s, intitule=%s, centreFormation=%s, dateFormation=%s, dateExpiration=%s
        WHERE id=%s
    ''', (formation.nom, formation.prenom, formation.departement, formation.fonction, formation.typeFormation, formation.intitule, formation.centreFormation, formation.dateFormation, formation.dateExpiration, formation_id))
    conn.commit()
    conn.close()
    formation.id = formation_id
    return formation

@app.delete("/api/formations/{formation_id}")
async def delete_formation(formation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM formations WHERE id=%s", (formation_id,))
    conn.commit()
    conn.close()
    return {"message": "Formation supprimée"}

# Routes Matériel
@app.get("/api/materiel")
async def get_materiel():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM materiel")
    materiel = cursor.fetchall()
    conn.close()
    return materiel

@app.post("/api/materiel")
async def create_materiel(materiel: Materiel):
    materiel.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO materiel (id, categorie, designation, numeroSerie, caracteristiques, dateControle, prochainControle, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', (materiel.id, materiel.categorie, materiel.designation, materiel.numeroSerie, materiel.caracteristiques, materiel.dateControle, materiel.prochainControle, materiel.statut))
    conn.commit()
    conn.close()
    return materiel

@app.put("/api/materiel/{materiel_id}")
async def update_materiel(materiel_id: str, materiel: Materiel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE materiel 
        SET categorie=%s, designation=%s, numeroSerie=%s, caracteristiques=%s, dateControle=%s, prochainControle=%s, statut=%s
        WHERE id=%s
    ''', (materiel.categorie, materiel.designation, materiel.numeroSerie, materiel.caracteristiques, materiel.dateControle, materiel.prochainControle, materiel.statut, materiel_id))
    conn.commit()
    conn.close()
    materiel.id = materiel_id
    return materiel

@app.delete("/api/materiel/{materiel_id}")
async def delete_materiel(materiel_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM materiel WHERE id=%s", (materiel_id,))
    conn.commit()
    conn.close()
    return {"message": "Matériel supprimé"}

# Routes Visites
@app.get("/api/visites")
async def get_visites():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visites")
    visites = cursor.fetchall()
    conn.close()
    return visites

@app.post("/api/visites")
async def create_visite(visite: Visite):
    visite.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO visites (id, nom, prenom, departement, fonction, typeVisite, intitule, centreMedical, dateVisite, dateExpiration)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (visite.id, visite.nom, visite.prenom, visite.departement, visite.fonction, visite.typeVisite, visite.intitule, visite.centreMedical, visite.dateVisite, visite.dateExpiration))
    conn.commit()
    conn.close()
    return visite

@app.put("/api/visites/{visite_id}")
async def update_visite(visite_id: str, visite: Visite):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE visites 
        SET nom=%s, prenom=%s, departement=%s, fonction=%s, typeVisite=%s, intitule=%s, centreMedical=%s, dateVisite=%s, dateExpiration=%s
        WHERE id=%s
    ''', (visite.nom, visite.prenom, visite.departement, visite.fonction, visite.typeVisite, visite.intitule, visite.centreMedical, visite.dateVisite, visite.dateExpiration, visite_id))
    conn.commit()
    conn.close()
    visite.id = visite_id
    return visite

@app.delete("/api/visites/{visite_id}")
async def delete_visite(visite_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM visites WHERE id=%s", (visite_id,))
    conn.commit()
    conn.close()
    return {"message": "Visite supprimée"}

# Routes Plans
@app.get("/api/plans")
async def get_plans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM plans")
    plans = cursor.fetchall()
    conn.close()
    return plans

@app.post("/api/plans")
async def create_plan(plan: Plan):
    plan.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO plans (id, titre, description, responsable, departement, dateDebut, dateEcheance, priorite, avancement, statut, processus, mesureEfficacite, commentaire)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (plan.id, plan.titre, plan.description, plan.responsable, plan.departement, plan.dateDebut, plan.dateEcheance, plan.priorite, plan.avancement, plan.statut, plan.processus, plan.mesureEfficacite, plan.commentaire))
    conn.commit()
    conn.close()
    return plan

@app.put("/api/plans/{plan_id}")
async def update_plan(plan_id: str, plan: Plan):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE plans 
        SET titre=%s, description=%s, responsable=%s, departement=%s, dateDebut=%s, dateEcheance=%s, priorite=%s, avancement=%s, statut=%s, processus=%s, mesureEfficacite=%s, commentaire=%s
        WHERE id=%s
    ''', (plan.titre, plan.description, plan.responsable, plan.departement, plan.dateDebut, plan.dateEcheance, plan.priorite, plan.avancement, plan.statut, plan.processus, plan.mesureEfficacite, plan.commentaire, plan_id))
    conn.commit()
    conn.close()
    plan.id = plan_id
    return plan

@app.delete("/api/plans/{plan_id}")
async def delete_plan(plan_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM plans WHERE id=%s", (plan_id,))
    conn.commit()
    conn.close()
    return {"message": "Plan supprimé"}

# Routes EPI
@app.get("/api/epi")
async def get_epi():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM epi")
    epi_list = cursor.fetchall()
    conn.close()
    return epi_list

@app.post("/api/epi")
async def create_epi(epi: EPI):
    epi.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO epi (id, employe, departement, typeEPI, marque, taille, dateRemise, dateExpiration, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (epi.id, epi.employe, epi.departement, epi.typeEPI, epi.marque, epi.taille, epi.dateRemise, epi.dateExpiration, epi.statut))
    conn.commit()
    conn.close()
    return epi

@app.put("/api/epi/{epi_id}")
async def update_epi(epi_id: str, epi: EPI):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE epi 
        SET employe=%s, departement=%s, typeEPI=%s, marque=%s, taille=%s, dateRemise=%s, dateExpiration=%s, statut=%s
        WHERE id=%s
    ''', (epi.employe, epi.departement, epi.typeEPI, epi.marque, epi.taille, epi.dateRemise, epi.dateExpiration, epi.statut, epi_id))
    conn.commit()
    conn.close()
    epi.id = epi_id
    return epi

@app.delete("/api/epi/{epi_id}")
async def delete_epi(epi_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM epi WHERE id=%s", (epi_id,))
    conn.commit()
    conn.close()
    return {"message": "EPI supprimé"}

# Routes Incidents
@app.get("/api/incidents")
async def get_incidents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents")
    incidents = cursor.fetchall()
    conn.close()
    return incidents

@app.post("/api/incidents")
async def create_incident(incident: Incident):
    incident.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO incidents (id, type, typeIncident, gravite, date, heure, lieu, description, personne, temoin, action, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (incident.id, incident.type, incident.typeIncident, incident.gravite, incident.date, incident.heure, incident.lieu, incident.description, incident.personne, incident.temoin, incident.action, incident.statut))
    conn.commit()
    conn.close()
    return incident

@app.put("/api/incidents/{incident_id}")
async def update_incident(incident_id: str, incident: Incident):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE incidents 
        SET type=%s, typeIncident=%s, gravite=%s, date=%s, heure=%s, lieu=%s, description=%s, personne=%s, temoin=%s, action=%s, statut=%s
        WHERE id=%s
    ''', (incident.type, incident.typeIncident, incident.gravite, incident.date, incident.heure, incident.lieu, incident.description, incident.personne, incident.temoin, incident.action, incident.statut, incident_id))
    conn.commit()
    conn.close()
    incident.id = incident_id
    return incident

@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents WHERE id=%s", (incident_id,))
    conn.commit()
    conn.close()
    return {"message": "Incident supprimé"}

# Routes Permis
@app.get("/api/permis")
async def get_permis():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM permis")
    permis_list = cursor.fetchall()
    
    for permis in permis_list:
        cursor.execute("SELECT * FROM risques WHERE permis_id=%s", (permis['id'],))
        risques = cursor.fetchall()
        permis['risques'] = risques
    
    conn.close()
    return permis_list

@app.post("/api/permis")
async def create_permis(permis: Permis):
    permis.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO permis (id, numero, typeTravail, localisation, demandeur, executant, departement, descriptionTache, equipement, dateDebut, dateFin, heureDebut, heureFin, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (permis.id, permis.numero, permis.typeTravail, permis.localisation, permis.demandeur, permis.executant, permis.departement, permis.descriptionTache, permis.equipement, permis.dateDebut, permis.dateFin, permis.heureDebut, permis.heureFin, permis.statut))
    
    if permis.risques:
        for risque in permis.risques:
            risque_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO risques (id, permis_id, risque, niveau, mesures)
                VALUES (%s, %s, %s, %s, %s)
            ''', (risque_id, permis.id, risque.risque, risque.niveau, risque.mesures))
    
    conn.commit()
    conn.close()
    return permis

@app.put("/api/permis/{permis_id}")
async def update_permis(permis_id: str, permis: Permis):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE permis 
        SET numero=%s, typeTravail=%s, localisation=%s, demandeur=%s, executant=%s, departement=%s, descriptionTache=%s, equipement=%s, dateDebut=%s, dateFin=%s, heureDebut=%s, heureFin=%s, statut=%s
        WHERE id=%s
    ''', (permis.numero, permis.typeTravail, permis.localisation, permis.demandeur, permis.executant, permis.departement, permis.descriptionTache, permis.equipement, permis.dateDebut, permis.dateFin, permis.heureDebut, permis.heureFin, permis.statut, permis_id))
    
    cursor.execute("DELETE FROM risques WHERE permis_id=%s", (permis_id,))
    
    if permis.risques:
        for risque in permis.risques:
            risque_id = risque.id if risque.id else str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO risques (id, permis_id, risque, niveau, mesures)
                VALUES (%s, %s, %s, %s, %s)
            ''', (risque_id, permis_id, risque.risque, risque.niveau, risque.mesures))
    
    conn.commit()
    conn.close()
    permis.id = permis_id
    return permis

@app.delete("/api/permis/{permis_id}")
async def delete_permis(permis_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM risques WHERE permis_id=%s", (permis_id,))
    cursor.execute("DELETE FROM permis WHERE id=%s", (permis_id,))
    
    conn.commit()
    conn.close()
    return {"message": "Permis supprimé"}

# Routes GED
@app.get("/api/ged")
async def get_ged():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ged")
    ged = cursor.fetchall()
    conn.close()
    return ged

@app.post("/api/ged")
async def create_ged(ged_item: GED):
    ged_item.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO ged (id, titre, type, categorie, description, dateCreation, dateModification, auteur, statut, fichier)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (ged_item.id, ged_item.titre, ged_item.type, ged_item.categorie, ged_item.description, ged_item.dateCreation, ged_item.dateModification, ged_item.auteur, ged_item.statut, ged_item.fichier))
    conn.commit()
    conn.close()
    return ged_item

@app.put("/api/ged/{ged_id}")
async def update_ged(ged_id: str, ged_item: GED):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE ged 
        SET titre=%s, type=%s, categorie=%s, description=%s, dateCreation=%s, dateModification=%s, auteur=%s, statut=%s, fichier=%s
        WHERE id=%s
    ''', (ged_item.titre, ged_item.type, ged_item.categorie, ged_item.description, ged_item.dateCreation, ged_item.dateModification, ged_item.auteur, ged_item.statut, ged_item.fichier, ged_id))
    conn.commit()
    conn.close()
    ged_item.id = ged_id
    return ged_item

@app.delete("/api/ged/{ged_id}")
async def delete_ged(ged_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ged WHERE id=%s", (ged_id,))
    conn.commit()
    conn.close()
    return {"message": "Document GED supprimé"}

# Upload de fichiers pour GED
@app.post("/api/ged/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)
    
    return {"filename": filename, "file_id": file_id}

# Routes Plan Formations
@app.get("/api/planformations")
async def get_plan_formations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM plan_formations")
    plan_formations = cursor.fetchall()
    conn.close()
    return plan_formations

@app.post("/api/planformations")
async def create_plan_formation(plan_formation: PlanFormation):
    plan_formation.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO plan_formations (id, intitule, typeFormation, description, publicCible, formateur, dateDebut, dateFin, duree, lieu, cout, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (plan_formation.id, plan_formation.intitule, plan_formation.typeFormation, plan_formation.description, plan_formation.publicCible, plan_formation.formateur, plan_formation.dateDebut, plan_formation.dateFin, plan_formation.duree, plan_formation.lieu, plan_formation.cout, plan_formation.statut))
    conn.commit()
    conn.close()
    return plan_formation

@app.put("/api/planformations/{plan_id}")
async def update_plan_formation(plan_id: str, plan_formation: PlanFormation):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE plan_formations 
        SET intitule=%s, typeFormation=%s, description=%s, publicCible=%s, formateur=%s, dateDebut=%s, dateFin=%s, duree=%s, lieu=%s, cout=%s, statut=%s
        WHERE id=%s
    ''', (plan_formation.intitule, plan_formation.typeFormation, plan_formation.description, plan_formation.publicCible, plan_formation.formateur, plan_formation.dateDebut, plan_formation.dateFin, plan_formation.duree, plan_formation.lieu, plan_formation.cout, plan_formation.statut, plan_id))
    conn.commit()
    conn.close()
    plan_formation.id = plan_id
    return plan_formation

@app.delete("/api/planformations/{plan_id}")
async def delete_plan_formation(plan_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM plan_formations WHERE id=%s", (plan_id,))
    conn.commit()
    conn.close()
    return {"message": "Plan de formation supprimé"}

# Routes Planning HSE
@app.get("/api/planninghse")
async def get_planning_hse():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM planning_hse")
    planning_hse = cursor.fetchall()
    conn.close()
    return planning_hse

@app.post("/api/planninghse")
async def create_planning_hse(planning: PlanningHSE):
    planning.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO planning_hse (id, titre, typeActivite, description, dateDebut, dateFin, heureDebut, heureFin, responsable, lieu, statut, priorite)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (planning.id, planning.titre, planning.typeActivite, planning.description, planning.dateDebut, planning.dateFin, planning.heureDebut, planning.heureFin, planning.responsable, planning.lieu, planning.statut, planning.priorite))
    conn.commit()
    conn.close()
    return planning

@app.put("/api/planninghse/{planning_id}")
async def update_planning_hse(planning_id: str, planning: PlanningHSE):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE planning_hse 
        SET titre=%s, typeActivite=%s, description=%s, dateDebut=%s, dateFin=%s, heureDebut=%s, heureFin=%s, responsable=%s, lieu=%s, statut=%s, priorite=%s
        WHERE id=%s
    ''', (planning.titre, planning.typeActivite, planning.description, planning.dateDebut, planning.dateFin, planning.heureDebut, planning.heureFin, planning.responsable, planning.lieu, planning.statut, planning.priorite, planning_id))
    conn.commit()
    conn.close()
    planning.id = planning_id
    return planning

@app.delete("/api/planninghse/{planning_id}")
async def delete_planning_hse(planning_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM planning_hse WHERE id=%s", (planning_id,))
    conn.commit()
    conn.close()
    return {"message": "Planning HSE supprimé"}

# Routes Veille Réglementaire
@app.get("/api/veillereglementaire")
async def get_veille_reglementaire():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM veille_reglementaire")
    veille = cursor.fetchall()
    conn.close()
    return veille

@app.post("/api/veillereglementaire")
async def create_veille_reglementaire(veille: VeilleReglementaire):
    veille.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO veille_reglementaire (id, titre, reference, typeReglementation, organisme, datePublication, dateApplication, description, statut, impact)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (veille.id, veille.titre, veille.reference, veille.typeReglementation, veille.organisme, veille.datePublication, veille.dateApplication, veille.description, veille.statut, veille.impact))
    conn.commit()
    conn.close()
    return veille

@app.put("/api/veillereglementaire/{veille_id}")
async def update_veille_reglementaire(veille_id: str, veille: VeilleReglementaire):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE veille_reglementaire 
        SET titre=%s, reference=%s, typeReglementation=%s, organisme=%s, datePublication=%s, dateApplication=%s, description=%s, statut=%s, impact=%s
        WHERE id=%s
    ''', (veille.titre, veille.reference, veille.typeReglementation, veille.organisme, veille.datePublication, veille.dateApplication, veille.description, veille.statut, veille.impact, veille_id))
    conn.commit()
    conn.close()
    veille.id = veille_id
    return veille

@app.delete("/api/veillereglementaire/{veille_id}")
async def delete_veille_reglementaire(veille_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM veille_reglementaire WHERE id=%s", (veille_id,))
    conn.commit()
    conn.close()
    return {"message": "Veille réglementaire supprimée"}

# Routes Aspects Environnementaux
@app.get("/api/aspects-environnementaux")
async def get_aspects_environnementaux():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM aspects_environnementaux")
    aspects = cursor.fetchall()
    conn.close()
    return aspects

@app.post("/api/aspects-environnementaux")
async def create_aspect_environnemental(aspect: AspectEnvironnemental):
    aspect.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO aspects_environnementaux (
            id, type, categorie, aspect, activite_source, localisation, description,
            condition_fonctionnement, impact_environnemental, criticite, statut,
            indicateur, unite_mesure, methode_suivi, frequence_mesure, cible, objectif,
            donnees_mesurees, date_derniere_mesure, responsable, mesures_maitrise,
            plan_actions, conformite_reglementaire, commentaires
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        aspect.id, aspect.type, aspect.categorie, aspect.aspect, aspect.activite_source,
        aspect.localisation, aspect.description, aspect.condition_fonctionnement,
        aspect.impact_environnemental, aspect.criticite, aspect.statut, aspect.indicateur,
        aspect.unite_mesure, aspect.methode_suivi, aspect.frequence_mesure, aspect.cible,
        aspect.objectif, aspect.donnees_mesurees, aspect.date_derniere_mesure,
        aspect.responsable, aspect.mesures_maitrise, aspect.plan_actions,
        aspect.conformite_reglementaire, aspect.commentaries
    ))
    conn.commit()
    conn.close()
    return aspect

@app.put("/api/aspects-environnementaux/{aspect_id}")
async def update_aspect_environnemental(aspect_id: str, aspect: AspectEnvironnemental):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE aspects_environnementaux 
        SET type=%s, categorie=%s, aspect=%s, activite_source=%s, localisation=%s, description=%s,
            condition_fonctionnement=%s, impact_environnemental=%s, criticite=%s, statut=%s,
            indicateur=%s, unite_mesure=%s, methode_suivi=%s, frequence_mesure=%s, cible=%s, objectif=%s,
            donnees_mesurees=%s, date_derniere_mesure=%s, responsable=%s, mesures_maitrise=%s,
            plan_actions=%s, conformite_reglementaire=%s, commentaires=%s
        WHERE id=%s
    ''', (
        aspect.type, aspect.categorie, aspect.aspect, aspect.activite_source,
        aspect.localisation, aspect.description, aspect.condition_fonctionnement,
        aspect.impact_environnemental, aspect.criticite, aspect.statut, aspect.indicateur,
        aspect.unite_mesure, aspect.methode_suivi, aspect.frequence_mesure, aspect.cible,
        aspect.objectif, aspect.donnees_mesurees, aspect.date_derniere_mesure,
        aspect.responsable, aspect.mesures_maitrise, aspect.plan_actions,
        aspect.conformite_reglementaire, aspect.commentaries, aspect_id
    ))
    conn.commit()
    conn.close()
    aspect.id = aspect_id
    return aspect

@app.delete("/api/aspects-environnementaux/{aspect_id}")
async def delete_aspect_environnemental(aspect_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM aspects_environnementaux WHERE id=%s", (aspect_id,))
    conn.commit()
    conn.close()
    return {"message": "Aspect environnemental supprimé"}

# Routes Rapports
@app.get("/api/rapports")
async def get_rapports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rapports")
    rapports = cursor.fetchall()
    conn.close()
    return rapports

@app.post("/api/rapports")
async def create_rapport(rapport: Rapport):
    rapport.id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO rapports (id, titre, type, periode, dateGeneration, auteur, contenu, statut)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', (rapport.id, rapport.titre, rapport.type, rapport.periode, rapport.dateGeneration, rapport.auteur, rapport.contenu, rapport.statut))
    conn.commit()
    conn.close()
    return rapport

@app.put("/api/rapports/{rapport_id}")
async def update_rapport(rapport_id: str, rapport: Rapport):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE rapports 
        SET titre=%s, type=%s, periode=%s, dateGeneration=%s, auteur=%s, contenu=%s, statut=%s
        WHERE id=%s
    ''', (rapport.titre, rapport.type, rapport.periode, rapport.dateGeneration, rapport.auteur, rapport.contenu, rapport.statut, rapport_id))
    conn.commit()
    conn.close()
    rapport.id = rapport_id
    return rapport

@app.delete("/api/rapports/{rapport_id}")
async def delete_rapport(rapport_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rapports WHERE id=%s", (rapport_id,))
    conn.commit()
    conn.close()
    return {"message": "Rapport supprimé"}

@app.get("/")
async def root():
    return {"message": "API QHSE fonctionne!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)