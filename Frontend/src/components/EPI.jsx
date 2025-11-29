import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const EPI = ({ onRefresh, onDataUpdate }) => {
  const [epiList, setEpiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departement: '',
    typeEPI: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    employe: '',
    departement: '',
    typeEPI: '',
    marque: '',
    taille: '',
    dateRemise: '',
    dateExpiration: '',
    statut: 'En service'
  });

  useEffect(() => {
    loadEPI();
  }, []);

  const loadEPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/epi');
      if (response.ok) {
        const data = await response.json();
        setEpiList(data);
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

      const result = await onDataUpdate('epi', dataToSend);
      if (result) {
        await loadEPI();
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
      const response = await fetch(`http://localhost:8000/api/epi/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadEPI();
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
      employe: '',
      departement: '',
      typeEPI: '',
      marque: '',
      taille: '',
      dateRemise: '',
      dateExpiration: '',
      statut: 'En service'
    });
    setEditingItem(null);
  };

  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    const diff = new Date(dateExp).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (jours, statut) => {
    if (statut === 'Hors service') return 'bg-red-100 text-red-800';
    if (statut === 'En réparation') return 'bg-orange-100 text-orange-800';
    if (jours < 0) return 'bg-red-100 text-red-800';
    if (jours <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (jours, statut) => {
    if (statut === 'Hors service') return 'Hors service';
    if (statut === 'En réparation') return 'En réparation';
    if (jours < 0) return 'Expiré';
    if (jours <= 30) return `${jours}j restants`;
    return 'En service';
  };

  const handleExport = (format) => {
    const filteredData = getFilteredEPI();
    if (format === 'pdf') {
      const columns = ['Employé', 'Département', 'Type EPI', 'Marque', 'Taille', 'Date Remise', 'Date Expiration', 'Statut'];
      const data = filteredData.map(e => [
        e.employe, e.departement, e.typeEPI, e.marque, e.taille,
        new Date(e.dateRemise).toLocaleDateString('fr-FR'),
        new Date(e.dateExpiration).toLocaleDateString('fr-FR'),
        getStatusText(calcJours(e.dateExpiration), e.statut)
      ]);
      exportToPDF('Liste des EPI', columns, data, 'epi');
    } else {
      const excelData = filteredData.map(e => ({
        'Employé': e.employe,
        'Département': e.departement,
        'Type EPI': e.typeEPI,
        'Marque': e.marque,
        'Taille': e.taille,
        'Date Remise': new Date(e.dateRemise).toLocaleDateString('fr-FR'),
        'Date Expiration': new Date(e.dateExpiration).toLocaleDateString('fr-FR'),
        'Statut': getStatusText(calcJours(e.dateExpiration), e.statut)
      }));
      exportToExcel(excelData, 'epi');
    }
  };

  const getFilteredEPI = () => {
    return epiList.filter(epi => {
      const matchesSearch = 
        epi.employe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epi.typeEPI.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epi.marque.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !filters.departement || epi.departement === filters.departement;
      const matchesType = !filters.typeEPI || epi.typeEPI === filters.typeEPI;
      
      let matchesStatut = true;
      if (filters.statut) {
        const jours = calcJours(epi.dateExpiration);
        if (filters.statut === 'en_service') {
          matchesStatut = jours > 30 && epi.statut === 'En service';
        } else if (filters.statut === 'bientot_expire') {
          matchesStatut = jours <= 30 && jours > 0 && epi.statut === 'En service';
        } else if (filters.statut === 'expire') {
          matchesStatut = jours < 0 && epi.statut === 'En service';
        } else {
          matchesStatut = epi.statut === filters.statut;
        }
      }
      
      return matchesSearch && matchesDept && matchesType && matchesStatut;
    });
  };

  const filteredEPI = getFilteredEPI();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Gestion des EPI
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouvel EPI
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un EPI..."
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
                <option value="Logistique">Logistique</option>
                <option value="Administration">Administration</option>
                <option value="QHSE">QHSE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'EPI</label>
              <select
                value={filters.typeEPI}
                onChange={(e) => setFilters({...filters, typeEPI: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Casque de sécurité">Casque de sécurité</option>
                <option value="Lunettes de protection">Lunettes de protection</option>
                <option value="Gants">Gants</option>
                <option value="Chaussures de sécurité">Chaussures de sécurité</option>
                <option value="Harnais">Harnais</option>
                <option value="Protection auditive">Protection auditive</option>
                <option value="Masque">Masque</option>
                <option value="Vêtement de travail">Vêtement de travail</option>
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
                <option value="en_service">En service</option>
                <option value="bientot_expire">Bientôt expiré</option>
                <option value="expire">Expiré</option>
                <option value="En réparation">En réparation</option>
                <option value="Hors service">Hors service</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Employé</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Département</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type EPI</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Marque/Taille</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date Remise</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredEPI.map((item) => {
                const jours = calcJours(item.dateExpiration);
                return (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.employe}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {item.departement}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.typeEPI}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{item.marque}</div>
                      <div className="text-xs text-gray-500">Taille: {item.taille}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.dateRemise ? new Date(item.dateRemise).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.dateExpiration ? new Date(item.dateExpiration).toLocaleDateString('fr-FR') : ''}
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
          {filteredEPI.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun EPI trouvé' : 'Aucun EPI enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouvel EPI'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouvel'} EPI
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-blue-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Employé *</label>
                  <input
                    type="text"
                    required
                    value={formData.employe}
                    onChange={(e) => setFormData({...formData, employe: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
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
                    <option value="QHSE">QHSE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type d'EPI *</label>
                  <select
                    required
                    value={formData.typeEPI}
                    onChange={(e) => setFormData({...formData, typeEPI: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Casque de sécurité">Casque de sécurité</option>
                    <option value="Lunettes de protection">Lunettes de protection</option>
                    <option value="Gants">Gants</option>
                    <option value="Chaussures de sécurité">Chaussures de sécurité</option>
                    <option value="Harnais">Harnais</option>
                    <option value="Protection auditive">Protection auditive</option>
                    <option value="Masque">Masque</option>
                    <option value="Vêtement de travail">Vêtement de travail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData.marque}
                    onChange={(e) => setFormData({...formData, marque: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Taille *</label>
                  <input
                    type="text"
                    required
                    value={formData.taille}
                    onChange={(e) => setFormData({...formData, taille: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="En service">En service</option>
                    <option value="Hors service">Hors service</option>
                    <option value="En réparation">En réparation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date de Remise *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateRemise}
                    onChange={(e) => setFormData({...formData, dateRemise: e.target.value})}
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

export default EPI;