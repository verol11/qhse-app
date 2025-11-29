import React, { useState, useEffect } from 'react';
import { Leaf, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText, TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const GestionEnvironnementale = ({ data, onRefresh, onDataUpdate, onDeleteData, loading }) => {
  const [aspects, setAspects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    categorie: '',
    statut: '',
    criticite: ''
  });

  const [formData, setFormData] = useState({
    type: 'Émission',
    categorie: 'Air',
    aspect: '',
    activite_source: '',
    localisation: '',
    description: '',
    condition_fonctionnement: 'Normal',
    impact_environnemental: '',
    criticite: 'Moyen',
    statut: 'Non significatif',
    indicateur: '',
    unite_mesure: '',
    methode_suivi: '',
    frequence_mesure: 'Mensuelle',
    cible: '',
    objectif: '',
    donnees_mesurees: '',
    date_derniere_mesure: new Date().toISOString().split('T')[0],
    responsable: '',
    mesures_maitrise: '',
    plan_actions: '',
    conformite_reglementaire: 'Conforme',
    commentaires: ''
  });

  useEffect(() => {
    loadAspects();
  }, []);

  const loadAspects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/aspects-environnementaux');
      if (response.ok) {
        const data = await response.json();
        setAspects(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await onDataUpdate('gestionenvironnementale', formData);
      if (result) {
        await loadAspects();
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
      await onDeleteData('gestionenvironnementale', id);
      await loadAspects();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type || 'Émission',
      categorie: item.categorie || 'Air',
      aspect: item.aspect || '',
      activite_source: item.activite_source || '',
      localisation: item.localisation || '',
      description: item.description || '',
      condition_fonctionnement: item.condition_fonctionnement || 'Normal',
      impact_environnemental: item.impact_environnemental || '',
      criticite: item.criticite || 'Moyen',
      statut: item.statut || 'Non significatif',
      indicateur: item.indicateur || '',
      unite_mesure: item.unite_mesure || '',
      methode_suivi: item.methode_suivi || '',
      frequence_mesure: item.frequence_mesure || 'Mensuelle',
      cible: item.cible || '',
      objectif: item.objectif || '',
      donnees_mesurees: item.donnees_mesurees || '',
      date_derniere_mesure: item.date_derniere_mesure || new Date().toISOString().split('T')[0],
      responsable: item.responsable || '',
      mesures_maitrise: item.mesures_maitrise || '',
      plan_actions: item.plan_actions || '',
      conformite_reglementaire: item.conformite_reglementaire || 'Conforme',
      commentaires: item.commentaires || '',
      id: item.id
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'Émission',
      categorie: 'Air',
      aspect: '',
      activite_source: '',
      localisation: '',
      description: '',
      condition_fonctionnement: 'Normal',
      impact_environnemental: '',
      criticite: 'Moyen',
      statut: 'Non significatif',
      indicateur: '',
      unite_mesure: '',
      methode_suivi: '',
      frequence_mesure: 'Mensuelle',
      cible: '',
      objectif: '',
      donnees_mesurees: '',
      date_derniere_mesure: new Date().toISOString().split('T')[0],
      responsable: '',
      mesures_maitrise: '',
      plan_actions: '',
      conformite_reglementaire: 'Conforme',
      commentaires: ''
    });
    setEditingItem(null);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Significatif': return 'bg-red-100 text-red-800';
      case 'Non significatif': return 'bg-green-100 text-green-800';
      case 'En évaluation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticiteColor = (criticite) => {
    switch (criticite) {
      case 'Faible': return 'bg-green-100 text-green-800';
      case 'Moyen': return 'bg-yellow-100 text-yellow-800';
      case 'Élevé': return 'bg-orange-100 text-orange-800';
      case 'Critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Émission': return 'bg-blue-100 text-blue-800';
      case 'Déchet': return 'bg-gray-100 text-gray-800';
      case 'Consommation': return 'bg-purple-100 text-purple-800';
      case 'Rejet': return 'bg-red-100 text-red-800';
      case 'Prélèvement': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategorieColor = (categorie) => {
    switch (categorie) {
      case 'Air': return 'bg-sky-100 text-sky-800';
      case 'Eau': return 'bg-blue-100 text-blue-800';
      case 'Sol': return 'bg-amber-100 text-amber-800';
      case 'Énergie': return 'bg-orange-100 text-orange-800';
      case 'Bruit': return 'bg-indigo-100 text-indigo-800';
      case 'Biodiversité': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConformiteColor = (conformite) => {
    switch (conformite) {
      case 'Conforme': return 'bg-green-100 text-green-800';
      case 'Non conforme': return 'bg-red-100 text-red-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredAspects();
    if (format === 'pdf') {
      const columns = ['Aspect', 'Type', 'Catégorie', 'Statut', 'Criticité', 'Indicateur', 'Cible', 'Conformité'];
      const data = filteredData.map(i => [
        i.aspect, i.type, i.categorie, i.statut, i.criticite, i.indicateur, i.cible, i.conformite_reglementaire
      ]);
      exportToPDF('Registre Environnemental', columns, data, 'registre-environnemental');
    } else {
      const excelData = filteredData.map(i => ({
        'Aspect': i.aspect,
        'Type': i.type,
        'Catégorie': i.categorie,
        'Activité Source': i.activite_source,
        'Localisation': i.localisation,
        'Description': i.description,
        'Condition': i.condition_fonctionnement,
        'Impact': i.impact_environnemental,
        'Criticité': i.criticite,
        'Statut': i.statut,
        'Indicateur': i.indicateur,
        'Unité': i.unite_mesure,
        'Méthode Suivi': i.methode_suivi,
        'Fréquence': i.frequence_mesure,
        'Cible': i.cible,
        'Objectif': i.objectif,
        'Données Mesurées': i.donnees_mesurees,
        'Dernière Mesure': i.date_derniere_mesure,
        'Responsable': i.responsable,
        'Mesures Maîtrise': i.mesures_maitrise,
        'Plan Actions': i.plan_actions,
        'Conformité': i.conformite_reglementaire
      }));
      exportToExcel(excelData, 'registre-environnemental');
    }
  };

  const getFilteredAspects = () => {
    return aspects.filter(aspect => {
      const matchesSearch = 
        aspect.aspect?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aspect.activite_source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aspect.localisation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aspect.indicateur?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.type || aspect.type === filters.type;
      const matchesCategorie = !filters.categorie || aspect.categorie === filters.categorie;
      const matchesStatut = !filters.statut || aspect.statut === filters.statut;
      const matchesCriticite = !filters.criticite || aspect.criticite === filters.criticite;
      
      return matchesSearch && matchesType && matchesCategorie && matchesStatut && matchesCriticite;
    });
  };

  const filteredAspects = getFilteredAspects();

  // Statistiques pour le dashboard
  const stats = {
    total: aspects.length,
    significatifs: aspects.filter(a => a.statut === 'Significatif').length,
    emissions: aspects.filter(a => a.type === 'Émission').length,
    dechets: aspects.filter(a => a.type === 'Déchet').length,
    nonConformes: aspects.filter(a => a.conformite_reglementaire === 'Non conforme').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Registre Environnemental
          </h2>
          <p className="text-gray-600 mt-2">Gestion des aspects et impacts environnementaux significatifs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvel Aspect
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Aspects</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aspects Significatifs</p>
              <p className="text-2xl font-bold text-red-600">{stats.significatifs}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Émissions</p>
              <p className="text-2xl font-bold text-blue-600">{stats.emissions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non Conformes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.nonConformes}</p>
            </div>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un aspect, activité, localisation..."
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Émission">Émission</option>
                <option value="Déchet">Déchet</option>
                <option value="Consommation">Consommation</option>
                <option value="Rejet">Rejet</option>
                <option value="Prélèvement">Prélèvement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({...filters, categorie: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Toutes les catégories</option>
                <option value="Air">Air</option>
                <option value="Eau">Eau</option>
                <option value="Sol">Sol</option>
                <option value="Énergie">Énergie</option>
                <option value="Bruit">Bruit</option>
                <option value="Biodiversité">Biodiversité</option>
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
                <option value="Significatif">Significatif</option>
                <option value="Non significatif">Non significatif</option>
                <option value="En évaluation">En évaluation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Criticité</label>
              <select
                value={filters.criticite}
                onChange={(e) => setFilters({...filters, criticite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Toutes</option>
                <option value="Faible">Faible</option>
                <option value="Moyen">Moyen</option>
                <option value="Élevé">Élevé</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Aspect Environnemental</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type/Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Indicateur & Cible</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Criticité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut AES</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Conformité</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAspects.map((aspect) => (
                <tr key={aspect.id} className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{aspect.aspect}</div>
                    <div className="text-sm text-gray-600 mt-1">{aspect.activite_source}</div>
                    <div className="text-xs text-gray-500">{aspect.localisation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getTypeColor(aspect.type)}`}>
                        {aspect.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getCategorieColor(aspect.categorie)}`}>
                        {aspect.categorie}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{aspect.indicateur}</div>
                      <div className="text-xs text-gray-600">Cible: {aspect.cible} {aspect.unite_mesure}</div>
                      {aspect.donnees_mesurees && (
                        <div className="text-xs text-blue-600">Mesure: {aspect.donnees_mesurees}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCriticiteColor(aspect.criticite)} shadow-sm`}>
                      {aspect.criticite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatutColor(aspect.statut)} shadow-sm`}>
                      {aspect.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getConformiteColor(aspect.conformite_reglementaire)} shadow-sm`}>
                      {aspect.conformite_reglementaire}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(aspect)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(aspect.id)}
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
          {filteredAspects.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Leaf className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun aspect trouvé' : 'Aucun aspect enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouvel aspect environnemental'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvel'} Aspect Environnemental
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-green-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section Identification */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Identification</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Émission">Émission</option>
                      <option value="Déchet">Déchet</option>
                      <option value="Consommation">Consommation</option>
                      <option value="Rejet">Rejet</option>
                      <option value="Prélèvement">Prélèvement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Catégorie *</label>
                    <select
                      required
                      value={formData.categorie}
                      onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Air">Air</option>
                      <option value="Eau">Eau</option>
                      <option value="Sol">Sol</option>
                      <option value="Énergie">Énergie</option>
                      <option value="Bruit">Bruit</option>
                      <option value="Biodiversité">Biodiversité</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Aspect Environnemental *</label>
                  <input
                    type="text"
                    required
                    value={formData.aspect}
                    onChange={(e) => setFormData({...formData, aspect: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: Émissions de CO2, Production de déchets plastiques..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Activité Source *</label>
                    <input
                      type="text"
                      required
                      value={formData.activite_source}
                      onChange={(e) => setFormData({...formData, activite_source: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Localisation *</label>
                    <input
                      type="text"
                      required
                      value={formData.localisation}
                      onChange={(e) => setFormData({...formData, localisation: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Section Évaluation */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Évaluation</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Condition de Fonctionnement *</label>
                    <select
                      required
                      value={formData.condition_fonctionnement}
                      onChange={(e) => setFormData({...formData, condition_fonctionnement: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Anormal">Anormal</option>
                      <option value="Urgence">Urgence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Impact Environnemental *</label>
                    <input
                      type="text"
                      required
                      value={formData.impact_environnemental}
                      onChange={(e) => setFormData({...formData, impact_environnemental: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Criticité *</label>
                    <select
                      required
                      value={formData.criticite}
                      onChange={(e) => setFormData({...formData, criticite: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Faible">Faible</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Élevé">Élevé</option>
                      <option value="Critique">Critique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Statut AES *</label>
                    <select
                      required
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Non significatif">Non significatif</option>
                      <option value="Significatif">Significatif</option>
                      <option value="En évaluation">En évaluation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Suivi et Mesure */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Suivi et Mesure</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Indicateur *</label>
                    <input
                      type="text"
                      required
                      value={formData.indicateur}
                      onChange={(e) => setFormData({...formData, indicateur: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Unité de Mesure *</label>
                    <input
                      type="text"
                      required
                      value={formData.unite_mesure}
                      onChange={(e) => setFormData({...formData, unite_mesure: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Méthode de Suivi *</label>
                    <input
                      type="text"
                      required
                      value={formData.methode_suivi}
                      onChange={(e) => setFormData({...formData, methode_suivi: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Fréquence de Mesure *</label>
                    <select
                      required
                      value={formData.frequence_mesure}
                      onChange={(e) => setFormData({...formData, frequence_mesure: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Quotidienne">Quotidienne</option>
                      <option value="Hebdomadaire">Hebdomadaire</option>
                      <option value="Mensuelle">Mensuelle</option>
                      <option value="Trimestrielle">Trimestrielle</option>
                      <option value="Semestrielle">Semestrielle</option>
                      <option value="Annuelle">Annuelle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cible *</label>
                    <input
                      type="text"
                      required
                      value={formData.cible}
                      onChange={(e) => setFormData({...formData, cible: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Objectif *</label>
                    <input
                      type="text"
                      required
                      value={formData.objectif}
                      onChange={(e) => setFormData({...formData, objectif: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Données Mesurées</label>
                    <input
                      type="text"
                      value={formData.donnees_mesurees}
                      onChange={(e) => setFormData({...formData, donnees_mesurees: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Date Dernière Mesure *</label>
                    <input
                      type="date"
                      required
                      value={formData.date_derniere_mesure}
                      onChange={(e) => setFormData({...formData, date_derniere_mesure: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Section Maîtrise et Conformité */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Maîtrise et Conformité</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Responsable *</label>
                    <input
                      type="text"
                      required
                      value={formData.responsable}
                      onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Conformité Réglementaire *</label>
                    <select
                      required
                      value={formData.conformite_reglementaire}
                      onChange={(e) => setFormData({...formData, conformite_reglementaire: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    >
                      <option value="Conforme">Conforme</option>
                      <option value="Non conforme">Non conforme</option>
                      <option value="En cours">En cours</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Mesures de Maîtrise *</label>
                  <textarea
                    required
                    value={formData.mesures_maitrise}
                    onChange={(e) => setFormData({...formData, mesures_maitrise: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Plan d'Actions *</label>
                  <textarea
                    required
                    value={formData.plan_actions}
                    onChange={(e) => setFormData({...formData, plan_actions: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Commentaires</label>
                  <textarea
                    value={formData.commentaires}
                    onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-2xl">
                <p className="text-sm text-green-800">
                  <strong>Note :</strong> Le registre environnemental permet d'identifier, évaluer et maîtriser 
                  les aspects environnementaux significatifs conformément à la norme ISO 14001.
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

export default GestionEnvironnementale;