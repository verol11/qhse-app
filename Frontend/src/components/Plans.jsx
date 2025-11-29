import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Plans = ({ onRefresh, onDataUpdate }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departement: '',
    priorite: '',
    statut: '',
    processus: ''
  });

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    responsable: '',
    departement: '',
    dateDebut: '',
    dateEcheance: '',
    priorite: 'Moyenne',
    avancement: 0,
    statut: 'En cours',
    processus: '',
    mesureEfficacite: '',
    commentaire: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
        if (onDataUpdate) onDataUpdate('plans', data);
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
        ? `http://localhost:8000/api/plans/${editingItem.id}`
        : 'http://localhost:8000/api/plans';
      
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
      const response = await fetch(`http://localhost:8000/api/plans/${id}`, {
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

  const handleEdit = (plan) => {
    setEditingItem(plan);
    setFormData(plan);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      responsable: '',
      departement: '',
      dateDebut: '',
      dateEcheance: '',
      priorite: 'Moyenne',
      avancement: 0,
      statut: 'En cours',
      processus: '',
      mesureEfficacite: '',
      commentaire: ''
    });
    setEditingItem(null);
  };

  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    const diff = new Date(dateExp).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priorite) => {
    switch(priorite) {
      case 'Haute': return 'bg-red-100 text-red-800';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'Faible': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Terminé': return 'bg-green-100 text-green-800';
      case 'En retard': return 'bg-red-100 text-red-800';
      case 'Planifié': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (avancement) => {
    if (avancement >= 75) return 'bg-green-500';
    if (avancement >= 50) return 'bg-blue-500';
    if (avancement >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEcheanceColor = (jours) => {
    if (jours < 0) return 'text-red-600';
    if (jours <= 7) return 'text-orange-600';
    return 'text-gray-500';
  };

  const getEcheanceText = (jours) => {
    if (jours < 0) return `Retard ${Math.abs(jours)}j`;
    return `${jours}j restants`;
  };

  const handleExport = (format) => {
    const filteredData = getFilteredPlans();
    if (format === 'pdf') {
      const columns = ['Titre', 'Responsable', 'Département', 'Date Début', 'Date Échéance', 'Priorité', 'Avancement', 'Statut', 'Processus'];
      const data = filteredData.map(p => [
        p.titre, p.responsable, p.departement,
        new Date(p.dateDebut).toLocaleDateString('fr-FR'),
        new Date(p.dateEcheance).toLocaleDateString('fr-FR'),
        p.priorite, `${p.avancement}%`, p.statut, p.processus
      ]);
      exportToPDF('Liste des Plans d\'Action', columns, data, 'plans-action');
    } else {
      const excelData = filteredData.map(p => ({
        'Titre': p.titre,
        'Description': p.description,
        'Responsable': p.responsable,
        'Département': p.departement,
        'Date Début': new Date(p.dateDebut).toLocaleDateString('fr-FR'),
        'Date Échéance': new Date(p.dateEcheance).toLocaleDateString('fr-FR'),
        'Priorité': p.priorite,
        'Avancement': `${p.avancement}%`,
        'Statut': p.statut,
        'Processus': p.processus,
        'Mesure Efficacité': p.mesureEfficacite,
        'Commentaire': p.commentaire
      }));
      exportToExcel(excelData, 'plans-action');
    }
  };

  const getFilteredPlans = () => {
    return plans.filter(plan => {
      const matchesSearch = 
        plan.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.departement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !filters.departement || plan.departement === filters.departement;
      const matchesPriorite = !filters.priorite || plan.priorite === filters.priorite;
      const matchesStatut = !filters.statut || plan.statut === filters.statut;
      const matchesProcessus = !filters.processus || plan.processus === filters.processus;
      
      return matchesSearch && matchesDept && matchesPriorite && matchesStatut && matchesProcessus;
    });
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Plans d'Action QHSE
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouveau Plan d'Action
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un plan d'action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
              <select
                value={filters.departement}
                onChange={(e) => setFilters({...filters, departement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Tous les départements</option>
                <option value="Production">Production</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Logistique">Logistique</option>
                <option value="Administration">Administration</option>
                <option value="QHSE">QHSE</option>
                <option value="Transversal">Transversal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={filters.priorite}
                onChange={(e) => setFilters({...filters, priorite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Toutes les priorités</option>
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="En retard">En retard</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Processus</label>
              <select
                value={filters.processus}
                onChange={(e) => setFilters({...filters, processus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Tous les processus</option>
                <option value="Qualité">Qualité</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Environnement">Environnement</option>
                <option value="Hygiène">Hygiène</option>
                <option value="Mixte">Mixte</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Titre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Département</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Priorité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Avancement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPlans.map((plan) => {
                const jours = calcJours(plan.dateEcheance);
                return (
                  <tr key={plan.id} className="hover:bg-indigo-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{plan.titre}</div>
                      <div className="text-xs text-gray-500">{plan.processus}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{plan.responsable}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {plan.departement}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {plan.dateEcheance ? new Date(plan.dateEcheance).toLocaleDateString('fr-FR') : ''}
                      </div>
                      <div className={`text-xs ${getEcheanceColor(jours)}`}>
                        {getEcheanceText(jours)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(plan.priorite)} shadow-sm`}>
                        {plan.priorite}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 shadow-inner">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(plan.avancement)} shadow-sm transition-all duration-500`}
                            style={{ width: `${plan.avancement}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-12">{plan.avancement}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.statut)} shadow-sm`}>
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
                );
              })}
            </tbody>
          </table>
          {filteredPlans.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun plan d\'action trouvé' : 'Aucun plan d\'action enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau plan d\'action'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouveau'} Plan d'Action
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-indigo-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Titre du Plan *</label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Ex: Amélioration du tri des déchets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Décrivez les objectifs et les actions à mettre en place..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Responsable *</label>
                  <input
                    type="text"
                    required
                    value={formData.responsable}
                    onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Nom du responsable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Département *</label>
                  <select
                    required
                    value={formData.departement}
                    onChange={(e) => setFormData({...formData, departement: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Logistique">Logistique</option>
                    <option value="Administration">Administration</option>
                    <option value="QHSE">QHSE</option>
                    <option value="Transversal">Transversal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de Début *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date d'Échéance *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateEcheance}
                    onChange={(e) => setFormData({...formData, dateEcheance: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Priorité *</label>
                  <select
                    required
                    value={formData.priorite}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Avancement (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.avancement}
                    onChange={(e) => setFormData({...formData, avancement: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="En retard">En retard</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Processus Concerné *</label>
                <select
                  required
                  value={formData.processus}
                  onChange={(e) => setFormData({...formData, processus: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Qualité">Qualité</option>
                  <option value="Sécurité">Sécurité</option>
                  <option value="Environnement">Environnement</option>
                  <option value="Hygiène">Hygiène</option>
                  <option value="Mixte">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Mesure d'Efficacité</label>
                <input
                  type="text"
                  value={formData.mesureEfficacite}
                  onChange={(e) => setFormData({...formData, mesureEfficacite: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Comment mesurer la réussite du plan?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Commentaire</label>
                <textarea
                  value={formData.commentaire}
                  onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Observations ou notes supplémentaires..."
                />
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-2xl">
                <p className="text-sm text-indigo-800">
                  <strong>Note :</strong> Les plans d'action doivent être suivis régulièrement pour assurer leur bon déroulement et leur efficacité.
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
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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

export default Plans;