import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Export PDF
export const exportToPDF = (title, columns, data, fileName) => {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
  
  // Tableau
  doc.autoTable({
    head: [columns],
    body: data,
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 30 }
  });
  
  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export Excel
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Formateurs de données pour chaque module
export const formatFormationsData = (formations) => {
  return formations.map(formation => ({
    'Nom': formation.nom,
    'Prénom': formation.prenom,
    'Département': formation.departement,
    'Fonction': formation.fonction,
    'Type Formation': formation.typeFormation,
    'Intitulé': formation.intitule,
    'Centre Formation': formation.centreFormation,
    'Date Formation': formation.dateFormation,
    'Date Expiration': formation.dateExpiration
  }));
};

export const formatIncidentsData = (incidents) => {
  return incidents.map(incident => ({
    'Type': incident.type,
    'Type Incident': incident.typeIncident,
    'Gravité': incident.gravite,
    'Date': incident.date,
    'Heure': incident.heure,
    'Lieu': incident.lieu,
    'Description': incident.description,
    'Personne': incident.personne,
    'Témoin': incident.temoin,
    'Action': incident.action,
    'Statut': incident.statut
  }));
};

export const formatMaterielData = (materiel) => {
  return materiel.map(item => ({
    'Catégorie': item.categorie,
    'Désignation': item.designation,
    'N° Série': item.numeroSerie,
    'Caractéristiques': item.caracteristiques,
    'Date Contrôle': item.dateControle,
    'Prochain Contrôle': item.prochainControle,
    'Statut': item.statut
  }));
};

export const formatVisitesData = (visites) => {
  return visites.map(visite => ({
    'Nom': visite.nom,
    'Prénom': visite.prenom,
    'Département': visite.departement,
    'Fonction': visite.fonction,
    'Type Visite': visite.typeVisite,
    'Intitulé': visite.intitule,
    'Centre Médical': visite.centreMedical,
    'Date Visite': visite.dateVisite,
    'Date Expiration': visite.dateExpiration
  }));
};

export const formatPlansData = (plans) => {
  return plans.map(plan => ({
    'Titre': plan.titre,
    'Description': plan.description,
    'Responsable': plan.responsable,
    'Département': plan.departement,
    'Date Début': plan.dateDebut,
    'Date Échéance': plan.dateEcheance,
    'Priorité': plan.priorite,
    'Avancement': `${plan.avancement}%`,
    'Statut': plan.statut,
    'Processus': plan.processus,
    'Mesure Efficacité': plan.mesureEfficacite,
    'Commentaire': plan.commentaire
  }));
};

export const formatEPIData = (epiList) => {
  return epiList.map(epi => ({
    'Employé': epi.employe,
    'Département': epi.departement,
    'Type EPI': epi.typeEPI,
    'Marque': epi.marque,
    'Taille': epi.taille,
    'Date Remise': epi.dateRemise,
    'Date Expiration': epi.dateExpiration,
    'Statut': epi.statut
  }));
};

export const formatPermisData = (permis) => {
  return permis.map(permis => ({
    'Numéro': permis.numero,
    'Type Travail': permis.typeTravail,
    'Localisation': permis.localisation,
    'Demandeur': permis.demandeur,
    'Exécutant': permis.executant,
    'Département': permis.departement,
    'Description Tâche': permis.descriptionTache,
    'Équipement': permis.equipement,
    'Date Début': permis.dateDebut,
    'Date Fin': permis.dateFin,
    'Heure Début': permis.heureDebut,
    'Heure Fin': permis.heureFin,
    'Statut': permis.statut
  }));
};