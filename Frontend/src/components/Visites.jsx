import React, { useState, useEffect } from 'react';
import { Heart, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Visites = ({ onRefresh, onDataUpdate }) => {
  const [visites, setVisites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departement: '',
    typeVisite: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    departement: '',
    fonction: '',
    typeVisite: '',
    intitule: '',
    centreMedical: '',
    dateVisite: '',
    dateExpiration: ''
  });

  useEffect(() => {
    loadVisites();
  }, []);

  const loadVisites = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/visites');
      if (response.ok) {
        const data = await response.json();
        setVisites(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const dataToSend = {
        ...formData,
        id: editingItem?.id
      };

      const result = await onDataUpdate('visites', dataToSend);
      if (result) {
        await loadVisites();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/visites/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadVisites();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (visite) => {
    setEditingItem(visite);
    setFormData(visite);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      departement: '',
      fonction: '',
      typeVisite: '',
      intitule: '',
      centreMedical: '',
      dateVisite: '',
      dateExpiration: ''
    });
    setEditingItem(null);
  };

  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    const diff = new Date(dateExp).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (jours) => {
    if (jours < 0) return 'bg-red-100 text-red-800';
    if (jours <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (jours) => {
    if (jours < 0) return 'Expiré';
    if (jours <= 30) return `${jours}j restants`;
    return 'Valide';
  };

  const handleExport = (format) => {
    const filteredData = getFilteredVisites();
    if (format === 'pdf') {
      const columns = ['Nom', 'Prénom', 'Département', 'Fonction', 'Type Visite', 'Intitulé', 'Centre Médical', 'Date Visite', 'Date Expiration', 'Statut'];
      const data = filteredData.map(v => [
        v.nom, v.prenom, v.departement, v.fonction, v.typeVisite, v.intitule, v.centreMedical,
        new Date(v.dateVisite).toLocaleDateString('fr-FR'),
        new Date(v.dateExpiration).toLocaleDateString('fr-FR'),
        getStatusText(calcJours(v.dateExpiration))
      ]);
      exportToPDF('Liste des Visites Médicales', columns, data, 'visites');
    } else {
      const excelData = filteredData.map(v => ({
        'Nom': v.nom,
        'Prénom': v.prenom,
        'Département': v.departement,
        'Fonction': v.fonction,
        'Type Visite': v.typeVisite,
        'Intitulé': v.intitule,
        'Centre Médical': v.centreMedical,
        'Date Visite': new Date(v.dateVisite).toLocaleDateString('fr-FR'),
        'Date Expiration': new Date(v.dateExpiration).toLocaleDateString('fr-FR'),
        'Statut': getStatusText(calcJours(v.dateExpiration))
      }));
      exportToExcel(excelData, 'visites');
    }
  };

  const getFilteredVisites = () => {
    return visites.filter(visite => {
      const matchesSearch = 
        visite.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visite.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visite.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visite.centreMedical.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !filters.departement || visite.departement === filters.departement;
      const matchesType = !filters.typeVisite || visite.typeVisite === filters.typeVisite;
      
      let matchesStatut = true;
      if (filters.statut) {
        const jours = calcJours(visite.dateExpiration);
        if (filters.statut === 'valide') matchesStatut = jours > 30;
        else if (filters.statut === 'bientot_expire') matchesStatut = jours <= 30 && jours > 0;
        else if (filters.statut === 'expire') matchesStatut = jours < 0;
      }
      
      return matchesSearch && matchesDept && matchesType && matchesStatut;
    });
  };

  const filteredVisites = getFilteredVisites();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Gestion des Visites Médicales
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Visite
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une visite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
              <select
                value={filters.departement}
                onChange={(e) => setFilters({...filters, departement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">Tous les départements</option>
                <option value="Production">Production</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Logistique">Logistique</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de visite</label>
              <select
                value={filters.typeVisite}
                onChange={(e) => setFilters({...filters, typeVisite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Embauche">Embauche</option>
                <option value="Périodique">Périodique</option>
                <option value="Reprise">Reprise</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="valide">Valide</option>
                <option value="bientot_expire">Bientôt expiré</option>
                <option value="expire">Expiré</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Employé</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Département</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type de Visite</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Centre Médical</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date Visite</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredVisites.map((visite) => {
                const jours = calcJours(visite.dateExpiration);
                return (
                  <tr key={visite.id} className="hover:bg-purple-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{visite.nom} {visite.prenom}</div>
                      <div className="text-sm text-gray-500">{visite.fonction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {visite.departement}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{visite.intitule}</div>
                      <div className="text-xs text-gray-500">{visite.typeVisite}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{visite.centreMedical}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {visite.dateVisite ? new Date(visite.dateVisite).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {visite.dateExpiration ? new Date(visite.dateExpiration).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(jours)} shadow-sm`}>
                        {getStatusText(jours)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(visite)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(visite.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-100 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredVisites.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucune visite trouvée' : 'Aucune visite enregistrée'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une nouvelle visite'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvelle'} Visite Médicale
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-purple-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Département *</label>
                  <select
                    required
                    value={formData.departement}
                    onChange={(e) => setFormData({...formData, departement: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Logistique">Logistique</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fonction *</label>
                  <input
                    type="text"
                    required
                    value={formData.fonction}
                    onChange={(e) => setFormData({...formData, fonction: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de Visite *</label>
                  <select
                    required
                    value={formData.typeVisite}
                    onChange={(e) => setFormData({...formData, typeVisite: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Embauche">Embauche</option>
                    <option value="Périodique">Périodique</option>
                    <option value="Reprise">Reprise</option>
                    <option value="Aptitude">Aptitude</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Intitulé *</label>
                  <input
                    type="text"
                    required
                    value={formData.intitule}
                    onChange={(e) => setFormData({...formData, intitule: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Centre Médical *</label>
                <input
                  type="text"
                  required
                  value={formData.centreMedical}
                  onChange={(e) => setFormData({...formData, centreMedical: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de Visite *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateVisite}
                    onChange={(e) => setFormData({...formData, dateVisite: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date d'Expiration *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateExpiration}
                    onChange={(e) => setFormData({...formData, dateExpiration: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
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
                  className="px-8 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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

export default Visites;