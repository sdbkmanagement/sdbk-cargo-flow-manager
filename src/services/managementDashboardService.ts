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

export interface CAMensuel {
  mois: string;
  label: string;
  ca: number;
  nbFactures: number;
}

export interface BLParJour {
  date: string;
  label: string;
  count: number;
}

export interface FormationsKPIs {
  totalFormations: number;
  valides: number;
  aRenouveler: number;
  expirees: number;
  tauxConformite: number;
  compagnonnagesTotal: number;
  compagnonnagesAJour: number;
  compagnonnagesExpires: number;
}

export interface RHStats {
  totalEmployes: number;
  actifs: number;
  inactifs: number;
  hommes: number;
  femmes: number;
  cdi: number;
  cdd: number;
  autres: number;
  parService: { service: string; count: number }[];
  parContrat: { type: string; count: number }[];
  visiteMedicaleAJour: number;
  visiteMedicaleExpiree: number;
  visiteMedicaleAFaire: number;
}

// Helper to fetch all rows beyond Supabase's 1000-row limit
async function fetchAllRows<T>(
  tableName: any,
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
  },

  async getCAMensuel(): Promise<CAMensuel[]> {
    const data = await fetchAllRows<any>('factures', 'montant_ht, date_emission, numero', 
      q => q.order('date_emission', { ascending: true })
    );

    const moisMap = new Map<string, { ca: number; nbFactures: number }>();
    
    data.forEach(facture => {
      if (!facture.numero) return;
      // Extraire le mois/année du numéro de facture (ex: FM202512-xxx -> 2025-12)
      const match = facture.numero.match(/FM(\d{4})(\d{2})/);
      let key: string;
      if (match) {
        key = `${match[1]}-${match[2]}`;
      } else if (facture.date_emission) {
        const date = new Date(facture.date_emission);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        return;
      }
      const existing = moisMap.get(key);
      if (existing) {
        existing.ca += facture.montant_ht || 0;
        existing.nbFactures++;
      } else {
        moisMap.set(key, { ca: facture.montant_ht || 0, nbFactures: 1 });
      }
    });

    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return Array.from(moisMap.entries())
      .filter(([key]) => key.match(/^\d{4}-\d{2}$/))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        return {
          mois: key,
          label: `${moisNoms[parseInt(month) - 1]} ${year.slice(2)}`,
          ca: val.ca,
          nbFactures: val.nbFactures,
        };
      });
  },

  async getRHStats(): Promise<RHStats> {
    const employes = await fetchAllRows<any>('employes', 'id, statut, genre, type_contrat, service, statut_visite_medicale');

    const parService = new Map<string, number>();
    const parContrat = new Map<string, number>();
    let visiteMedicaleAJour = 0;
    let visiteMedicaleExpiree = 0;
    let visiteMedicaleAFaire = 0;

    employes.forEach(e => {
      const svc = e.service || 'Non défini';
      parService.set(svc, (parService.get(svc) || 0) + 1);
      
      const contrat = e.type_contrat || 'Non défini';
      parContrat.set(contrat, (parContrat.get(contrat) || 0) + 1);

      if (e.statut_visite_medicale === 'A jour') visiteMedicaleAJour++;
      else if (e.statut_visite_medicale === 'Expirée') visiteMedicaleExpiree++;
      else visiteMedicaleAFaire++;
    });

    return {
      totalEmployes: employes.length,
      actifs: employes.filter(e => e.statut === 'actif').length,
      inactifs: employes.filter(e => e.statut !== 'actif').length,
      hommes: employes.filter(e => e.genre === 'Masculin').length,
      femmes: employes.filter(e => e.genre === 'Féminin').length,
      cdi: employes.filter(e => e.type_contrat === 'CDI').length,
      cdd: employes.filter(e => e.type_contrat === 'CDD').length,
      autres: employes.filter(e => e.type_contrat && e.type_contrat !== 'CDI' && e.type_contrat !== 'CDD').length,
      parService: Array.from(parService.entries())
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      parContrat: Array.from(parContrat.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      visiteMedicaleAJour,
      visiteMedicaleExpiree,
      visiteMedicaleAFaire,
    };
  },

  async getBLParJour(nbJours: number = 30): Promise<BLParJour[]> {
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - nbJours);
    
    const { data, error } = await supabase
      .from('bons_livraison')
      .select('date_emission')
      .gte('date_emission', dateDebut.toISOString().split('T')[0]);
    
    if (error) throw error;
    
    const countMap = new Map<string, number>();
    
    // Initialize all days
    for (let i = 0; i < nbJours; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (nbJours - 1 - i));
      const key = d.toISOString().split('T')[0];
      countMap.set(key, 0);
    }
    
    (data || []).forEach((bl: any) => {
      const key = bl.date_emission;
      if (countMap.has(key)) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });
    
    return Array.from(countMap.entries()).map(([date, count]) => {
      const d = new Date(date);
      return {
        date,
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count,
      };
    });
  },

  async getFormationsKPIs(): Promise<FormationsKPIs> {
    const [formationsRes, compagnonnagesRes] = await Promise.all([
      supabase.from('formations' as any).select('statut'),
      supabase.from('compagnonnage' as any).select('date_formation, date_echeance'),
    ]);

    const formations = (formationsRes.data || []) as any[];
    const compagnonnages = (compagnonnagesRes.data || []) as any[];
    
    const valides = formations.filter(f => f.statut === 'valide').length;
    const aRenouveler = formations.filter(f => f.statut === 'a_renouveler').length;
    const expirees = formations.filter(f => f.statut === 'expire').length;
    const tauxConformite = formations.length > 0 ? Math.round((valides / formations.length) * 100) : 100;

    const today = new Date();
    const compagnonnagesAJour = compagnonnages.filter(c => {
      if (!c.date_echeance) return false;
      return new Date(c.date_echeance) >= today;
    }).length;
    const compagnonnagesExpires = compagnonnages.filter(c => {
      if (!c.date_echeance) return false;
      return new Date(c.date_echeance) < today;
    }).length;

    return {
      totalFormations: formations.length,
      valides,
      aRenouveler,
      expirees,
      tauxConformite,
      compagnonnagesTotal: compagnonnages.length,
      compagnonnagesAJour,
      compagnonnagesExpires,
    };
  },
};
