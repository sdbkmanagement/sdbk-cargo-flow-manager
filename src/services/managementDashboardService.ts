import { supabase } from '@/integrations/supabase/client';

export interface ManagementKPIs {
  // Fleet overview
  totalVehicules: number;
  vehiculesDisponibles: number;
  vehiculesEnMission: number;
  vehiculesMaintenance: number;
  vehiculesValidation: number;
  totalChauffeurs: number;
  chauffeursActifs: number;

  // Financial
  chiffreAffaires: number;
  caEnAttente: number;
  caMoisActuel: number;
  caMoisPrecedent: number;
  facturesPayees: number;
  facturesEnAttente: number;
  totalMaintenance: number;

  // Operational
  missionsEnCours: number;
  missionsTerminees: number;
  missionsTotal: number;
  blTotal: number;

  // Alerts
  alertesDocuments: number;
  nonConformites: number;
  maintenancesEnCours: number;
}

export interface VehiculeRanking {
  numero: string;
  immatriculation: string;
  totalBL: number;
  totalRevenu: number;
}

export interface ChauffeurRanking {
  nom: string;
  prenom: string;
  totalMissions: number;
  totalBL: number;
}

export interface ClientRanking {
  nom: string;
  totalCA: number;
  totalBL: number;
}

export interface PipelineData {
  maintenance: number;
  administratif: number;
  hsecq: number;
  obc: number;
  disponibles: number;
}

export interface AlerteManagement {
  type: 'panne' | 'non_conformite' | 'document' | 'maintenance';
  titre: string;
  description: string;
  severite: 'critique' | 'haute' | 'moyenne';
  date: string;
}

