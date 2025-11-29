import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText, Users } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const PlanFormations = ({ onRefresh, onDataUpdate }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeFormation: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    intitule: '',
    typeFormation: '',
    description: '',
    publicCible: '',
    formateur: '',
    dateDebut: '',
    dateFin: '',
    duree: '',
    lieu: '',
    cout: 0,
    statut: 'Planifié'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/planformations');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
        if (onDataUpdate) onDataUpdate('planFormations', data);
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
        ? `http://localhost:8000/api/planformations/${editingItem.id}`
        : 'http://localhost:8000/api/planformations';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadPlans();
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
      const response = await fetch(`http://localhost:8000/api/planformations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadPlans();
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
      intitule: '',
      typeFormation: '',
      description: '',
      publicCible: '',
      formateur: '',
      dateDebut: '',
      dateFin: '',
      duree: '',
      lieu: '',
      cout: 0,
      statut: 'Planifié'
    });
    setEditingItem(null);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Planifié': return 'bg-blue-100 text-blue-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Terminé': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      case 'Reporté': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sécurité': return 'bg-red-100 text-red-800';
      case 'Qualité': return 'bg-blue-100 text-blue-800';
      case 'Environnement': return 'bg-green-100 text-green-800';
      case 'Technique': return 'bg-purple-100 text-purple-800';
      case 'Management': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredPlans();
    if (format === 'pdf') {
      const columns = ['Intitulé', 'Type', 'Public Cible', 'Formateur', 'Durée', 'Lieu', 'Coût', 'Période', 'Statut'];
      const data = filteredData.map(p => [
        p.intitule, p.typeFormation, p.publicCible, p.formateur, p.duree, p.lieu,
        `${p.cout} €`, 
        `${new Date(p.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(p.dateFin).toLocaleDateString('fr-FR')}`,
        p.statut
      ]);
      exportToPDF('Plan de Formations', columns, data, 'plan-formations');
    } else {
      const excelData = filteredData.map(p => ({
        'Intitulé': p.intitule,
        'Type Formation': p.typeFormation,
        'Description': p.description,
        'Public Cible': p.publicCible,
        'Formateur': p.formateur,
        'Date Début': new Date(p.dateDebut).toLocaleDateString('fr-FR'),
        'Date Fin': new Date(p.dateFin).toLocaleDateString('fr-FR'),
        'Durée': p.duree,
        'Lieu': p.lieu,
        'Coût (€)': p.cout,
        'Statut': p.statut
      }));
      exportToExcel(excelData, 'plan-formations');
    }
  };

  const getFilteredPlans = () => {
    return plans.filter(plan => {
      const matchesSearch = 
        plan.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.formateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.typeFormation || plan.typeFormation === filters.typeFormation;
      const matchesStatut = !filters.statut || plan.statut === filters.statut;
      
      return matchesSearch && matchesType && matchesStatut;
    });
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Plan de Formations
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouveau Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un plan de formation..."
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

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
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
                <option value="Management">Management</option>
                <option value="Réglementaire">Réglementaire</option>
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
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
                <option value="Reporté">Reporté</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Intitulé</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Public Cible</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Formateur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Durée/Lieu</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Coût</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{plan.intitule}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{plan.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getTypeColor(plan.typeFormation)}`}>
                      {plan.typeFormation}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{plan.publicCible}</td>
                  <td className="px-6 py-4 text-sm">{plan.formateur}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>{plan.duree}</div>
                    <div className="text-xs text-gray-500">{plan.lieu}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{plan.cout} €</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatutColor(plan.statut)} shadow-sm`}>
                      {plan.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
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
          {filteredPlans.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun plan de formation trouvé' : 'Aucun plan de formation enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau plan de formation'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouveau'} Plan de Formation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-blue-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Intitulé *</label>
                <input
                  type="text"
                  required
                  value={formData.intitule}
                  onChange={(e) => setFormData({...formData, intitule: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Ex: Formation sécurité incendie"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de formation *</label>
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
                    <option value="Management">Management</option>
                    <option value="Réglementaire">Réglementaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                    <option value="Reporté">Reporté</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Description de la formation..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Public Cible *</label>
                  <input
                    type="text"
                    required
                    value={formData.publicCible}
                    onChange={(e) => setFormData({...formData, publicCible: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: Tous les employés, Équipe maintenance..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Formateur *</label>
                  <input
                    type="text"
                    required
                    value={formData.formateur}
                    onChange={(e) => setFormData({...formData, formateur: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de début *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de fin *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateFin}
                    onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Durée *</label>
                  <input
                    type="text"
                    required
                    value={formData.duree}
                    onChange={(e) => setFormData({...formData, duree: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: 2 jours, 16 heures..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Lieu *</label>
                  <input
                    type="text"
                    required
                    value={formData.lieu}
                    onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Lieu de la formation"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Coût (€) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cout}
                  onChange={(e) => setFormData({...formData, cout: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
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

export default PlanFormations;