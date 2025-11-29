import React, { useState, useEffect } from 'react';
import { Scale, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const VeilleReglementaire = ({ onRefresh, onDataUpdate }) => {
  const [reglementations, setReglementations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeReglementation: '',
    statut: '',
    impact: ''
  });

  const [formData, setFormData] = useState({
    titre: '',
    reference: '',
    typeReglementation: '',
    organisme: '',
    datePublication: '',
    dateApplication: '',
    description: '',
    statut: 'En vigueur',
    impact: 'Moyen'
  });

  useEffect(() => {
    loadReglementations();
  }, []);

  const loadReglementations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/veillereglementaire');
      if (response.ok) {
        const data = await response.json();
        setReglementations(data);
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

      const result = await onDataUpdate('veillereglementaire', dataToSend);
      if (result) {
        await loadReglementations();
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
      const response = await fetch(`http://localhost:8000/api/veillereglementaire/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadReglementations();
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
      titre: '',
      reference: '',
      typeReglementation: '',
      organisme: '',
      datePublication: '',
      dateApplication: '',
      description: '',
      statut: 'En vigueur',
      impact: 'Moyen'
    });
    setEditingItem(null);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En vigueur': return 'bg-green-100 text-green-800';
      case 'À venir': return 'bg-blue-100 text-blue-800';
      case 'Modifié': return 'bg-yellow-100 text-yellow-800';
      case 'Abrogé': return 'bg-red-100 text-red-800';
      case 'En consultation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'Élevé': return 'bg-red-100 text-red-800';
      case 'Moyen': return 'bg-orange-100 text-orange-800';
      case 'Faible': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredReglementations();
    if (format === 'pdf') {
      const columns = ['Référence', 'Titre', 'Type', 'Organisme', 'Date Publication', 'Date Application', 'Statut', 'Impact'];
      const data = filteredData.map(r => [
        r.reference, r.titre, r.typeReglementation, r.organisme,
        new Date(r.datePublication).toLocaleDateString('fr-FR'),
        new Date(r.dateApplication).toLocaleDateString('fr-FR'),
        r.statut, r.impact
      ]);
      exportToPDF('Veille Réglementaire', columns, data, 'veille-reglementaire');
    } else {
      const excelData = filteredData.map(r => ({
        'Référence': r.reference,
        'Titre': r.titre,
        'Type': r.typeReglementation,
        'Organisme': r.organisme,
        'Date Publication': new Date(r.datePublication).toLocaleDateString('fr-FR'),
        'Date Application': new Date(r.dateApplication).toLocaleDateString('fr-FR'),
        'Statut': r.statut,
        'Impact': r.impact,
        'Description': r.description
      }));
      exportToExcel(excelData, 'veille-reglementaire');
    }
  };

  const getFilteredReglementations = () => {
    return reglementations.filter(reg => {
      const matchesSearch = 
        reg.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.organisme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.typeReglementation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.typeReglementation || reg.typeReglementation === filters.typeReglementation;
      const matchesStatut = !filters.statut || reg.statut === filters.statut;
      const matchesImpact = !filters.impact || reg.impact === filters.impact;
      
      return matchesSearch && matchesType && matchesStatut && matchesImpact;
    });
  };

  const filteredReglementations = getFilteredReglementations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Veille Réglementaire
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Réglementation
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une réglementation..."
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de réglementation</label>
              <select
                value={filters.typeReglementation}
                onChange={(e) => setFilters({...filters, typeReglementation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Environnement">Environnement</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Qualité">Qualité</option>
                <option value="Santé">Santé</option>
                <option value="Social">Social</option>
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
                <option value="En vigueur">En vigueur</option>
                <option value="À venir">À venir</option>
                <option value="Modifié">Modifié</option>
                <option value="Abrogé">Abrogé</option>
                <option value="En consultation">En consultation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Impact</label>
              <select
                value={filters.impact}
                onChange={(e) => setFilters({...filters, impact: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">Tous les impacts</option>
                <option value="Élevé">Élevé</option>
                <option value="Moyen">Moyen</option>
                <option value="Faible">Faible</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Référence</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Titre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Organisme</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date Application</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut/Impact</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredReglementations.map((reg) => (
                <tr key={reg.id} className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm font-semibold text-gray-900">{reg.reference}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{reg.titre}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{reg.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{reg.typeReglementation}</td>
                  <td className="px-6 py-4 text-sm">{reg.organisme}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {reg.dateApplication ? new Date(reg.dateApplication).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(reg.statut)} shadow-sm w-fit`}>
                        {reg.statut}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(reg.impact)} shadow-sm w-fit`}>
                        {reg.impact}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(reg)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reg.id)}
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
          {filteredReglementations.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucune réglementation trouvée' : 'Aucune réglementation enregistrée'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une nouvelle réglementation'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvelle'} Réglementation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-purple-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Référence *</label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: Décret 2024-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Titre *</label>
                  <input
                    type="text"
                    required
                    value={formData.titre}
                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Titre de la réglementation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de réglementation *</label>
                  <select
                    required
                    value={formData.typeReglementation}
                    onChange={(e) => setFormData({...formData, typeReglementation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Environnement">Environnement</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Qualité">Qualité</option>
                    <option value="Santé">Santé</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Organisme *</label>
                  <input
                    type="text"
                    required
                    value={formData.organisme}
                    onChange={(e) => setFormData({...formData, organisme: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: Ministère de l'Environnement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date Publication *</label>
                  <input
                    type="date"
                    required
                    value={formData.datePublication}
                    onChange={(e) => setFormData({...formData, datePublication: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date Application *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateApplication}
                    onChange={(e) => setFormData({...formData, dateApplication: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="En vigueur">En vigueur</option>
                    <option value="À venir">À venir</option>
                    <option value="Modifié">Modifié</option>
                    <option value="Abrogé">Abrogé</option>
                    <option value="En consultation">En consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Impact *</label>
                  <select
                    required
                    value={formData.impact}
                    onChange={(e) => setFormData({...formData, impact: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Élevé">Élevé</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Faible">Faible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Description de la réglementation..."
                />
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

export default VeilleReglementaire;