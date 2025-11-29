import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Bell, 
  Users, 
  FileText, 
  Calendar, 
  Activity, 
  Scale, 
  Leaf,
  BarChart3,
  Wrench,
  Heart,
  ClipboardList,
  AlertTriangle,
  HardHat,
  Archive,
  CalendarCheck,
  CalendarRange,
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

// Import des composants modulaires
import Dashboard from './components/Dashboard';
import Formations from './components/Formations';
import Materiel from './components/Materiel';
import Visites from './components/Visites';
import Plans from './components/Plans';
import EPI from './components/EPI';
import Incidents from './components/Incidents';
import Permis from './components/Permis';
import GED from './components/GED';
import PlanFormations from './components/PlanFormations';
import PlanningHSE from './components/PlanningHSE';
import VeilleReglementaire from './components/VeilleReglementaire';
import GestionEnvironnementale from './components/GestionEnvironnementale';
import Rapports from './components/Rapports';

const QHSEApp = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationsRef = useRef(null);

  const [appData, setAppData] = useState({
    formations: [],
    materiel: [],
    visites: [],
    plans: [],
    epiList: [],
    incidents: [],
    permisTravail: [],
    ged: [],
    planformations: [],
    planninghse: [],
    veillereglementaire: [],
    aspectsEnvironnementaux: []
  });

  // Récupération de l'URL de l'API depuis les variables d'environnement
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  console.log('URL API utilisée:', API_URL);

  // Modules avec icônes cohérentes
  const modules = [
    { id: 'dashboard', nom: 'Dashboard', icon: BarChart3 },
    { id: 'formations', nom: 'Formations', icon: Users },
    { id: 'materiel', nom: 'Matériel', icon: Wrench },
    { id: 'visites', nom: 'Visites Médicales', icon: Heart },
    { id: 'plans', nom: "Plans d'Action", icon: ClipboardList },
    { id: 'epi', nom: 'EPI', icon: Shield },
    { id: 'incidents', nom: 'Incidents', icon: AlertTriangle },
    { id: 'permis', nom: 'Permis de Travail', icon: HardHat },
    { id: 'ged', nom: 'GED', icon: Archive },
    { id: 'planformations', nom: 'Plan Formations', icon: CalendarCheck },
    { id: 'planninghse', nom: 'Planning HSE', icon: CalendarRange },
    { id: 'veillereglementaire', nom: 'Veille Réglementaire', icon: Scale }, 
    { id: 'gestionenvironnementale', nom: 'Registre Environnemental', icon: Leaf },
    { id: 'rapports', nom: 'Rapports', icon: FileText }
  ];

  // Fonction pour calculer les jours restants
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

  // Calcul des notifications globales UNIFIÉES pour tous les modules
  useEffect(() => {
    const calculateNotifications = () => {
      const notifs = [];
      
      console.log('Calcul des notifications unifiées avec données:', appData);

      // === FORMATIONS ===
      appData.formations.forEach(f => {
        const jours = calcJours(f.dateExpiration);
        
        if (jours < 0) {
          notifs.push({ 
            msg: `FORMATION EXPIRÉE: "${f.intitule}" a expiré il y a ${Math.abs(jours)} jours`, 
            type: 'formation',
            priority: 'critical',
            module: 'formations',
            date: f.dateExpiration,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours <= 7) {
          notifs.push({ 
            msg: `FORMATION À RENOUVELER: "${f.intitule}" expire dans ${jours} jours`, 
            type: 'formation',
            priority: 'high',
            module: 'formations',
            date: f.dateExpiration,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (jours <= 30) {
          notifs.push({ 
            msg: `FORMATION À PLANIFIER: "${f.intitule}" expire dans ${jours} jours`, 
            type: 'formation',
            priority: 'medium',
            module: 'formations',
            date: f.dateExpiration,
            joursRestants: jours,
            icon: 'Clock'
          });
        }
      });

      // === MATÉRIEL ===
      appData.materiel.forEach(m => {
        const jours = calcJours(m.prochainControle);
        
        if (jours < 0) {
          notifs.push({ 
            msg: `CONTRÔLE EN RETARD: "${m.designation}" devrait être contrôlé il y a ${Math.abs(jours)} jours`, 
            type: 'materiel',
            priority: 'critical',
            module: 'materiel',
            date: m.prochainControle,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours <= 7) {
          notifs.push({ 
            msg: `CONTRÔLE URGENT: "${m.designation}" à contrôler dans ${jours} jours`, 
            type: 'materiel',
            priority: 'high',
            module: 'materiel',
            date: m.prochainControle,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (jours <= 30) {
          notifs.push({ 
            msg: `CONTRÔLE À PLANIFIER: "${m.designation}" à contrôler dans ${jours} jours`, 
            type: 'materiel',
            priority: 'medium',
            module: 'materiel',
            date: m.prochainControle,
            joursRestants: jours,
            icon: 'Clock'
          });
        }
      });

      // === VISITES MÉDICALES ===
      appData.visites.forEach(v => {
        const jours = calcJours(v.dateExpiration);
        
        if (jours < 0) {
          notifs.push({ 
            msg: `VISITE EXPIRÉE: "${v.intitule}" a expiré il y a ${Math.abs(jours)} jours`, 
            type: 'visite',
            priority: 'critical',
            module: 'visites',
            date: v.dateExpiration,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours <= 7) {
          notifs.push({ 
            msg: `VISITE URGENTE: "${v.intitule}" expire dans ${jours} jours`, 
            type: 'visite',
            priority: 'high',
            module: 'visites',
            date: v.dateExpiration,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (jours <= 30) {
          notifs.push({ 
            msg: `VISITE À PLANIFIER: "${v.intitule}" expire dans ${jours} jours`, 
            type: 'visite',
            priority: 'medium',
            module: 'visites',
            date: v.dateExpiration,
            joursRestants: jours,
            icon: 'Clock'
          });
        }
      });

      // === EPI ===
      appData.epiList.forEach(e => {
        const jours = calcJours(e.dateExpiration);
        
        if (jours < 0) {
          notifs.push({ 
            msg: `EPI EXPIRÉ: "${e.typeEPI}" a expiré il y a ${Math.abs(jours)} jours`, 
            type: 'epi',
            priority: 'critical',
            module: 'epi',
            date: e.dateExpiration,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours <= 7) {
          notifs.push({ 
            msg: `EPI À RENOUVELER: "${e.typeEPI}" expire dans ${jours} jours`, 
            type: 'epi',
            priority: 'high',
            module: 'epi',
            date: e.dateExpiration,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (jours <= 30) {
          notifs.push({ 
            msg: `EPI À COMMANDER: "${e.typeEPI}" expire dans ${jours} jours`, 
            type: 'epi',
            priority: 'medium',
            module: 'epi',
            date: e.dateExpiration,
            joursRestants: jours,
            icon: 'Clock'
          });
        }
      });

      // === PLANS D'ACTION ===
      appData.plans.forEach(p => {
        const jours = calcJours(p.dateEcheance);
        const statut = p.statut?.toLowerCase();
        
        if (jours < 0 && (statut === 'en cours' || statut === 'en_cours')) {
          notifs.push({ 
            msg: `PLAN EN RETARD: "${p.titre}" est en retard de ${Math.abs(jours)} jours`, 
            type: 'plan',
            priority: 'critical',
            module: 'plans',
            date: p.dateEcheance,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours <= 7 && (statut === 'en cours' || statut === 'en_cours')) {
          notifs.push({ 
            msg: `PLAN À FINALISER: "${p.titre}" échéance dans ${jours} jours`, 
            type: 'plan',
            priority: 'high',
            module: 'plans',
            date: p.dateEcheance,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (statut === 'en attente' || statut === 'en_attente') {
          notifs.push({ 
            msg: `PLAN EN ATTENTE: "${p.titre}" nécessite une action`, 
            type: 'plan',
            priority: 'medium',
            module: 'plans',
            date: p.dateCreation,
            joursRestants: 999,
            icon: 'Clock'
          });
        }
      });

      // === PERMIS DE TRAVAIL ===
      appData.permisTravail.forEach(p => {
        const jours = calcJours(p.dateFin);
        const statut = p.statut?.toLowerCase();
        
        if (jours < 0 && (statut === 'approuvé' || statut === 'approuve' || statut === 'en cours' || statut === 'en_cours')) {
          notifs.push({ 
            msg: `PERMIS EXPIRÉ: "${p.numero}" a expiré il y a ${Math.abs(jours)} jours`, 
            type: 'permis',
            priority: 'critical',
            module: 'permis',
            date: p.dateFin,
            joursRestants: jours,
            icon: 'AlertCircle'
          });
        } else if (jours === 0 && (statut === 'approuvé' || statut === 'approuve' || statut === 'en cours' || statut === 'en_cours')) {
          notifs.push({ 
            msg: `PERMIS EXPIRE AUJOURD'HUI: "${p.numero}"`, 
            type: 'permis',
            priority: 'high',
            module: 'permis',
            date: p.dateFin,
            joursRestants: jours,
            icon: 'AlertTriangle'
          });
        } else if (statut === 'en attente' || statut === 'en_attente') {
          notifs.push({ 
            msg: `PERMIS EN ATTENTE: "${p.numero}" nécessite approbation`, 
            type: 'permis',
            priority: 'medium',
            module: 'permis',
            date: p.dateDebut,
            joursRestants: 999,
            icon: 'Clock'
          });
        }
      });

      // === INCIDENTS NON CLÔTURÉS ===
      appData.incidents.forEach(i => {
        const statut = i.statut?.toLowerCase();
        if (statut === 'en cours' || statut === 'en_cours' || statut === 'en investigation' || statut === 'en_investigation') {
          notifs.push({ 
            msg: `INCIDENT NON RÉSOLU: "${i.titre}" nécessite suivi`, 
            type: 'incident',
            priority: 'medium',
            module: 'incidents',
            date: i.date,
            joursRestants: 999,
            icon: 'AlertTriangle'
          });
        }
      });

      // === PLANS DE FORMATION EN ATTENTE ===
      appData.planformations.forEach(pf => {
        const statut = pf.statut?.toLowerCase();
        if (statut === 'en attente' || statut === 'en_attente') {
          notifs.push({ 
            msg: `PLAN FORMATION EN ATTENTE: "${pf.intitule}" nécessite validation`, 
            type: 'planformation',
            priority: 'medium',
            module: 'planformations',
            date: pf.dateCreation,
            joursRestants: 999,
            icon: 'Clock'
          });
        }
      });

      // === ASPECTS ENVIRONNEMENTAUX SIGNIFICATIFS ===
      appData.aspectsEnvironnementaux.forEach(ae => {
        const statut = ae.statut?.toLowerCase();
        if (statut === 'significatif') {
          notifs.push({ 
            msg: `ASPECT ENVIRONNEMENTAL SIGNIFICATIF: "${ae.aspect}" nécessite attention`, 
            type: 'environnement',
            priority: 'high',
            module: 'gestionenvironnementale',
            date: ae.date_derniere_mesure,
            joursRestants: 999,
            icon: 'AlertTriangle'
          });
        }
      });

      // Trier par priorité (critical > high > medium > low) et par date
      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      notifs.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.joursRestants - b.joursRestants;
      });
      
      console.log('Notifications unifiées générées:', notifs);
      setNotifications(notifs);
    };

    calculateNotifications();
  }, [appData]);

  // Fermer les notifications en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Composant Icon dynamique
  const DynamicIcon = ({ iconName, className }) => {
    const icons = {
      AlertCircle: <AlertCircle className={className} />,
      AlertTriangle: <AlertTriangle className={className} />,
      Clock: <Clock className={className} />,
      RefreshCw: <RefreshCw className={className} />
    };
    
    return icons[iconName] || <AlertCircle className={className} />;
  };

  // Composant de fenêtre de notifications
  const NotificationsPanel = () => (
    <div 
      ref={notificationsRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-96 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Alertes QHSE - Tous Modules</h3>
          <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
            {notifications.length}
          </span>
        </div>
        <p className="text-blue-100 text-xs mt-1">
          État global de tous les modules - Priorités: 🔴 Critique 🟠 Haute 🟡 Moyenne
        </p>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <div 
              key={index}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                notif.priority === 'critical' ? 'bg-red-50 border-l-4 border-l-red-500' :
                notif.priority === 'high' ? 'bg-orange-50 border-l-4 border-l-orange-500' :
                'bg-yellow-50 border-l-4 border-l-yellow-500'
              }`}
              onClick={() => {
                setShowNotifications(false);
                setActiveModule(notif.module);
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-1 ${
                  notif.priority === 'critical' ? 'text-red-500' :
                  notif.priority === 'high' ? 'text-orange-500' : 'text-yellow-500'
                }`}>
                  <DynamicIcon iconName={notif.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{notif.msg}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-medium ${
                      notif.priority === 'critical' ? 'text-red-600' :
                      notif.priority === 'high' ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {notif.priority === 'critical' ? '🔴 Critique' : 
                       notif.priority === 'high' ? '🟠 Haute priorité' : '🟡 Priorité moyenne'}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {notif.type} • {
                        notif.joursRestants === 0 ? "Aujourd'hui" : 
                        notif.joursRestants < 0 ? `Il y a ${Math.abs(notif.joursRestants)}j` :
                        notif.joursRestants === 999 ? 'En attente' : `${notif.joursRestants}j`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucune alerte</p>
            <p className="text-gray-400 text-xs mt-1">Tous les modules sont à jour !</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setShowNotifications(false);
                setActiveModule('dashboard');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Voir le dashboard
            </button>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Calcul des alertes globales (pour le badge)
  const globalAlerts = notifications.length;

  // Fonction pour charger les données depuis l'API
  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = [
        'formations', 'materiel', 'visites', 'plans', 'epi', 
        'incidents', 'permis', 'ged', 'planformations', 'planninghse',
        'veillereglementaire', 'aspects-environnementaux'
      ];

      const promises = endpoints.map(endpoint =>
        fetch(`${API_URL}/api/${endpoint}`)
          .then(response => {
            if (!response.ok) throw new Error(`Erreur ${response.status}`);
            return response.json();
          })
          .catch(error => {
            console.error(`Erreur lors du chargement des ${endpoint}:`, error);
            return [];
          })
      );

      const results = await Promise.all(promises);
      
      setAppData(prev => ({
        ...prev,
        formations: results[0],
        materiel: results[1],
        visites: results[2],
        plans: results[3],
        epiList: results[4],
        incidents: results[5],
        permisTravail: results[6],
        ged: results[7],
        planformations: results[8],
        planninghse: results[9],
        veillereglementaire: results[10],
        aspectsEnvironnementaux: results[11]
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showWelcome) {
      fetchData();
    }
  }, [showWelcome]);

  const handleDataUpdate = async (module, newData) => {
    try {
      setLoading(true);
      
      let dataToSend = { ...newData };
      
      // Pour les permis, s'assurer que les risques ont un format valide
      if (module === 'permis' && dataToSend.risques) {
        dataToSend.risques = dataToSend.risques.map(risque => ({
          id: risque.id || null,
          risque: risque.risque || '',
          niveau: risque.niveau || '',
          mesures: risque.mesures || ''
        }));
      }
      
      // Pour le registre environnemental
      const url = module === 'gestionenvironnementale' 
        ? `${API_URL}/api/aspects-environnementaux${dataToSend.id ? `/${dataToSend.id}` : ''}`
        : `${API_URL}/api/${module}${dataToSend.id ? `/${dataToSend.id}` : ''}`;
      
      const method = dataToSend.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}:`, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Recharger les données après mise à jour
      await fetchData();
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des ${module}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async (module, id) => {
    try {
      setLoading(true);
      
      // Pour le registre environnemental
      const url = module === 'gestionenvironnementale'
        ? `${API_URL}/api/aspects-environnementaux/${id}`
        : `${API_URL}/api/${module}/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      await fetchData();
      
      return { message: 'Supprimé avec succès' };
    } catch (error) {
      console.error(`Erreur lors de la suppression des ${module}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (modalType) => {
    setActiveModule(modalType);
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-white rounded-full p-8 mb-8 inline-block shadow-2xl">
            <Shield className="w-32 h-32 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Système QHSE</h1>
          <p className="text-xl text-blue-200 mb-8">Qualité - Hygiène - Sécurité - Environnement</p>
          <button 
            onClick={() => setShowWelcome(false)} 
            className="bg-white text-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Accéder au Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    const commonProps = {
      data: appData,
      onRefresh: fetchData,
      onDataUpdate: handleDataUpdate,
      onDeleteData: handleDeleteData,
      loading: loading
    };

    switch (activeModule) {
      case 'dashboard':
        return (
          <Dashboard 
            formations={appData.formations}
            materiel={appData.materiel}
            visites={appData.visites}
            plans={appData.plans}
            epiList={appData.epiList}
            incidents={appData.incidents}
            permisTravail={appData.permisTravail}
            ged={appData.ged}
            planformations={appData.planformations}
            planninghse={appData.planninghse}
            veillereglementaire={appData.veillereglementaire}
            gestionenvironnementale={appData.aspectsEnvironnementaux}
            onShowModal={handleShowModal}
            onRefresh={fetchData}
            loading={loading}
            notifications={notifications}
          />
        );
      
      case 'formations':
        return <Formations {...commonProps} />;
      
      case 'materiel':
        return <Materiel {...commonProps} />;
      
      case 'visites':
        return <Visites {...commonProps} />;
      
      case 'plans':
        return <Plans {...commonProps} />;
      
      case 'epi':
        return <EPI {...commonProps} />;
      
      case 'incidents':
        return <Incidents {...commonProps} />;
      
      case 'permis':
        return <Permis {...commonProps} />;
      
      case 'ged':
        return <GED {...commonProps} />;

      case 'planformations':
        return <PlanFormations {...commonProps} />;

      case 'planninghse':
        return <PlanningHSE {...commonProps} />;

      case 'veillereglementaire':
        return <VeilleReglementaire {...commonProps} />;

      case 'gestionenvironnementale':
        return <GestionEnvironnementale {...commonProps} />;

      case 'rapports':
        return (
          <Rapports 
            formations={appData.formations}
            materiel={appData.materiel}
            visites={appData.visites}
            plans={appData.plans}
            epiList={appData.epiList}
            incidents={appData.incidents}
            permisTravail={appData.permisTravail}
          />
        );
      
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800">Module {activeModule}</h2>
            <p className="text-gray-600">Module en cours de développement</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xl font-bold">QHSE Manager Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 group"
              >
                <Bell className="w-6 h-6 group-hover:text-blue-200 transition-colors" />
                {globalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {globalAlerts}
                  </span>
                )}
              </button>
              
              {showNotifications && <NotificationsPanel />}
            </div>
            <button 
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              title="Actualiser les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-blue-700 px-3 py-1 rounded-full">
              <Users className="w-5 h-5" />
              <span className="text-sm">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200 sticky top-0">
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Modules QHSE</h3>
            <nav className="space-y-1">
              {modules.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeModule === m.id 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{m.nom}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Aperçu Rapide</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Formations</span>
                  <span className="font-semibold text-blue-600">{appData.formations.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Incidents ce mois</span>
                  <span className="font-semibold text-red-600">
                    {appData.incidents.filter(i => {
                      try {
                        const incidentDate = new Date(i.date);
                        const now = new Date();
                        return incidentDate.getMonth() === now.getMonth() && 
                               incidentDate.getFullYear() === now.getFullYear();
                      } catch {
                        return false;
                      }
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Aspects environnementaux</span>
                  <span className="font-semibold text-green-600">
                    {appData.aspectsEnvironnementaux.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen p-6">
          {loading && (
            <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 z-50">
              <div className="h-full bg-blue-400 animate-pulse"></div>
            </div>
          )}
          
          {/* Bannière d'alertes globale UNIFIÉE */}
          {globalAlerts > 0 && (
            <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm">Alertes QHSE - Attention Requise</h3>
                  <p className="text-orange-100 text-xs">
                    {globalAlerts} alerte{globalAlerts > 1 ? 's' : ''} sur l'ensemble des modules
                  </p>
                </div>
                <span className="ml-auto bg-white text-orange-600 px-2 py-1 rounded-full text-xs font-bold">
                  {globalAlerts}
                </span>
              </div>
            </div>
          )}
          
          {renderModule()}
        </main>
      </div>

      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2024 Système QHSE Manager Pro - Tous droits réservés</p>
          <p className="text-gray-400 mt-1">Version 2.0.0 - API: {API_URL}</p>
        </div>
      </footer>
    </div>
  );
};

export default QHSEApp;