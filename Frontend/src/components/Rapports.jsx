import React, { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, Users, Shield } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

const Rapports = ({ formations, materiel, visites, plans, epiList, incidents, permisTravail }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('mois');

  const calcJours = (dateExp) => {
    if (!dateExp) return 999;
    const diff = new Date(dateExp).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const stats = {
    formations: {
      total: formations.length,
      valides: formations.filter(f => calcJours(f.dateExpiration) > 30).length,
      aRenouveler: formations.filter(f => calcJours(f.dateExpiration) <= 30 && calcJours(f.dateExpiration) > 0).length,
      expires: formations.filter(f => calcJours(f.dateExpiration) < 0).length
    },
    materiel: {
      total: materiel.length,
      conforme: materiel.filter(m => m.statut === 'Conforme').length,
      aControler: materiel.filter(m => calcJours(m.prochainControle) <= 30 && calcJours(m.prochainControle) > 0).length,
      nonConforme: materiel.filter(m => m.statut === 'Non conforme').length
    },
    visites: {
      total: visites.length,
      valides: visites.filter(v => calcJours(v.dateExpiration) > 30).length,
      aRenouveler: visites.filter(v => calcJours(v.dateExpiration) <= 30 && calcJours(v.dateExpiration) > 0).length,
      expires: visites.filter(v => calcJours(v.dateExpiration) < 0).length
    },
    plans: {
      total: plans.length,
      enCours: plans.filter(p => p.statut === 'En cours').length,
      termines: plans.filter(p => p.statut === 'Terminé').length,
      enRetard: plans.filter(p => {
        const jours = calcJours(p.dateEcheance);
        return jours < 0 && p.statut === 'En cours';
      }).length,
      avancementMoyen: plans.length > 0 
        ? Math.round(plans.reduce((acc, p) => acc + (p.avancement || 0), 0) / plans.length)
        : 0
    },
    epi: {
      total: epiList.length,
      enService: epiList.filter(e => e.statut === 'En service').length,
      aRenouveler: epiList.filter(e => calcJours(e.dateExpiration) <= 30 && calcJours(e.dateExpiration) > 0).length,
      horsService: epiList.filter(e => e.statut === 'Hors service').length
    },
    incidents: {
      total: incidents.length,
      declares: incidents.filter(i => i.statut === 'Déclaré').length,
      enCours: incidents.filter(i => i.statut === 'En cours').length,
      resolus: incidents.filter(i => i.statut === 'Résolu').length,
      critiques: incidents.filter(i => i.gravite === 'Critique').length,
      graves: incidents.filter(i => i.gravite === 'Grave').length
    },
    permis: {
      total: permisTravail.length,
      actifs: permisTravail.filter(p => p.statut === 'Approuvé' || p.statut === 'En cours').length,
      enAttente: permisTravail.filter(p => p.statut === 'En attente').length,
      expires: permisTravail.filter(p => {
        const jours = calcJours(p.dateFin);
        return jours < 0 && (p.statut === 'Approuvé' || p.statut === 'En cours');
      }).length
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, trend }) => (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').split('-')[0] + '-100'} shadow-lg`}>
          <Icon className={`w-6 h-6 ${color.replace('border-', 'text-').split('-')[0] + '-600'}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center text-sm">
          <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
          <span className="text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  const ProgressBar = ({ label, current, total, color }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>{label}</span>
          <span className="font-semibold">{current} / {total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className={`h-3 rounded-full ${color} shadow-sm transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleExport = () => {
    const columns = ['Catégorie', 'Total', 'Conforme', 'À traiter', 'En retard'];
    const data = [
      ['Formations', stats.formations.total, stats.formations.valides, stats.formations.aRenouveler, stats.formations.expires],
      ['Matériel', stats.materiel.total, stats.materiel.conforme, stats.materiel.aControler, stats.materiel.nonConforme],
      ['EPI', stats.epi.total, stats.epi.enService, stats.epi.aRenouveler, stats.epi.horsService],
      ['Incidents', stats.incidents.total, stats.incidents.resolus, stats.incidents.enCours, stats.incidents.critiques],
      ['Plans d\'action', stats.plans.total, stats.plans.termines, stats.plans.enCours, stats.plans.enRetard]
    ];
    exportToPDF('Rapport QHSE Complet', columns, data, 'rapport-qhse');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Rapports et Analyses QHSE
        </h2>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-6 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-lg"
          >
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="annee">Cette année</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 flex items-center gap-2 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold mb-3">Rapport QHSE - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <p className="text-indigo-100 text-lg">Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <BarChart3 className="w-20 h-20 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          Vue d'Ensemble
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-gray-600 mb-2">Total Formations</p>
            <p className="text-4xl font-bold text-blue-600">{stats.formations.total}</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-gray-600 mb-2">Total Matériel</p>
            <p className="text-4xl font-bold text-green-600">{stats.materiel.total}</p>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-gray-600 mb-2">Total Incidents</p>
            <p className="text-4xl font-bold text-red-600">{stats.incidents.total}</p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-gray-600 mb-2">Permis Actifs</p>
            <p className="text-4xl font-bold text-orange-600">{stats.permis.actifs}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Formations"
          value={stats.formations.total}
          icon={Calendar}
          color="border-blue-500"
          description={`${stats.formations.aRenouveler} à renouveler, ${stats.formations.expires} expirées`}
        />
        <StatCard
          title="Matériel"
          value={stats.materiel.total}
          icon={CheckCircle}
          color="border-green-500"
          description={`${stats.materiel.conforme} conformes, ${stats.materiel.nonConforme} non conformes`}
        />
        <StatCard
          title="Incidents"
          value={stats.incidents.total}
          icon={AlertTriangle}
          color="border-red-500"
          description={`${stats.incidents.critiques} critiques, ${stats.incidents.graves} graves`}
        />
        <StatCard
          title="EPI"
          value={stats.epi.total}
          icon={Shield}
          color="border-yellow-500"
          description={`${stats.epi.enService} en service, ${stats.epi.horsService} hors service`}
        />
        <StatCard
          title="Plans d'Action"
          value={stats.plans.total}
          icon={FileText}
          color="border-indigo-500"
          description={`${stats.plans.enCours} en cours, ${stats.plans.termines} terminés`}
        />
        <StatCard
          title="Visites Médicales"
          value={stats.visites.total}
          icon={Users}
          color="border-purple-500"
          description={`${stats.visites.valides} valides, ${stats.visites.expires} expirées`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            Analyse des Formations
          </h3>
          <ProgressBar
            label="Formations valides"
            current={stats.formations.valides}
            total={stats.formations.total}
            color="bg-green-500"
          />
          <ProgressBar
            label="À renouveler (sous 30j)"
            current={stats.formations.aRenouveler}
            total={stats.formations.total}
            color="bg-orange-500"
          />
          <ProgressBar
            label="Expirées"
            current={stats.formations.expires}
            total={stats.formations.total}
            color="bg-red-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-indigo-600" />
            Plans d'Action
          </h3>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Avancement moyen</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4 shadow-inner">
                <div
                  className="h-4 rounded-full bg-indigo-600 shadow-sm transition-all duration-1000"
                  style={{ width: `${stats.plans.avancementMoyen}%` }}
                />
              </div>
              <span className="text-3xl font-bold text-indigo-600">{stats.plans.avancementMoyen}%</span>
            </div>
          </div>
          <ProgressBar
            label="Plans en cours"
            current={stats.plans.enCours}
            total={stats.plans.total}
            color="bg-blue-500"
          />
          <ProgressBar
            label="Plans terminés"
            current={stats.plans.termines}
            total={stats.plans.total}
            color="bg-green-500"
          />
          <ProgressBar
            label="Plans en retard"
            current={stats.plans.enRetard}
            total={stats.plans.total}
            color="bg-red-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-yellow-600" />
            Équipements de Protection (EPI)
          </h3>
          <ProgressBar
            label="En service"
            current={stats.epi.enService}
            total={stats.epi.total}
            color="bg-green-500"
          />
          <ProgressBar
            label="À renouveler"
            current={stats.epi.aRenouveler}
            total={stats.epi.total}
            color="bg-orange-500"
          />
          <ProgressBar
            label="Hors service"
            current={stats.epi.horsService}
            total={stats.epi.total}
            color="bg-red-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Gestion des Incidents
          </h3>
          <ProgressBar
            label="Incidents déclarés"
            current={stats.incidents.declares}
            total={stats.incidents.total}
            color="bg-blue-500"
          />
          <ProgressBar
            label="En cours de traitement"
            current={stats.incidents.enCours}
            total={stats.incidents.total}
            color="bg-yellow-500"
          />
          <ProgressBar
            label="Résolus"
            current={stats.incidents.resolus}
            total={stats.incidents.total}
            color="bg-green-500"
          />
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Incidents critiques</span>
              <span className="font-bold text-red-600 text-lg">{stats.incidents.critiques}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Recommandations</h3>
        <div className="space-y-4">
          {stats.formations.expires > 0 && (
            <div className="flex items-start gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl">
              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-lg">Formations expirées</p>
                <p className="text-red-700">{stats.formations.expires} formation(s) ont expiré. Action immédiate requise.</p>
              </div>
            </div>
          )}
          {stats.formations.aRenouveler > 0 && (
            <div className="flex items-start gap-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800 text-lg">Formations à renouveler</p>
                <p className="text-orange-700">{stats.formations.aRenouveler} formation(s) arrivent à échéance dans moins de 30 jours.</p>
              </div>
            </div>
          )}
          {stats.materiel.nonConforme > 0 && (
            <div className="flex items-start gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl">
              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-lg">Matériel non conforme</p>
                <p className="text-red-700">{stats.materiel.nonConforme} équipement(s) non conforme(s) nécessitent une attention immédiate.</p>
              </div>
            </div>
          )}
          {stats.incidents.critiques > 0 && (
            <div className="flex items-start gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-lg">Incidents critiques</p>
                <p className="text-red-700">{stats.incidents.critiques} incident(s) critique(s) en attente de traitement.</p>
              </div>
            </div>
          )}
          {stats.plans.enRetard > 0 && (
            <div className="flex items-start gap-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800 text-lg">Plans d'action en retard</p>
                <p className="text-orange-700">{stats.plans.enRetard} plan(s) d'action en retard. Révision des échéances recommandée.</p>
              </div>
            </div>
          )}
          {stats.formations.expires === 0 && stats.materiel.nonConforme === 0 && stats.incidents.critiques === 0 && (
            <div className="flex items-start gap-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 text-lg">Situation conforme</p>
                <p className="text-green-700">Aucune action critique requise. Continuez la surveillance préventive.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold mb-6">Synthèse du Rapport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-gray-700 rounded-2xl">
            <p className="text-gray-300 text-sm mb-2">Taux de conformité</p>
            <p className="text-4xl font-bold text-green-400">
              {stats.materiel.total > 0 
                ? Math.round((stats.materiel.conforme / stats.materiel.total) * 100)
                : 0}%
            </p>
          </div>
          <div className="p-4 bg-gray-700 rounded-2xl">
            <p className="text-gray-300 text-sm mb-2">Plans d'action actifs</p>
            <p className="text-4xl font-bold text-blue-400">{stats.plans.enCours}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-2xl">
            <p className="text-gray-300 text-sm mb-2">Incidents résolus</p>
            <p className="text-4xl font-bold text-indigo-400">
              {stats.incidents.total > 0 
                ? Math.round((stats.incidents.resolus / stats.incidents.total) * 100)
                : 0}%
            </p>
          </div>
          <div className="p-4 bg-gray-700 rounded-2xl">
            <p className="text-gray-300 text-sm mb-2">Permis actifs</p>
            <p className="text-4xl font-bold text-orange-400">{stats.permis.actifs}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rapports;