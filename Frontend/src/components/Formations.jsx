import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Formations = ({ onRefresh, onDataUpdate }) => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departement: '',
    typeFormation: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    departement: '',
    fonction: '',
    typeFormation: '',
    intitule: '',
    centreFormation: '',
    dateFormation: '',
    dateExpiration: ''
  });

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/formations');
      if (response.ok) {
        const data = await response.json();
        setFormations(data);
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

      const result = await onDataUpdate('formations', dataToSend);
      if (result) {
        await loadFormations();
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
      const response = await fetch(`http://localhost:8000/api/formations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadFormations();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (formation) => {
    setEditingItem(formation);
    setFormData(formation);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      departement: '',
      fonction: '',
      typeFormation: '',
      intitule: '',
      centreFormation: '',
      dateFormation: '',
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

  // Export des données
  const handleExport = (format) => {
    const filteredData = getFilteredFormations();
    if (format === 'pdf') {
      const columns = ['Nom', 'Prénom', 'Département', 'Fonction', 'Type Formation', 'Intitulé', 'Centre Formation', 'Date Formation', 'Date Expiration'];
      const data = filteredData.map(f => [
        f.nom, f.prenom, f.departement, f.fonction, f.typeFormation, f.intitule, f.centreFormation, 
        new Date(f.dateFormation).toLocaleDateString('fr-FR'),
        new Date(f.dateExpiration).toLocaleDateString('fr-FR')
      ]);
      exportToPDF('Liste des Formations', columns, data, 'formations');
    } else {
      const excelData = filteredData.map(f => ({
        'Nom': f.nom,
        'Prénom': f.prenom,
        'Département': f.departement,
        'Fonction': f.fonction,
        'Type Formation': f.typeFormation,
        'Intitulé': f.intitule,
        'Centre Formation': f.centreFormation,
        'Date Formation': new Date(f.dateFormation).toLocaleDateString('fr-FR'),
        'Date Expiration': new Date(f.dateExpiration).toLocaleDateString('fr-FR'),
        'Jours restants': calcJours(f.dateExpiration)
      }));
      exportToExcel(excelData, 'formations');
    }
  };

  // Filtrage avancé
  const getFilteredFormations = () => {
    return formations.filter(formation => {
      const matchesSearch = 
        formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.intitule.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !filters.departement || formation.departement === filters.departement;
      const matchesType = !filters.typeFormation || formation.typeFormation === filters.typeFormation;
      
      let matchesStatut = true;
      if (filters.statut) {
        const jours = calcJours(formation.dateExpiration);
        if (filters.statut === 'valide') matchesStatut = jours > 30;
        else if (filters.statut === 'expirant') matchesStatut = jours <= 30 && jours > 0;
        else if (filters.statut === 'expire') matchesStatut = jours < 0;
      }
      
      return matchesSearch && matchesDept && matchesType && matchesStatut;
    });
  };

  const filteredFormations = getFilteredFormations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Gestion des Formations
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Formation
        </button>
      </div>

      {/* Barre de contrôle avec export et filtres */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
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

        {/* Filtres avancés */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
              <select
                value={filters.departement}
                onChange={(e) => setFilters({...filters, departement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Tous les départements</option>
                <option value="Production">Production</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Administration">Administration</option>
                <option value="RH">RH</option>
                <option value="Finance">Finance</option>
                <option value="QHSE">QHSE</option>
                <option value="QA/QC">QA/QC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de formation</label>
              <select
                value={filters.typeFormation}
                onChange={(e) => setFilters({...filters, typeFormation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Qualité">Qualité</option>
                <option value="Environnement">Environnement</option>
                <option value="Technique">Technique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="valide">Valide</option>
                <option value="expirant">Bientôt expiré</option>
                <option value="expire">Expiré</option>
              </select>
            </div>
          </div>
        )}

        {/* Tableau modernisé */}
        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Employé</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Département</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Formation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Centre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredFormations.map((formation) => {
                const jours = calcJours(formation.dateExpiration);
                return (
                  <tr key={formation.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{formation.nom} {formation.prenom}</div>
                      <div className="text-sm text-gray-500">{formation.fonction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {formation.departement}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{formation.intitule}</div>
                      <div className="text-xs text-gray-500">{formation.typeFormation}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{formation.centreFormation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formation.dateFormation ? new Date(formation.dateFormation).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formation.dateExpiration ? new Date(formation.dateExpiration).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(jours)} shadow-sm`}>
                        {jours < 0 ? 'Expiré' : jours <= 30 ? `${jours}j restants` : 'Valide'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(formation)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(formation.id)}
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
          {filteredFormations.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucune formation trouvée' : 'Aucune formation enregistrée'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une nouvelle formation'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal modernisé */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvelle'} Formation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-blue-200 transition-colors">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Entrez le nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Entrez le prénom"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Logistique">Logistique</option>
                    <option value="Administration">Administration</option>
                    <option value="RH">RH</option>
                    <option value="Finance">Finance</option>
                    <option value="QHSE">QHSE</option>
                    <option value="QA/QC">QA/QC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fonction *</label>
                  <input
                    type="text"
                    required
                    value={formData.fonction}
                    onChange={(e) => setFormData({...formData, fonction: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Entrez la fonction"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de Formation *</label>
                  <select
                    required
                    value={formData.typeFormation}
                    onChange={(e) => setFormData({...formData, typeFormation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Qualité">Qualité</option>
                    <option value="Environnement">Environnement</option>
                    <option value="Technique">Technique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Intitulé *</label>
                  <input
                    type="text"
                    required
                    value={formData.intitule}
                    onChange={(e) => setFormData({...formData, intitule: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Entrez l'intitulé"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Centre de Formation *</label>
                <input
                  type="text"
                  required
                  value={formData.centreFormation}
                  onChange={(e) => setFormData({...formData, centreFormation: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Entrez le centre de formation"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de Formation *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateFormation}
                    onChange={(e) => setFormData({...formData, dateFormation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date d'Expiration *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateExpiration}
                    onChange={(e) => setFormData({...formData, dateExpiration: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
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
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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

export default Formations;