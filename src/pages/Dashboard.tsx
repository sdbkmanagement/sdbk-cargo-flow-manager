import React, { useState, useEffect } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck, Users, DollarSign, TrendingUp, Clock,
  AlertTriangle, FileText, Calendar, RefreshCw,
  BarChart3, Route, Wrench, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { alertesService } from '@/services/alertesService';
import {
  managementDashboardService,
  ManagementKPIs,
  VehiculeRanking,
  ChauffeurRanking,
  ClientRanking,
  PipelineData,
  AlerteManagement,
  CAMensuel,
  RHStats,
  BLParJour,
  FormationsKPIs,
} from '@/services/managementDashboardService';
import { KPICard } from '@/components/dashboard/KPICard';
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel';
import { Rankings } from '@/components/dashboard/Rankings';
import { AlertesManagementBlock } from '@/components/dashboard/AlertesManagementBlock';
import { FinancialAnalysis } from '@/components/dashboard/FinancialAnalysis';
import { ProductivityMetrics } from '@/components/dashboard/ProductivityMetrics';
import { FleetOverview } from '@/components/dashboard/FleetOverview';
import { CAEvolutionChart } from '@/components/dashboard/CAEvolutionChart';
import { RHDashboardCharts } from '@/components/dashboard/RHDashboardCharts';
import { BLParJourChart } from '@/components/dashboard/BLParJourChart';
import { FormationsKPICards } from '@/components/dashboard/FormationsKPICards';

