import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, X, Save, Search, Download, Filter, Eye, Upload } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const GED = ({ onRefresh, onDataUpdate }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categorie: '',
    type: '',
    statut: ''
  });

  const [formData, setFormData] = useState({
    titre: '',
    type: '',
    categorie: '',
    description: '',
    dateCreation: '',
    dateModification: '',
    auteur: '',
    statut: 'Actif',
    fichier: ''
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/ged');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        if (onDataUpdate) onDataUpdate('ged', data);
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
        ? `http://localhost:8000/api/ged/${editingItem.id}`
        : 'http://localhost:8000/api/ged';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dateModification: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        await loadDocuments();
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
      const response = await fetch(`http://localhost:8000/api/ged/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadDocuments();
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
      type: '',
      categorie: '',
      description: '',
      dateCreation: '',
      dateModification: '',
      auteur: '',
      statut: 'Actif',
      fichier: ''
    });
    setEditingItem(null);
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/ged/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({ ...prev, fichier: result.filename }));
        return result.filename;
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  };

  // Fonction pour visualiser le fichier
  const handleViewFile = (filename) => {
    if (!filename) {
      alert('Aucun fichier disponible');
      return;
    }
    
    // Construire l'URL du fichier
    const fileUrl = `http://localhost:8000/uploads/${filename}`;
    
    // Ouvrir le fichier dans un nouvel onglet
    window.open(fileUrl, '_blank');
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Actif': return 'bg-green-100 text-green-800';
      case 'En révision': return 'bg-yellow-100 text-yellow-800';
      case 'Obsolète': return 'bg-red-100 text-red-800';
      case 'Archivé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Procédure': return 'bg-blue-100 text-blue-800';
      case 'Instruction': return 'bg-purple-100 text-purple-800';
      case 'Formulaire': return 'bg-orange-100 text-orange-800';
      case 'Rapport': return 'bg-indigo-100 text-indigo-800';
      case 'Politique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = (format) => {
    const filteredData = getFilteredDocuments();
    if (format === 'pdf') {
      const columns = ['Titre', 'Type', 'Catégorie', 'Auteur', 'Date Création', 'Statut'];
      const data = filteredData.map(d => [
        d.titre, d.type, d.categorie, d.auteur,
        new Date(d.dateCreation).toLocaleDateString('fr-FR'),
        d.statut
      ]);
      exportToPDF('Liste des Documents GED', columns, data, 'ged-documents');
    } else {
      const excelData = filteredData.map(d => ({
        'Titre': d.titre,
        'Type': d.type,
        'Catégorie': d.categorie,
        'Description': d.description,
        'Date Création': new Date(d.dateCreation).toLocaleDateString('fr-FR'),
        'Date Modification': new Date(d.dateModification).toLocaleDateString('fr-FR'),
        'Auteur': d.auteur,
        'Statut': d.statut,
        'Fichier': d.fichier
      }));
      exportToExcel(excelData, 'ged-documents');
    }
  };

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.auteur.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategorie = !filters.categorie || doc.categorie === filters.categorie;
      const matchesType = !filters.type || doc.type === filters.type;
      const matchesStatut = !filters.statut || doc.statut === filters.statut;
      
      return matchesSearch && matchesCategorie && matchesType && matchesStatut;
    });
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Gestion Documentaire (GED)
        </h2>
        <button
          onClick={() => {
            resetForm();
            setFormData(prev => ({ 
              ...prev, 
              dateCreation: new Date().toISOString().split('T')[0],
              dateModification: new Date().toISOString().split('T')[0]
            }));
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-2xl hover:shadow-3xl hover:transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nouveau Document
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un document..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({...filters, categorie: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Toutes les catégories</option>
                <option value="Qualité">Qualité</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Environnement">Environnement</option>
                <option value="Hygiène">Hygiène</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">Tous les types</option>
                <option value="Procédure">Procédure</option>
                <option value="Instruction">Instruction</option>
                <option value="Formulaire">Formulaire</option>
                <option value="Rapport">Rapport</option>
                <option value="Politique">Politique</option>
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
                <option value="Actif">Actif</option>
                <option value="En révision">En révision</option>
                <option value="Obsolète">Obsolète</option>
                <option value="Archivé">Archivé</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Titre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type/Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Auteur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date Création</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-indigo-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{doc.titre}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">{doc.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium w-fit">
                        {doc.categorie}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{doc.auteur}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {doc.dateCreation ? new Date(doc.dateCreation).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatutColor(doc.statut)} shadow-sm`}>
                      {doc.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleViewFile(doc.fichier)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-xl hover:bg-green-100 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
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
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">{searchTerm || Object.values(filters).some(f => f) ? 'Aucun document trouvé' : 'Aucun document enregistré'}</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || Object.values(filters).some(f => f) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau document'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Modifier' : 'Nouveau'} Document
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-indigo-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Titre *</label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Titre du document"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Procédure">Procédure</option>
                    <option value="Instruction">Instruction</option>
                    <option value="Formulaire">Formulaire</option>
                    <option value="Rapport">Rapport</option>
                    <option value="Politique">Politique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Catégorie *</label>
                  <select
                    required
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Qualité">Qualité</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Environnement">Environnement</option>
                    <option value="Hygiène">Hygiène</option>
                    <option value="Management">Management</option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Description du document..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Auteur *</label>
                  <input
                    type="text"
                    required
                    value={formData.auteur}
                    onChange={(e) => setFormData({...formData, auteur: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date Création *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateCreation}
                    onChange={(e) => setFormData({...formData, dateCreation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Fichier</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.fichier}
                    onChange={(e) => setFormData({...formData, fichier: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Nom du fichier"
                  />
                  <label className="px-4 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 cursor-pointer flex items-center gap-2 transition-all duration-200">
                    <Upload className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await handleFileUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Statut *</label>
                <select
                  required
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                >
                  <option value="Actif">Actif</option>
                  <option value="En révision">En révision</option>
                  <option value="Obsolète">Obsolète</option>
                  <option value="Archivé">Archivé</option>
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

export default GED;