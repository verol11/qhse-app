import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText, User, MapPin } from 'lucide-react';
import { exportToPDF, exportToExcel, formatPermisData } from '../utils/exportUtils';

const Permis = ({ data, onRefresh, onDataUpdate, onDeleteData, loading }) => {
  const [permis, setPermis] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeTravail: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    numero: '',
    typeTravail: '',
    localisation: '',
    demandeur: '',
    executant: '',
    departement: '',
    descriptionTache: '',
    equipement: '',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    statut: 'En attente',
    risques: []
  });

  const [nouveauRisque, setNouveauRisque] = useState({
    risque: '',
    niveau: 'Moyen',
    mesures: ''
  });

  useEffect(() => {
    loadPermis();
  }, []);

  const loadPermis = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/permis');
      if (response.ok) {
        const data = await response.json();
        setPermis(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Données envoyées:', formData);
      
      // Préparer les données pour l'envoi
      const dataToSend = {
        ...formData,
        risques: formData.risques.map(risque => ({
          risque: risque.risque,
          niveau: risque.niveau,
          mesures: risque.mesures
        }))
      };

      const result = await onDataUpdate('permis', dataToSend);
      if (result) {
        await loadPermis();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      await onDeleteData('permis', id);
      await loadPermis();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      numero: item.numero || '',
      typeTravail: item.typeTravail || '',
      localisation: item.localisation || '',
      demandeur: item.demandeur || '',
      executant: item.executant || '',
      departement: item.departement || '',
      descriptionTache: item.descriptionTache || '',
      equipement: item.equipement || '',
      dateDebut: item.dateDebut || '',
      dateFin: item.dateFin || '',
      heureDebut: item.heureDebut || '',
      heureFin: item.heureFin || '',
      statut: item.statut || 'En attente',
      risques: item.risques || [],
      id: item.id
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      typeTravail: '',
      localisation: '',
      demandeur: '',
      executant: '',
      departement: '',
      descriptionTache: '',
      equipement: '',
      dateDebut: '',
      dateFin: '',
      heureDebut: '',
      heureFin: '',
      statut: 'En attente',
      risques: []
    });
    setNouveauRisque({
      risque: '',
      niveau: 'Moyen',
      mesures: ''
    });
    setEditingItem(null);
  };

  const ajouterRisque = () => {
    if (nouveauRisque.risque && nouveauRisque.mesures) {
      setFormData({
        ...formData,
        risques: [...formData.risques, { 
          ...nouveauRisque, 
          id: `temp-${Date.now()}` 
        }]
      });
      setNouveauRisque({
        risque: '',
        niveau: 'Moyen',
        mesures: ''
      });
    }
  };

  const supprimerRisque = (id) => {
    setFormData({
      ...formData,
      risques: formData.risques.filter(r => r.id !== id)
    });
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Approuvé': return 'bg-green-100 text-green-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Terminé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNiveauRisqueColor = (niveau) => {
    switch (niveau) {
      case 'Faible': return 'bg-green-100 text-green-800';
      case 'Moyen': return 'bg-yellow-100 text-yellow-800';
      case 'Élevé': return 'bg-orange-100 text-orange-800';
      case 'Critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredPermis();
    if (format === 'pdf') {
      const columns = ['N° Permis', 'Type Travail', 'Localisation', 'Demandeur', 'Exécutant', 'Département', 'Date Début', 'Date Fin', 'Statut'];
      const data = filteredData.map(p => [
        p.numero, p.typeTravail, p.localisation, p.demandeur, p.executant, p.departement,
        new Date(p.dateDebut).toLocaleDateString('fr-FR'),
        new Date(p.dateFin).toLocaleDateString('fr-FR'),
        p.statut
      ]);
      exportToPDF('Liste des Permis de Travail', columns, data, 'permis');
    } else {
      exportToExcel(formatPermisData(filteredData), 'permis');
    }
  };

  const getFilteredPermis = () => {
    return permis.filter(permis => {
      const matchesSearch = 
        permis.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permis.typeTravail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permis.demandeur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permis.localisation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.typeTravail || permis.typeTravail === filters.typeTravail;
      const matchesStatut = !filters.statut || permis.statut === filters.statut;
      
      return matchesSearch && matchesType && matchesStatut;
    });
  };

  const filteredPermis = getFilteredPermis();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Gestion des Permis de Travail
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl hover:bg-orange-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouveau Permis
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un permis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-lg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 flex items-center gap-2 shadow-lg"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 flex items-center gap-2 shadow-lg transition-all duration-300"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de travail</label>
              <select
                value={filters.typeTravail}
                onChange={(e) => setFilters({...filters, typeTravail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Travaux électriques">Travaux électriques</option>
                <option value="Travaux en hauteur">Travaux en hauteur</option>
                <option value="Travaux de soudage">Travaux de soudage</option>
                <option value="Travaux en espace confiné">Travaux en espace confiné</option>
                <option value="Travaux de terrassement">Travaux de terrassement</option>
                <option value="Maintenance mécanique">Maintenance mécanique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="Approuvé">Approuvé</option>
                <option value="Refusé">Refusé</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">N° Permis</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type Travail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Localisation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Demandeur/Exécutant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Période</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPermis.map((item) => (
                <tr key={item.id} className="hover:bg-orange-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.numero}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{item.typeTravail}</td>
                  <td className="px-6 py-4 text-sm">{item.localisation}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.demandeur}
                      </div>
                      <div className="text-xs text-gray-500">{item.executant}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{new Date(item.dateDebut).toLocaleDateString('fr-FR')}</div>
                    <div className="text-xs text-gray-500">
                      {item.heureDebut} - {item.heureFin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatutColor(item.statut)} shadow-sm`}>
                      {item.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-100 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPermis.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <HardHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun permis trouvé' : 'Aucun permis enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau permis'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouveau'} Permis de Travail
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-orange-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Numéro de permis *</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de travail *</label>
                  <select
                    required
                    value={formData.typeTravail}
                    onChange={(e) => setFormData({...formData, typeTravail: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Travaux électriques">Travaux électriques</option>
                    <option value="Travaux en hauteur">Travaux en hauteur</option>
                    <option value="Travaux de soudage">Travaux de soudage</option>
                    <option value="Travaux en espace confiné">Travaux en espace confiné</option>
                    <option value="Travaux de terrassement">Travaux de terrassement</option>
                    <option value="Maintenance mécanique">Maintenance mécanique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Localisation *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.localisation}
                      onChange={(e) => setFormData({...formData, localisation: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Département *</label>
                  <select
                    required
                    value={formData.departement}
                    onChange={(e) => setFormData({...formData, departement: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Logistique">Logistique</option>
                    <option value="Administration">Administration</option>
                    <option value="QHSE">QHSE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Demandeur *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.demandeur}
                      onChange={(e) => setFormData({...formData, demandeur: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Exécutant *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.executant}
                      onChange={(e) => setFormData({...formData, executant: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date début *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Heure début *</label>
                  <input
                    type="time"
                    required
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({...formData, heureDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date fin *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateFin}
                    onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Heure fin *</label>
                  <input
                    type="time"
                    required
                    value={formData.heureFin}
                    onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Description de la tâche *</label>
                <textarea
                  required
                  value={formData.descriptionTache}
                  onChange={(e) => setFormData({...formData, descriptionTache: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Équipement nécessaire</label>
                <input
                  type="text"
                  value={formData.equipement}
                  onChange={(e) => setFormData({...formData, equipement: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Identification des risques</h4>
                
                <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Risque</label>
                      <input
                        type="text"
                        value={nouveauRisque.risque}
                        onChange={(e) => setNouveauRisque({...nouveauRisque, risque: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500"
                        placeholder="Description du risque"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Niveau</label>
                      <select
                        value={nouveauRisque.niveau}
                        onChange={(e) => setNouveauRisque({...nouveauRisque, niveau: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Faible">Faible</option>
                        <option value="Moyen">Moyen</option>
                        <option value="Élevé">Élevé</option>
                        <option value="Critique">Critique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Mesures de prévention</label>
                      <input
                        type="text"
                        value={nouveauRisque.mesures}
                        onChange={(e) => setNouveauRisque({...nouveauRisque, mesures: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500"
                        placeholder="Mesures préventives"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={ajouterRisque}
                    className="bg-orange-600 text-white px-6 py-3 rounded-2xl hover:bg-orange-700 text-sm transition-all duration-200"
                  >
                    Ajouter le risque
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.risques.map((risque, index) => (
                    <div key={risque.id || index} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getNiveauRisqueColor(risque.niveau)} shadow-sm`}>
                            {risque.niveau}
                          </span>
                          <span className="font-medium text-sm">{risque.risque}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">{risque.mesures}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => supprimerRisque(risque.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-100 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                <select
                  required
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
                >
                  <option value="En attente">En attente</option>
                  <option value="Approuvé">Approuvé</option>
                  <option value="Refusé">Refusé</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permis;