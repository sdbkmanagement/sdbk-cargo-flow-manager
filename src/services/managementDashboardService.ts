import { supabase } from '@/integrations/supabase/client';

export interface ManagementKPIs {
  totalVehicules: number;
  vehiculesDisponibles: number;
  vehiculesEnMission: number;
  vehiculesMaintenance: number;
  vehiculesValidation: number;
  totalChauffeurs: number;
  chauffeursActifs: number;
  chiffreAffaires: number;
  caEnAttente: number;
  caMoisActuel: number;
  caMoisPrecedent: number;
  facturesPayees: number;
  facturesEnAttente: number;
  totalMaintenance: number;
  missionsEnCours: number;
  missionsTerminees: number;
  missionsTotal: number;
  blTotal: number;
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

// Helper to fetch all rows beyond Supabase's 1000-row limit
async function fetchAllRows<T>(
  tableName: string,
  selectColumns: string,
  filters?: (query: any) => any
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(tableName).select(selectColumns).range(from, from + PAGE_SIZE - 1);
    if (filters) query = filters(query);
    const { data, error } = await query;
    if (error || !data) break;
    allData = allData.concat(data as T[]);
    hasMore = data.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allData;
}

export const managementDashboardService = {
  async getKPIs(): Promise<ManagementKPIs> {
    const now = new Date();
    const debutMoisActuel = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const finMoisPrecedent = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      vehicules,
      chauffeurs,
      missions,
      factures,
      blMoisActuel,
      blMoisPrecedent,
      maintenances,
      ncs,
      blTotalRes
    ] = await Promise.all([
      fetchAllRows<any>('vehicules', 'id, statut'),
      fetchAllRows<any>('chauffeurs', 'id, statut'),
      fetchAllRows<any>('missions', 'id, statut'),
      fetchAllRows<any>('factures', 'id, montant_ttc, statut, numero'),
      fetchAllRows<any>('bons_livraison', 'id, montant_total, date_chargement_reelle', q => q.gte('date_chargement_reelle', debutMoisActuel)),
      fetchAllRows<any>('bons_livraison', 'id, montant_total, date_chargement_reelle', q => q.gte('date_chargement_reelle', debutMoisPrecedent).lt('date_chargement_reelle', finMoisPrecedent)),
      fetchAllRows<any>('diagnostics_maintenance', 'id, statut, cout_reparation'),
      fetchAllRows<any>('non_conformites', 'id, statut', q => q.neq('statut', 'cloturee')),
      supabase.from('bons_livraison').select('id', { count: 'exact' }).limit(1)
    ]);

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
      alertesDocuments: 0,
      nonConformites: ncs.length,
      maintenancesEnCours: maintenances.filter(m => m.statut === 'en_cours').length,
    };
  },

  async getTopVehicules(): Promise<VehiculeRanking[]> {
    const data = await fetchAllRows<any>('bons_livraison', 'vehicule_id, montant_total, vehicule:vehicules(numero, immatriculation)');

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
    const data = await fetchAllRows<any>('bons_livraison', 'chauffeur_id, chauffeur:chauffeurs(nom, prenom)');

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
    const data = await fetchAllRows<any>('factures', 'client_nom, montant_ttc', q => q.eq('statut', 'payee'));

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
    const data = await fetchAllRows<any>('bons_livraison', 'montant_total, mission:missions(type_transport)');

    let hydrocarbures = 0;
    let bauxite = 0;

    data.forEach(bl => {
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
