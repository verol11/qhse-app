import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText, Activity, ClipboardCheck, Megaphone } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const PlanningHSE = ({ onRefresh, onDataUpdate }) => {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeActivite: '',
    statut: '',
    responsable: ''
  });

  const [formData, setFormData] = useState({
    titre: '',
    typeActivite: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    responsable: '',
    lieu: '',
    statut: 'Planifié',
    priorite: 'Moyenne'
  });

  useEffect(() => {
    loadActivites();
  }, []);

  const loadActivites = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/planninghse');
      if (response.ok) {
        const data = await response.json();
        setActivites(data);
        if (onDataUpdate) onDataUpdate('planningHSE', data);
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
        ? `http://localhost:8000/api/planninghse/${editingItem.id}`
        : 'http://localhost:8000/api/planninghse';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadActivites();
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
      const response = await fetch(`http://localhost:8000/api/planninghse/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadActivites();
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
      typeActivite: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      heureDebut: '',
      heureFin: '',
      responsable: '',
      lieu: '',
      statut: 'Planifié',
      priorite: 'Moyenne'
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
      case 'Exercice': return 'bg-purple-100 text-purple-800';
      case 'Audit': return 'bg-indigo-100 text-indigo-800';
      case 'Sensibilisation': return 'bg-pink-100 text-pink-800';
      case 'Inspection': return 'bg-teal-100 text-teal-800';
      case 'Réunion': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'Haute': return 'bg-red-100 text-red-800';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Exercice': return <Activity className="w-4 h-4" />;
      case 'Audit': return <ClipboardCheck className="w-4 h-4" />;
      case 'Sensibilisation': return <Megaphone className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredActivites();
    if (format === 'pdf') {
      const columns = ['Titre', 'Type', 'Dates', 'Lieu', 'Responsable', 'Priorité', 'Statut'];
      const data = filteredData.map(a => [
        a.titre, a.typeActivite, 
        `${new Date(a.dateDebut).toLocaleDateString('fr-FR')} ${a.heureDebut || ''}`,
        a.lieu, a.responsable, a.priorite, a.statut
      ]);
      exportToPDF('Planning des Activités HSE', columns, data, 'planning-hse');
    } else {
      const excelData = filteredData.map(a => ({
        'Titre': a.titre,
        'Type Activité': a.typeActivite,
        'Description': a.description,
        'Date Début': new Date(a.dateDebut).toLocaleDateString('fr-FR'),
        'Date Fin': new Date(a.dateFin).toLocaleDateString('fr-FR'),
        'Heure Début': a.heureDebut,
        'Heure Fin': a.heureFin,
        'Lieu': a.lieu,
        'Responsable': a.responsable,
        'Priorité': a.priorite,
        'Statut': a.statut
      }));
      exportToExcel(excelData, 'planning-hse');
    }
  };

  const getFilteredActivites = () => {
    return activites.filter(activite => {
      const matchesSearch = 
        activite.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activite.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activite.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activite.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.typeActivite || activite.typeActivite === filters.typeActivite;
      const matchesStatut = !filters.statut || activite.statut === filters.statut;
      const matchesResponsable = !filters.responsable || activite.responsable === filters.responsable;
      
      return matchesSearch && matchesType && matchesStatut && matchesResponsable;
    });
  };

  const filteredActivites = getFilteredActivites();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Planning des Activités HSE
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Activité
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une activité..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité</label>
              <select
                value={filters.typeActivite}
                onChange={(e) => setFilters({...filters, typeActivite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Exercice">Exercice</option>
                <option value="Audit">Audit</option>
                <option value="Sensibilisation">Sensibilisation</option>
                <option value="Inspection">Inspection</option>
                <option value="Réunion">Réunion</option>
                <option value="Formation">Formation</option>
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
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
                <option value="Reporté">Reporté</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
              <input
                type="text"
                value={filters.responsable}
                onChange={(e) => setFilters({...filters, responsable: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 shadow-sm"
                placeholder="Filtrer par responsable"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Activité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Dates et Heures</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Lieu</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Priorité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredActivites.map((activite) => (
                <tr key={activite.id} className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{activite.titre}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{activite.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(activite.typeActivite)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(activite.typeActivite)}`}>
                        {activite.typeActivite}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{new Date(activite.dateDebut).toLocaleDateString('fr-FR')}</div>
                    {activite.heureDebut && (
                      <div className="text-xs text-gray-500">
                        {activite.heureDebut} {activite.heureFin && `- ${activite.heureFin}`}
                      </div>
                    )}
                    {activite.dateFin && activite.dateFin !== activite.dateDebut && (
                      <div className="text-xs text-gray-500">
                        au {new Date(activite.dateFin).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{activite.lieu}</td>
                  <td className="px-6 py-4 text-sm">{activite.responsable}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrioriteColor(activite.priorite)} shadow-sm`}>
                      {activite.priorite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatutColor(activite.statut)} shadow-sm`}>
                      {activite.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(activite)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activite.id)}
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
          {filteredActivites.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucune activité trouvée' : 'Aucune activité planifiée'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une nouvelle activité'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvelle'} Activité HSE
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-green-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Titre *</label>
                  <input
                    type="text"
                    required
                    value={formData.titre}
                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Ex: Exercice d'évacuation incendie"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type d'activité *</label>
                  <select
                    required
                    value={formData.typeActivite}
                    onChange={(e) => setFormData({...formData, typeActivite: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Exercice">Exercice</option>
                    <option value="Audit">Audit</option>
                    <option value="Sensibilisation">Sensibilisation</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Réunion">Réunion</option>
                    <option value="Formation">Formation</option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Description détaillée de l'activité..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de début *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de fin</label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Heure de début</label>
                  <input
                    type="time"
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({...formData, heureDebut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Heure de fin</label>
                  <input
                    type="time"
                    value={formData.heureFin}
                    onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Lieu *</label>
                  <input
                    type="text"
                    required
                    value={formData.lieu}
                    onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Lieu de l'activité"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Priorité *</label>
                  <select
                    required
                    value={formData.priorite}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
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
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                    <option value="Reporté">Reporté</option>
                  </select>
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

export default PlanningHSE;