const formatGNF = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
  return value.toLocaleString('fr-FR');
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [topVehicules, setTopVehicules] = useState<VehiculeRanking[]>([]);
  const [topChauffeurs, setTopChauffeurs] = useState<ChauffeurRanking[]>([]);
  const [topClients, setTopClients] = useState<ClientRanking[]>([]);
  const [pipeline, setPipeline] = useState<PipelineData>({ maintenance: 0, administratif: 0, hsecq: 0, obc: 0, disponibles: 0 });
  const [alertesManagement, setAlertesManagement] = useState<AlerteManagement[]>([]);
  const [caParType, setCaParType] = useState<{ hydrocarbures: number; bauxite: number }>({ hydrocarbures: 0, bauxite: 0 });
  const [alertesCount, setAlertesCount] = useState(0);
  const [caMensuel, setCaMensuel] = useState<CAMensuel[]>([]);
  const [rhStats, setRhStats] = useState<RHStats>({ totalEmployes: 0, actifs: 0, inactifs: 0, hommes: 0, femmes: 0, cdi: 0, cdd: 0, autres: 0, parService: [], parContrat: [], visiteMedicaleAJour: 0, visiteMedicaleExpiree: 0, visiteMedicaleAFaire: 0 });

  const loadData = async () => {
    try {
      const [kpiData, vehiculesRank, chauffeursRank, clientsRank, pipelineData, alertesMgmt, caType, alertes, caEvolution, rhData] = await Promise.all([
        managementDashboardService.getKPIs(),
        managementDashboardService.getTopVehicules(),
        managementDashboardService.getTopChauffeurs(),
        managementDashboardService.getTopClients(),
        managementDashboardService.getPipelineData(),
        managementDashboardService.getAlertesManagement(),
        managementDashboardService.getCAParTypeTransport(),
        alertesService.getToutesAlertes(),
        managementDashboardService.getCAMensuel(),
        managementDashboardService.getRHStats(),
      ]);

      setKpis({ ...kpiData, alertesDocuments: alertes.length });
      setTopVehicules(vehiculesRank);
      setTopChauffeurs(chauffeursRank);
      setTopClients(clientsRank);
      setPipeline(pipelineData);
      setAlertesManagement(alertesMgmt);
      setCaParType(caType);
      setAlertesCount(alertes.length);
      setCaMensuel(caEvolution);
      setRhStats(rhData);
    } catch (error) {
      console.error('Erreur dashboard:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  if (loading || !kpis) {
    return (
      <ModuleLayout title="Tableau de Bord Management" subtitle="Chargement...">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ModuleLayout>
    );
  }

  const variationCA = kpis.caMoisPrecedent > 0
    ? ((kpis.caMoisActuel - kpis.caMoisPrecedent) / kpis.caMoisPrecedent) * 100
    : 0;

  const tauxUtilisation = kpis.totalVehicules > 0
    ? (kpis.vehiculesEnMission / kpis.totalVehicules) * 100
    : 0;

  const revenuMoyenCamion = kpis.totalVehicules > 0
    ? kpis.chiffreAffaires / kpis.totalVehicules
    : 0;

  return (
    <ModuleLayout title="Tableau de Bord Management" subtitle="Pilotage stratégique de la flotte SDBK">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Indicateurs Stratégiques</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* KPI Row 1 - Financier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Chiffre d'Affaires"
            value={`${formatGNF(kpis.chiffreAffaires)} GNF`}
            icon={DollarSign}
            subtitle={`${kpis.facturesPayees} factures payées`}
            color="text-emerald-600"
          />
          <KPICard
            title="CA en Attente"
            value={`${formatGNF(kpis.caEnAttente)} GNF`}
            icon={Clock}
            subtitle={`${kpis.facturesEnAttente} factures`}
            color="text-amber-600"
          />
          <KPICard
            title="CA Mois Actuel"
            value={`${formatGNF(kpis.caMoisActuel)} GNF`}
            icon={TrendingUp}
            variation={variationCA}
            variationLabel="vs mois préc."
            color="text-blue-600"
          />
          <KPICard
            title="Revenu Moyen / Camion"
            value={`${formatGNF(revenuMoyenCamion)} GNF`}
            icon={Truck}
            subtitle={`${kpis.totalVehicules} véhicules`}
            color="text-purple-600"
          />
        </div>

        {/* KPI Row 2 - Opérationnel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Véhicules"
            value={kpis.totalVehicules}
            icon={Truck}
            subtitle={`${kpis.vehiculesDisponibles} disponibles`}
            color="text-blue-600"
          />
          <KPICard
            title="Chauffeurs Actifs"
            value={`${kpis.chauffeursActifs}/${kpis.totalChauffeurs}`}
            icon={Users}
            color="text-emerald-600"
          />
          <KPICard
            title="Missions en Cours"
            value={kpis.missionsEnCours}
            icon={Route}
            subtitle={`${kpis.missionsTerminees} terminées`}
            color="text-indigo-600"
          />
          <KPICard
            title="Non-Conformités"
            value={kpis.nonConformites}
            icon={AlertTriangle}
            color={kpis.nonConformites > 0 ? 'text-red-600' : 'text-emerald-600'}
          />
          <KPICard
            title="Taux d'Utilisation"
            value={`${tauxUtilisation.toFixed(1)}%`}
            icon={BarChart3}
            color={tauxUtilisation > 50 ? 'text-emerald-600' : 'text-amber-600'}
          />
        </div>

        {/* Main grid - Analyse + Pipeline + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FinancialAnalysis
            chiffreAffaires={kpis.chiffreAffaires}
            caEnAttente={kpis.caEnAttente}
            totalMaintenance={kpis.totalMaintenance}
            caMoisActuel={kpis.caMoisActuel}
            caMoisPrecedent={kpis.caMoisPrecedent}
            caHydrocarbures={caParType.hydrocarbures}
            caBauxite={caParType.bauxite}
          />
          <PipelineFunnel data={pipeline} />
          <AlertesManagementBlock alertes={alertesManagement} />
        </div>

        {/* Fleet + Productivity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FleetOverview
            total={kpis.totalVehicules}
            disponibles={kpis.vehiculesDisponibles}
            enMission={kpis.vehiculesEnMission}
            maintenance={kpis.vehiculesMaintenance}
            validation={kpis.vehiculesValidation}
          />
          <ProductivityMetrics
            totalVehicules={kpis.totalVehicules}
            vehiculesEnMission={kpis.vehiculesEnMission}
            vehiculesMaintenance={kpis.vehiculesMaintenance}
            missionsTerminees={kpis.missionsTerminees}
            missionsTotal={kpis.missionsTotal}
            blTotal={kpis.blTotal}
          />
        </div>

        {/* CA Evolution Chart */}
        <CAEvolutionChart data={caMensuel} />

        {/* RH Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RHDashboardCharts stats={rhStats} />
        </div>

        {/* Rankings */}
        <Rankings
          topVehicules={topVehicules}
          topChauffeurs={topChauffeurs}
          topClients={topClients}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nouvelle Mission', icon: Route, route: '/missions', color: 'text-blue-500' },
            { label: 'Flotte', icon: Truck, route: '/fleet', color: 'text-emerald-500' },
            { label: 'Facturation', icon: FileText, route: '/billing', color: 'text-amber-500' },
            { label: 'Validations', icon: ShieldCheck, route: '/validations', color: 'text-purple-500' },
          ].map((action) => (
            <Button
              key={action.route}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate(action.route)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </ModuleLayout>
  );
};

export default Dashboard;