export const managementDashboardService = {
  async getKPIs(): Promise<ManagementKPIs> {
    const now = new Date();
    const debutMoisActuel = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const finMoisPrecedent = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      vehiculesRes,
      chauffeursRes,
      missionsRes,
      facturesRes,
      blMoisActuelRes,
      blMoisPrecedentRes,
      maintenanceRes,
      ncRes,
      blTotalRes
    ] = await Promise.all([
      supabase.from('vehicules').select('id, statut'),
      supabase.from('chauffeurs').select('id, statut'),
      supabase.from('missions').select('id, statut'),
      supabase.from('factures').select('id, montant_ttc, statut, numero'),
      supabase.from('bons_livraison').select('id, montant_total, date_chargement_reelle').gte('date_chargement_reelle', debutMoisActuel),
      supabase.from('bons_livraison').select('id, montant_total, date_chargement_reelle').gte('date_chargement_reelle', debutMoisPrecedent).lt('date_chargement_reelle', finMoisPrecedent),
      supabase.from('diagnostics_maintenance').select('id, statut, cout_reparation'),
      supabase.from('non_conformites').select('id, statut').neq('statut', 'cloturee'),
      supabase.from('bons_livraison').select('id', { count: 'exact' }).limit(1)
    ]);

    const vehicules = vehiculesRes.data || [];
    const chauffeurs = chauffeursRes.data || [];
    const missions = missionsRes.data || [];
    const factures = facturesRes.data || [];
    const blMoisActuel = blMoisActuelRes.data || [];
    const blMoisPrecedent = blMoisPrecedentRes.data || [];
    const maintenances = maintenanceRes.data || [];
    const ncs = ncRes.data || [];

    const facturesMensuelles = factures.filter(f => f.numero?.startsWith('FM'));

    return {
      totalVehicules: vehicules.length,
      vehiculesDisponibles: vehicules.filter(v => v.statut === 'disponible').length,
      vehiculesEnMission: vehicules.filter(v => v.statut === 'en_mission').length,
      vehiculesMaintenance: vehicules.filter(v => v.statut === 'maintenance' || v.statut === 'hors_service').length,
      vehiculesValidation: vehicules.filter(v => v.statut === 'validation_requise').length,
      totalChauffeurs: chauffeurs.length,
      chauffeursActifs: chauffeurs.filter(c => c.statut === 'actif').length,
      chiffreAffaires: facturesMensuelles.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.montant_ttc || 0), 0),
      caEnAttente: facturesMensuelles.filter(f => f.statut === 'en_attente').reduce((s, f) => s + (f.montant_ttc || 0), 0),
      caMoisActuel: blMoisActuel.reduce((s, bl) => s + (bl.montant_total || 0), 0),
      caMoisPrecedent: blMoisPrecedent.reduce((s, bl) => s + (bl.montant_total || 0), 0),
      facturesPayees: facturesMensuelles.filter(f => f.statut === 'payee').length,
      facturesEnAttente: facturesMensuelles.filter(f => f.statut === 'en_attente').length,
      totalMaintenance: maintenances.reduce((s, m) => s + (m.cout_reparation || 0), 0),
      missionsEnCours: missions.filter(m => m.statut === 'en_cours').length,
      missionsTerminees: missions.filter(m => m.statut === 'terminee').length,
      missionsTotal: missions.length,
      blTotal: blTotalRes.count || 0,
      alertesDocuments: 0, // Will be filled by alertesService
      nonConformites: ncs.length,
      maintenancesEnCours: maintenances.filter(m => m.statut === 'en_cours').length,
    };
  },

  async getTopVehicules(): Promise<VehiculeRanking[]> {
    const { data } = await supabase
      .from('bons_livraison')
      .select('vehicule_id, montant_total, vehicule:vehicules(numero, immatriculation)');

    if (!data) return [];

    const vehiculeMap = new Map<string, VehiculeRanking>();
    data.forEach(bl => {
      const vid = bl.vehicule_id;
      const existing = vehiculeMap.get(vid);
      const veh = bl.vehicule as any;
      if (existing) {
        existing.totalBL++;
        existing.totalRevenu += bl.montant_total || 0;
      } else {
        vehiculeMap.set(vid, {
          numero: veh?.numero || vid,
          immatriculation: veh?.immatriculation || '',
          totalBL: 1,
          totalRevenu: bl.montant_total || 0,
        });
      }
    });

    return Array.from(vehiculeMap.values())
      .sort((a, b) => b.totalRevenu - a.totalRevenu)
      .slice(0, 5);
  },

  async getTopChauffeurs(): Promise<ChauffeurRanking[]> {
    const { data } = await supabase
      .from('bons_livraison')
      .select('chauffeur_id, chauffeur:chauffeurs(nom, prenom)');

    if (!data) return [];

    const map = new Map<string, ChauffeurRanking>();
    data.forEach(bl => {
      const cid = bl.chauffeur_id;
      const ch = bl.chauffeur as any;
      const existing = map.get(cid);
      if (existing) {
        existing.totalBL++;
      } else {
        map.set(cid, {
          nom: ch?.nom || '',
          prenom: ch?.prenom || '',
          totalMissions: 0,
          totalBL: 1,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalBL - a.totalBL)
      .slice(0, 5);
  },

  async getTopClients(): Promise<ClientRanking[]> {
    const { data } = await supabase
      .from('factures')
      .select('client_nom, montant_ttc')
      .eq('statut', 'payee');

    if (!data) return [];

    const map = new Map<string, ClientRanking>();
    data.forEach(f => {
      const existing = map.get(f.client_nom);
      if (existing) {
        existing.totalCA += f.montant_ttc || 0;
        existing.totalBL++;
      } else {
        map.set(f.client_nom, {
          nom: f.client_nom,
          totalCA: f.montant_ttc || 0,
          totalBL: 1,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalCA - a.totalCA)
      .slice(0, 5);
  },

  async getPipelineData(): Promise<PipelineData> {
    const { data } = await supabase
      .from('validation_etapes')
      .select('etape, statut, workflow:validation_workflows(vehicule_id, statut_global)')
      .eq('statut', 'en_attente');

    const pipeline: PipelineData = {
      maintenance: 0,
      administratif: 0,
      hsecq: 0,
      obc: 0,
      disponibles: 0,
    };

    if (data) {
      data.forEach(e => {
        const workflow = e.workflow as any;
        if (workflow?.statut_global === 'en_validation') {
          if (e.etape === 'maintenance') pipeline.maintenance++;
          if (e.etape === 'administratif') pipeline.administratif++;
          if (e.etape === 'hsecq') pipeline.hsecq++;
          if (e.etape === 'obc') pipeline.obc++;
        }
      });
    }

    const { count } = await supabase
      .from('vehicules')
      .select('id', { count: 'exact' })
      .eq('statut', 'disponible')
      .limit(1);

    pipeline.disponibles = count || 0;

    return pipeline;
  },

  async getAlertesManagement(): Promise<AlerteManagement[]> {
    const alertes: AlerteManagement[] = [];

    // Non-conformités ouvertes
    const { data: ncs } = await supabase
      .from('non_conformites')
      .select('id, type_nc, description, categorie, created_at, vehicule_id')
      .neq('statut', 'cloturee')
      .order('created_at', { ascending: false })
      .limit(5);

    ncs?.forEach(nc => {
      alertes.push({
        type: 'non_conformite',
        titre: `NC ${nc.type_nc}`,
        description: nc.description || nc.categorie || 'Non-conformité détectée',
        severite: nc.type_nc === 'critique' ? 'critique' : 'haute',
        date: nc.created_at,
      });
    });

    // Maintenances en cours
    const { data: maintenances } = await supabase
      .from('diagnostics_maintenance')
      .select('id, type_panne, description_panne, created_at, vehicule_id, vehicule:vehicules(numero)')
      .eq('statut', 'en_cours')
      .order('created_at', { ascending: false })
      .limit(5);

    maintenances?.forEach(m => {
      const veh = m.vehicule as any;
      alertes.push({
        type: 'panne',
        titre: `Panne ${veh?.numero || ''}`,
        description: m.description_panne || m.type_panne || 'Maintenance en cours',
        severite: 'haute',
        date: m.created_at,
      });
    });

    return alertes.sort((a, b) => {
      const sevOrder = { critique: 0, haute: 1, moyenne: 2 };
      return sevOrder[a.severite] - sevOrder[b.severite];
    }).slice(0, 10);
  },

  async getCAParTypeTransport(): Promise<{ hydrocarbures: number; bauxite: number }> {
    const { data } = await supabase
      .from('bons_livraison')
      .select('montant_total, mission:missions(type_transport)');

    let hydrocarbures = 0;
    let bauxite = 0;

    data?.forEach(bl => {
      const mission = bl.mission as any;
      const montant = bl.montant_total || 0;
      if (mission?.type_transport === 'hydrocarbures') {
        hydrocarbures += montant;
      } else if (mission?.type_transport === 'bauxite') {
        bauxite += montant;
      }
    });

    return { hydrocarbures, bauxite };
  }
};
