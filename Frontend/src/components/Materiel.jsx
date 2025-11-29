import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Materiel = ({ onRefresh, onDataUpdate }) => {
  const [materiel, setMateriel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categorie: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    categorie: '',
    designation: '',
    numeroSerie: '',
    caracteristiques: '',
    dateControle: '',
    prochainControle: '',
    statut: 'Conforme'
  });

  useEffect(() => {
    loadMateriel();
  }, []);

  const loadMateriel = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/materiel');
      if (response.ok) {
        const data = await response.json();
        setMateriel(data);
        if (onDataUpdate) onDataUpdate('materiel', data);
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
      const url = editingItem 
        ? `http://localhost:8000/api/materiel/${editingItem.id}`
        : 'http://localhost:8000/api/materiel';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadMateriel();
        if (onRefresh) onRefresh();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/materiel/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadMateriel();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      categorie: '',
      designation: '',
      numeroSerie: '',
      caracteristiques: '',
      dateControle: '',
      prochainControle: '',
      statut: 'Conforme'
    });
    setEditingItem(null);
  };

  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    const diff = new Date(dateExp).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (jours, statut) => {
    if (statut === 'Non conforme') return 'bg-red-100 text-red-800';
    if (statut === 'En maintenance') return 'bg-orange-100 text-orange-800';
    if (jours < 0) return 'bg-red-100 text-red-800';
    if (jours <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (jours, statut) => {
    if (statut === 'Non conforme') return 'Non conforme';
    if (statut === 'En maintenance') return 'En maintenance';
    if (jours < 0) return 'À contrôler';
    if (jours <= 30) return `${jours}j restants`;
    return 'Conforme';
  };

  const handleExport = (format) => {
    const filteredData = getFilteredMateriel();
    if (format === 'pdf') {
      const columns = ['Catégorie', 'Désignation', 'N° Série', 'Caractéristiques', 'Dernier Contrôle', 'Prochain Contrôle', 'Statut'];
      const data = filteredData.map(m => [
        m.categorie, m.designation, m.numeroSerie, m.caracteristiques,
        new Date(m.dateControle).toLocaleDateString('fr-FR'),
        new Date(m.prochainControle).toLocaleDateString('fr-FR'),
        getStatusText(calcJours(m.prochainControle), m.statut)
      ]);
      exportToPDF('Liste du Matériel', columns, data, 'materiel');
    } else {
      const excelData = filteredData.map(m => ({
        'Catégorie': m.categorie,
        'Désignation': m.designation,
        'N° Série': m.numeroSerie,
        'Caractéristiques': m.caracteristiques,
        'Date Contrôle': new Date(m.dateControle).toLocaleDateString('fr-FR'),
        'Prochain Contrôle': new Date(m.prochainControle).toLocaleDateString('fr-FR'),
        'Statut': m.statut
      }));
      exportToExcel(excelData, 'materiel');
    }
  };

  const getFilteredMateriel = () => {
    return materiel.filter(item => {
      const matchesSearch = 
        item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caracteristiques.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategorie = !filters.categorie || item.categorie === filters.categorie;
      
      let matchesStatut = true;
      if (filters.statut) {
        const jours = calcJours(item.prochainControle);
        if (filters.statut === 'conforme') {
          matchesStatut = jours > 30 && item.statut === 'Conforme';
        } else if (filters.statut === 'bientot_controle') {
          matchesStatut = jours <= 30 && jours > 0 && item.statut === 'Conforme';
        } else if (filters.statut === 'a_controler') {
          matchesStatut = jours < 0 && item.statut === 'Conforme';
        } else {
          matchesStatut = item.statut === filters.statut;
        }
      }
      
      return matchesSearch && matchesCategorie && matchesStatut;
    });
  };

  const filteredMateriel = getFilteredMateriel();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Gestion du Matériel
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouveau Matériel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher du matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({...filters, categorie: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Toutes les catégories</option>
                <option value="Levage">Levage</option>
                <option value="Électrique">Électrique</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Outillage">Outillage</option>
                <option value="Manutention">Manutention</option>
                <option value="Protection incendie">Protection incendie</option>
                <option value="Ventilation">Ventilation</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="conforme">Conforme</option>
                <option value="bientot_controle">Contrôle prochain</option>
                <option value="a_controler">À contrôler</option>
                <option value="En maintenance">En maintenance</option>
                <option value="Non conforme">Non conforme</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Désignation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">N° Série</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Dernier Contrôle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Prochain Contrôle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredMateriel.map((item) => {
                const jours = calcJours(item.prochainControle);
                return (
                  <tr key={item.id} className="hover:bg-green-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {item.categorie}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.designation}</div>
                      <div className="text-sm text-gray-500">{item.caracteristiques}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.numeroSerie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.dateControle ? new Date(item.dateControle).toLocaleDateString('fr-FR') : 'Non défini'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.prochainControle ? new Date(item.prochainControle).toLocaleDateString('fr-FR') : 'Non défini'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(jours, item.statut)} shadow-sm`}>
                        {getStatusText(jours, item.statut)}
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
                );
              })}
            </tbody>
          </table>
          {filteredMateriel.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Wrench className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun matériel trouvé' : 'Aucun matériel enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau matériel'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouveau'} Matériel
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-green-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Catégorie *</label>
                  <select
                    required
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Levage">Levage</option>
                    <option value="Électrique">Électrique</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Outillage">Outillage</option>
                    <option value="Manutention">Manutention</option>
                    <option value="Protection incendie">Protection incendie</option>
                    <option value="Ventilation">Ventilation</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Conforme">Conforme</option>
                    <option value="Non conforme">Non conforme</option>
                    <option value="En maintenance">En maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Désignation *</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Ex: Chariot élévateur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">N° de Série *</label>
                <input
                  type="text"
                  required
                  value={formData.numeroSerie}
                  onChange={(e) => setFormData({...formData, numeroSerie: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Ex: SN-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Caractéristiques</label>
                <textarea
                  value={formData.caracteristiques}
                  onChange={(e) => setFormData({...formData, caracteristiques: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Spécifications techniques, capacité, modèle..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de Contrôle *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateControle}
                    onChange={(e) => setFormData({...formData, dateControle: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Prochain Contrôle *</label>
                  <input
                    type="date"
                    required
                    value={formData.prochainControle}
                    onChange={(e) => setFormData({...formData, prochainControle: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-2xl">
                <p className="text-sm text-green-800">
                  <strong>Note :</strong> Les contrôles périodiques sont obligatoires selon la réglementation en vigueur. Assurez-vous de respecter les échéances.
                </p>
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
                  className="px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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

export default Materiel;