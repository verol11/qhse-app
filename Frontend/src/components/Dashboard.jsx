import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Wrench, Heart, ClipboardList, Shield, FileText, AlertTriangle, 
  BarChart3, Bell, Plus, HardHat, Download, Printer, Filter, TrendingUp, 
  CheckCircle, XCircle, Search, Archive, CalendarCheck, CalendarRange, Scale, Leaf, Activity
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Dashboard = ({ 
  formations = [], 
  materiel = [], 
  visites = [], 
  plans = [], 
  epiList = [], 
  incidents = [], 
  permisTravail = [],
  ged = [],
  planformations = [],
  planninghse = [],
  veillereglementaire = [],
  gestionenvironnementale = [],
  onShowModal,
  onRefresh,
  notifications = []
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Calcul des jours restants
  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    try {
      const dateExpiration = new Date(dateExp);
      const aujourdHui = new Date();
      
      aujourdHui.setHours(0, 0, 0, 0);
      dateExpiration.setHours(0, 0, 0, 0);
      
      const diff = dateExpiration.getTime() - aujourdHui.getTime();
      const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      return jours;
    } catch (error) {
      console.error('Erreur calcul jours:', error, dateExp);
      return 999;
    }
  };

  // Calcul des statistiques
  const stats = {
    // Modules existants
    formationsExpirant: formations.filter(f => {
      const jours = calcJours(f.dateExpiration);
      return jours <= 30 && jours >= 0;
    }).length,
    
    materielAControler: materiel.filter(m => {
      const jours = calcJours(m.prochainControle);
      return jours <= 30 && jours >= 0;
    }).length,
    
    visitesExpirant: visites.filter(v => {
      const jours = calcJours(v.dateExpiration);
      return jours <= 30 && jours >= 0;
    }).length,
    
    epiExpirant: epiList.filter(e => {
      const jours = calcJours(e.dateExpiration);
      return jours <= 30 && jours >= 0;
    }).length,

    // Totaux
    totalFormations: formations.length,
    totalMateriel: materiel.length,
    totalVisites: visites.length,
    totalEPI: epiList.length,
    totalPlans: plans.length,
    totalIncidents: incidents.length,
    totalPermis: permisTravail.length,
    totalGED: ged.length,
    totalPlanFormations: planformations.length,
    totalPlanningHSE: planninghse.length,
    totalVeilleReglementaire: veillereglementaire.length,
    totalAspectsEnvironnementaux: gestionenvironnementale.length,

    // Statuts
    plansEnCours: plans.filter(p => p.statut === 'En cours' || p.statut === 'en_cours').length,
    plansTermines: plans.filter(p => p.statut === 'Terminé' || p.statut === 'termine').length,
    
    incidentsMois: incidents.filter(i => {
      try {
        const incidentDate = new Date(i.date);
        const now = new Date();
        return incidentDate.getMonth() === now.getMonth() && 
               incidentDate.getFullYear() === now.getFullYear();
      } catch (error) {
        return false;
      }
    }).length,
    
    permisActifs: permisTravail.filter(p => 
      p.statut === 'Approuvé' || p.statut === 'approuve' || p.statut === 'En cours' || p.statut === 'en_cours'
    ).length,
    
    permisEnAttente: permisTravail.filter(p => 
      p.statut === 'En attente' || p.statut === 'en_attente'
    ).length,

    // Nouveaux modules
    formationsPlanifiees: planformations.filter(pf => 
      pf.statut === 'Planifié' || pf.statut === 'planifie' || pf.statut === 'En cours' || pf.statut === 'en_cours'
    ).length,

    activitesHSECeMois: planninghse.filter(ph => {
      try {
        const activityDate = new Date(ph.dateDebut);
        const now = new Date();
        return activityDate.getMonth() === now.getMonth() && 
               activityDate.getFullYear() === now.getFullYear();
      } catch (error) {
        return false;
      }
    }).length,

    // Nouveaux indicateurs environnementaux
    aspectsSignificatifs: gestionenvironnementale.filter(ae => 
      ae.statut === 'Significatif' || ae.statut === 'significatif'
    ).length,

    aspectsNonConformes: gestionenvironnementale.filter(ae => 
      ae.conformite_reglementaire === 'Non conforme' || ae.conformite_reglementaire === 'non_conforme'
    ).length,

    emissions: gestionenvironnementale.filter(ae => 
      ae.type === 'Émission' || ae.type === 'emission'
    ).length,

    dechets: gestionenvironnementale.filter(ae => 
      ae.type === 'Déchet' || ae.type === 'dechet'
    ).length,
  };

  // Données pour les graphiques
  const getChartData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      const monthIndex = (currentMonth + index - 5 + 12) % 12;
      
      return {
        mois: month,
        formations: formations.filter(f => {
          try {
            const date = new Date(f.dateFormation);
            return date.getMonth() === monthIndex;
          } catch {
            return false;
          }
        }).length,
        
        incidents: incidents.filter(i => {
          try {
            const date = new Date(i.date);
            return date.getMonth() === monthIndex;
          } catch {
            return false;
          }
        }).length,
        
        visites: visites.filter(v => {
          try {
            const date = new Date(v.dateVisite);
            return date.getMonth() === monthIndex;
          } catch {
            return false;
          }
        }).length,

        aspects: gestionenvironnementale.filter(ae => {
          try {
            const date = new Date(ae.date_derniere_mesure);
            return date.getMonth() === monthIndex;
          } catch {
            return false;
          }
        }).length,
      };
    }).slice(-6);
  };

  // Données des incidents par type
  const getIncidentData = () => {
    const incidentTypes = {};
    
    incidents.forEach(incident => {
      const type = incident.type || 'Non spécifié';
      incidentTypes[type] = (incidentTypes[type] || 0) + 1;
    });

    return Object.entries(incidentTypes).map(([type, count]) => ({
      type: type.length > 10 ? type.substring(0, 10) + '...' : type,
      count,
      fullType: type
    }));
  };

  // Données des aspects environnementaux par type
  const getAspectData = () => {
    const aspectTypes = {};
    
    gestionenvironnementale.forEach(aspect => {
      const type = aspect.type || 'Non spécifié';
      aspectTypes[type] = (aspectTypes[type] || 0) + 1;
    });

    return Object.entries(aspectTypes).map(([type, count]) => ({
      type: type.length > 10 ? type.substring(0, 10) + '...' : type,
      count,
      fullType: type
    }));
  };

  const chartData = getChartData();
  const incidentData = getIncidentData();
  const aspectData = getAspectData();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Calcul du taux de conformité
  const calculateConformityRate = () => {
    const totalItems = formations.length + materiel.length + visites.length + epiList.length + plans.length;
    if (totalItems === 0) return 100;

    const nonConformItems = 
      formations.filter(f => calcJours(f.dateExpiration) < 0).length +
      materiel.filter(m => calcJours(m.prochainControle) < 0).length +
      visites.filter(v => calcJours(v.dateExpiration) < 0).length +
      epiList.filter(e => calcJours(e.dateExpiration) < 0).length +
      plans.filter(p => calcJours(p.dateEcheance) < 0 && (p.statut === 'En cours' || p.statut === 'en_cours')).length;

    return Math.round(((totalItems - nonConformItems) / totalItems) * 100);
  };

  // Calcul du taux de conformité environnementale
  const calculateEnvironmentalConformityRate = () => {
    const totalAspects = gestionenvironnementale.length;
    if (totalAspects === 0) return 100;

    const conformAspects = gestionenvironnementale.filter(ae => 
      ae.conformite_reglementaire === 'Conforme' || ae.conformite_reglementaire === 'conforme'
    ).length;

    return Math.round((conformAspects / totalAspects) * 100);
  };

  const conformityRate = calculateConformityRate();
  const environmentalConformityRate = calculateEnvironmentalConformityRate();
  const hseActivityIndex = stats.activitesHSECeMois;

  // Composant Carte de Statistique avec animations
  const StatCard = ({ titre, val, Icon, bgColor, textColor, iconColor, sousTitre, onClick, delay = 0 }) => (
    <div 
      onClick={onClick}
      className={`
        ${bgColor} rounded-lg shadow-sm p-4 border border-transparent 
        transition-all duration-300 ease-out cursor-pointer
        transform hover:scale-105 hover:shadow-lg
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      style={{
        transitionDelay: `${delay}ms`,
        transitionProperty: 'transform, opacity, box-shadow'
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className={`${textColor} text-xs uppercase tracking-wide font-medium`}>{titre}</p>
          <p className={`${textColor} text-xl font-bold mt-1 transition-transform duration-200 hover:scale-110`}>{val}</p>
          {sousTitre && <p className={`${textColor} text-opacity-80 text-xs mt-1`}>{sousTitre}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconColor} bg-white bg-opacity-30 transition-transform duration-200 hover:scale-110`}>
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  // Export du dashboard
  const exportDashboard = (format) => {
    const data = {
      date: new Date().toLocaleDateString('fr-FR'),
      periode: selectedPeriod,
      statistiques: stats,
      notifications: notifications.length,
      tauxConformite: conformityRate,
      tauxConformiteEnvironnementale: environmentalConformityRate
    };
    
    if (format === 'pdf') {
      exportToPDF('Tableau de Bord QHSE', [], [], 'dashboard_qhse');
    } else {
      exportToExcel([data], 'dashboard_qhse');
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* En-tête avec animation - SUPPRESSION de la barre d'alertes */}
      <div className={`flex justify-between items-center transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tableau de Bord QHSE</h2>
          <p className="text-gray-600 text-sm">Vue d'ensemble de tous les modules</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-200 hover:border-blue-300"
          >
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
            <option value="quarter">Trimestre</option>
          </select>
          
          <button 
            onClick={() => exportDashboard('excel')}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Cartes Principales - Animations séquentielles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          titre="Formations" 
          val={stats.formationsExpirant}
          sousTitre={`${stats.totalFormations} total`}
          Icon={Users} 
          bgColor="bg-blue-100"
          textColor="text-blue-800"
          iconColor="bg-blue-200"
          onClick={() => onShowModal && onShowModal('formations')}
          delay={100}
        />
        
        <StatCard 
          titre="Équipements" 
          val={stats.materielAControler}
          sousTitre={`${stats.totalMateriel} total`}
          Icon={Wrench} 
          bgColor="bg-green-100"
          textColor="text-green-800"
          iconColor="bg-green-200"
          onClick={() => onShowModal && onShowModal('materiel')}
          delay={200}
        />
        
        <StatCard 
          titre="Visites médicales" 
          val={stats.visitesExpirant}
          sousTitre={`${stats.totalVisites} total`}
          Icon={Heart} 
          bgColor="bg-purple-100"
          textColor="text-purple-800"
          iconColor="bg-purple-200"
          onClick={() => onShowModal && onShowModal('visites')}
          delay={300}
        />
        
        <StatCard 
          titre="EPI" 
          val={stats.epiExpirant}
          sousTitre={`${stats.totalEPI} total`}
          Icon={Shield} 
          bgColor="bg-yellow-100"
          textColor="text-yellow-800"
          iconColor="bg-yellow-200"
          onClick={() => onShowModal && onShowModal('epi')}
          delay={400}
        />
      </div>

      {/* Cartes Secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          titre="Plans d'action" 
          val={stats.plansEnCours}
          sousTitre={`${stats.plansTermines} terminés`}
          Icon={ClipboardList} 
          bgColor="bg-indigo-100"
          textColor="text-indigo-800"
          iconColor="bg-indigo-200"
          onClick={() => onShowModal && onShowModal('plans')}
          delay={500}
        />
        
        <StatCard 
          titre="Incidents" 
          val={stats.incidentsMois}
          sousTitre={`${stats.totalIncidents} total`}
          Icon={AlertTriangle} 
          bgColor="bg-red-100"
          textColor="text-red-800"
          iconColor="bg-red-200"
          onClick={() => onShowModal && onShowModal('incidents')}
          delay={600}
        />
        
        <StatCard 
          titre="Permis de travail" 
          val={stats.permisActifs}
          sousTitre={`${stats.permisEnAttente} en attente`}
          Icon={HardHat} 
          bgColor="bg-orange-100"
          textColor="text-orange-800"
          iconColor="bg-orange-200"
          onClick={() => onShowModal && onShowModal('permis')}
          delay={700}
        />
      </div>

      {/* Nouveaux Modules */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          titre="GED" 
          val={stats.totalGED}
          sousTitre="Documents"
          Icon={Archive} 
          bgColor="bg-gray-100"
          textColor="text-gray-800"
          iconColor="bg-gray-200"
          onClick={() => onShowModal && onShowModal('ged')}
          delay={800}
        />
        
        <StatCard 
          titre="Plans Formation" 
          val={stats.formationsPlanifiees}
          sousTitre={`${stats.totalPlanFormations} total`}
          Icon={CalendarCheck} 
          bgColor="bg-cyan-100"
          textColor="text-cyan-800"
          iconColor="bg-cyan-200"
          onClick={() => onShowModal && onShowModal('planformations')}
          delay={900}
        />
        
        <StatCard 
          titre="Planning HSE" 
          val={stats.activitesHSECeMois}
          sousTitre="Ce mois"
          Icon={CalendarRange} 
          bgColor="bg-emerald-100"
          textColor="text-emerald-800"
          iconColor="bg-emerald-200"
          onClick={() => onShowModal && onShowModal('planninghse')}
          delay={1000}
        />
        
        <StatCard 
          titre="Veille Réglementaire" 
          val={stats.totalVeilleReglementaire}
          sousTitre="Réglementations"
          Icon={Scale} 
          bgColor="bg-violet-100"
          textColor="text-violet-800"
          iconColor="bg-violet-200"
          onClick={() => onShowModal && onShowModal('veillereglementaire')}
          delay={1100}
        />
        
        <StatCard 
          titre="Aspects Env." 
          val={stats.aspectsSignificatifs}
          sousTitre={`${stats.totalAspectsEnvironnementaux} total`}
          Icon={Leaf} 
          bgColor="bg-teal-100"
          textColor="text-teal-800"
          iconColor="bg-teal-200"
          onClick={() => onShowModal && onShowModal('gestionenvironnementale')}
          delay={1200}
        />
      </div>

      {/* Graphiques avec animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`
          bg-white rounded-lg shadow-sm p-4 
          transition-all duration-500
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          hover:shadow-md
        `}>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Évolution des Activités</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="formations" 
                stroke="#0088FE" 
                strokeWidth={2}
                name="Formations" 
              />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#FF8042" 
                strokeWidth={2}
                name="Incidents" 
              />
              <Line 
                type="monotone" 
                dataKey="visites" 
                stroke="#00C49F" 
                strokeWidth={2}
                name="Visites" 
              />
              <Line 
                type="monotone" 
                dataKey="aspects" 
                stroke="#8884D8" 
                strokeWidth={2}
                name="Aspects Env." 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`
          bg-white rounded-lg shadow-sm p-4 
          transition-all duration-500
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          hover:shadow-md
        `}>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition des Incidents</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Incidents">
                {incidentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique supplémentaire pour les aspects environnementaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`
          bg-white rounded-lg shadow-sm p-4 
          transition-all duration-500
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          hover:shadow-md
        `}>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Types d'Aspects Environnementaux</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={aspectData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {aspectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`
          bg-white rounded-lg shadow-sm p-4 
          transition-all duration-500
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          hover:shadow-md
        `}>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Détail Environnemental</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aspects significatifs</span>
              <span className="font-bold text-red-600">{stats.aspectsSignificatifs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Émissions</span>
              <span className="font-bold text-blue-600">{stats.emissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Déchets</span>
              <span className="font-bold text-gray-600">{stats.dechets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Non conformes</span>
              <span className="font-bold text-orange-600">{stats.aspectsNonConformes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs de Performance avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`
          bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 
          transition-all duration-500 transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          hover:scale-105 hover:shadow-xl
        `}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm">Performance QHSE</h4>
              <div className="text-2xl font-bold my-2 animate-pulse">{conformityRate}%</div>
              <p className="text-blue-100 text-xs">Taux de conformité général</p>
            </div>
            <CheckCircle className="w-6 h-6 text-blue-200 animate-bounce" />
          </div>
        </div>
        
        <div className={`
          bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 
          transition-all duration-500 transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          hover:scale-105 hover:shadow-xl
        `}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm">Conformité Environnementale</h4>
              <div className="text-2xl font-bold my-2">{environmentalConformityRate}%</div>
              <p className="text-green-100 text-xs">Aspects conformes</p>
            </div>
            <Leaf className="w-6 h-6 text-green-200 transition-transform duration-300 hover:rotate-12" />
          </div>
        </div>
        
        <div className={`
          bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 
          transition-all duration-500 transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          hover:scale-105 hover:shadow-xl
        `}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm">Activité HSE</h4>
              <div className="text-2xl font-bold my-2">{hseActivityIndex}</div>
              <p className="text-purple-100 text-xs">Activités ce mois</p>
            </div>
            <Activity className="w-6 h-6 text-purple-200 transition-transform duration-300 hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Actions Rapides avec animation */}
      <div className={`
        bg-white rounded-lg shadow-sm p-4 
        transition-all duration-500
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        hover:shadow-md
      `}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'formations', label: 'Formations', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
            { key: 'materiel', label: 'Matériel', icon: Wrench, color: 'bg-green-500 hover:bg-green-600' },
            { key: 'visites', label: 'Visites', icon: Heart, color: 'bg-purple-500 hover:bg-purple-600' },
            { key: 'epi', label: 'EPI', icon: Shield, color: 'bg-yellow-500 hover:bg-yellow-600' },
            { key: 'plans', label: "Plans", icon: ClipboardList, color: 'bg-indigo-500 hover:bg-indigo-600' },
            { key: 'incidents', label: 'Incidents', icon: AlertTriangle, color: 'bg-red-500 hover:bg-red-600' },
            { key: 'permis', label: 'Permis', icon: HardHat, color: 'bg-orange-500 hover:bg-orange-600' }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.key}
                onClick={() => onShowModal && onShowModal(item.key)}
                className={`
                  ${item.color} text-white py-3 px-2 rounded-lg 
                  transition-all duration-300 flex flex-col items-center gap-2 
                  shadow-sm hover:shadow-md transform hover:scale-110
                  ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
                `}
                style={{
                  transitionDelay: `${1300 + (index * 100)}ms`
                }}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 hover:scale-125" />
                <span className="text-xs font-medium text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;