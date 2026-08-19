import { supabase } from '@/integrations/supabase/client';

export type GmaoTypeEquipement = 'tracteur' | 'remorque' | 'autre';

export type GmaoEquipement = {
  id: string;
  code: string;
  designation: string;
  type_equipement: GmaoTypeEquipement | string;
  immatriculation?: string | null;
  numero_chassis?: string | null;
  volume_litres?: number | null;
  configuration?: string | null;
  date_mise_circulation?: string | null;
  categorie_id?: string | null;
  vehicule_id?: string | null;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  site?: string | null;
  departement?: string | null;
  date_mise_service?: string | null;
  statut: string;
  criticite: string;
  compteur_km?: number | null;
  compteur_heures?: number | null;
  observations?: string | null;
  photo_url?: string | null;
  actif: boolean;
  created_at: string;
};

export type GmaoDemande = {
  id: string;
  numero: string | null;
  equipement_id?: string | null;
  titre: string;
  description?: string | null;
  priorite: string;
  statut: string;
  demandeur_nom?: string | null;
  date_demande: string;
  date_traitement?: string | null;
  motif_rejet?: string | null;
  traite_par_nom?: string | null;
  commentaire_validation?: string | null;
};

export type GmaoOrdreTravail = {
  id: string;
  numero: string | null;
  equipement_id?: string | null;
  demande_id?: string | null;
  titre: string;
  description?: string | null;
  type_maintenance: string;
  priorite: string;
  statut: string;
  date_planifiee?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  diagnostic?: string | null;
  travaux_realises?: string | null;
  cout_pieces: number;
  cout_main_oeuvre: number;
  cout_prestation: number;
  cout_autres: number;
  cout_total: number;
  cloture: boolean;
};

export type GmaoPiece = {
  id: string;
  reference: string;
  designation: string;
  categorie?: string | null;
  unite?: string | null;
  quantite_stock: number;
  seuil_mini: number;
  prix_unitaire: number;
  emplacement?: string | null;
  actif: boolean;
};

export type GmaoFournisseur = {
  id: string;
  nom: string;
  type: string;
  contact_nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  actif: boolean;
};

export type GmaoPlan = {
  id: string;
  equipement_id?: string | null;
  libelle: string;
  description?: string | null;
  type_declencheur: string;
  periodicite_jours?: number | null;
  periodicite_km?: number | null;
  periodicite_heures?: number | null;
  prochaine_echeance?: string | null;
  prochain_km?: number | null;
  actif: boolean;
};

const PAGE_SIZE = 1000;

async function fetchAll<T>(table: string, orderBy = 'created_at', ascending = false): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  // Pagination récursive pour dépasser la limite de 1000 lignes
  for (;;) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select('*')
      .order(orderBy, { ascending })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = (data || []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function insertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).from(table).insert(payload).select().single();
  if (error) throw error;
  return data as T;
}

async function updateRow<T>(table: string, id: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).from(table).update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as T;
}

async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await (supabase as any).from(table).delete().eq('id', id);
  if (error) throw error;
}

export const gmaoService = {
  // Équipements
  getEquipements: () => fetchAll<GmaoEquipement>('gmao_equipements', 'code', true),
  createEquipement: (p: Record<string, unknown>) => insertRow<GmaoEquipement>('gmao_equipements', p),
  updateEquipement: (id: string, p: Record<string, unknown>) => updateRow<GmaoEquipement>('gmao_equipements', id, p),
  deleteEquipement: (id: string) => deleteRow('gmao_equipements', id),

  // Demandes d'intervention
  getDemandes: () => fetchAll<GmaoDemande>('gmao_demandes_intervention'),
  createDemande: (p: Record<string, unknown>) => insertRow<GmaoDemande>('gmao_demandes_intervention', p),
  updateDemande: (id: string, p: Record<string, unknown>) => updateRow<GmaoDemande>('gmao_demandes_intervention', id, p),

  // Ordres de travail
  getOrdresTravail: () => fetchAll<GmaoOrdreTravail>('gmao_ordres_travail'),
  createOrdreTravail: (p: Record<string, unknown>) => insertRow<GmaoOrdreTravail>('gmao_ordres_travail', p),
  updateOrdreTravail: (id: string, p: Record<string, unknown>) => updateRow<GmaoOrdreTravail>('gmao_ordres_travail', id, p),
  deleteOrdreTravail: (id: string) => deleteRow('gmao_ordres_travail', id),

  /**
   * Repasse un ordre de travail non démarré en demande d'intervention
   * « en attente de transfert vers un OT ». L'OT est supprimé après création.
   */
  async repasserOtEnDemande(ot: GmaoOrdreTravail, demandeurNom?: string | null, motif?: string | null) {
    const demande = await insertRow<GmaoDemande>('gmao_demandes_intervention', {
      equipement_id: ot.equipement_id || null,
      titre: ot.titre,
      description: [ot.description, motif ? `Repassé depuis l'OT ${ot.numero || ''} : ${motif}` : null]
        .filter(Boolean)
        .join('\n\n') || null,
      priorite: ot.priorite || 'normale',
      statut: 'nouvelle',
      demandeur_nom: demandeurNom || null,
    });
    await deleteRow('gmao_ordres_travail', ot.id);
    return demande;
  },


  // Pièces consommées sur un ordre de travail (déclenche le mouvement de stock en base)
  addOtPiece: (p: Record<string, unknown>) => insertRow('gmao_ot_pieces', p),
  getOtPieces: async (otIds: string[]) => {
    if (!otIds.length) return [] as any[];
    const { data, error } = await (supabase as any)
      .from('gmao_ot_pieces')
      .select('*, gmao_pieces(reference, designation)')
      .in('ot_id', otIds);
    if (error) throw error;
    return (data || []) as any[];
  },


  // Pièces
  getPieces: () => fetchAll<GmaoPiece>('gmao_pieces', 'reference', true),
  createPiece: (p: Record<string, unknown>) => insertRow<GmaoPiece>('gmao_pieces', p),
  updatePiece: (id: string, p: Record<string, unknown>) => updateRow<GmaoPiece>('gmao_pieces', id, p),

  // Fournisseurs
  getFournisseurs: () => fetchAll<GmaoFournisseur>('gmao_fournisseurs', 'nom', true),
  createFournisseur: (p: Record<string, unknown>) => insertRow<GmaoFournisseur>('gmao_fournisseurs', p),
  updateFournisseur: (id: string, p: Record<string, unknown>) => updateRow<GmaoFournisseur>('gmao_fournisseurs', id, p),

  // Plans préventifs
  getPlans: () => fetchAll<GmaoPlan>('gmao_plans_maintenance'),
  createPlan: (p: Record<string, unknown>) => insertRow<GmaoPlan>('gmao_plans_maintenance', p),
  updatePlan: (id: string, p: Record<string, unknown>) => updateRow<GmaoPlan>('gmao_plans_maintenance', id, p),

  // Import des véhicules : une fiche équipement par immatriculation (tracteur ET remorque)
  async importerVehicules(): Promise<number> {
    const { data: vehicules, error } = await supabase
      .from('vehicules')
      .select('*')
      .limit(1000);
    if (error) throw error;

    const existants = await gmaoService.getEquipements();
    const dejaEnregistrees = new Set(
      existants.map((e) => (e.immatriculation || '').toUpperCase()).filter(Boolean)
    );

    const aCreer: Record<string, unknown>[] = [];
    for (const v of (vehicules || []) as any[]) {
      const tracteur = (v.tracteur_immatriculation || '').trim().toUpperCase();
      const remorque = (v.remorque_immatriculation || '').trim().toUpperCase();

      if (tracteur && !dejaEnregistrees.has(tracteur)) {
        dejaEnregistrees.add(tracteur);
        aCreer.push({
          code: `TR-${tracteur}`,
          designation: `Tracteur ${tracteur}${v.tracteur_marque ? ` - ${v.tracteur_marque}` : ''}`,
          type_equipement: 'tracteur',
          immatriculation: tracteur,
          vehicule_id: v.id,
          marque: v.tracteur_marque || v.marque,
          modele: v.tracteur_modele || v.modele,
          numero_chassis: v.tracteur_numero_chassis,
          configuration: v.tracteur_configuration,
          date_mise_circulation: v.tracteur_date_mise_circulation,
          compteur_km: v.kilometrage || 0,
          statut: 'operationnel',
        });
      }

      if (remorque && !dejaEnregistrees.has(remorque)) {
        dejaEnregistrees.add(remorque);
        aCreer.push({
          code: `RM-${remorque}`,
          designation: `Remorque ${remorque}${v.remorque_marque ? ` - ${v.remorque_marque}` : ''}`,
          type_equipement: 'remorque',
          immatriculation: remorque,
          vehicule_id: v.id,
          marque: v.remorque_marque,
          modele: v.remorque_modele,
          numero_chassis: v.remorque_numero_chassis,
          configuration: v.remorque_configuration || v.configuration_remorque,
          volume_litres: v.remorque_volume_litres,
          date_mise_circulation: v.remorque_date_mise_circulation,
          statut: 'operationnel',
        });
      }
    }

    if (aCreer.length === 0) return 0;
    const { error: insErr } = await (supabase as any).from('gmao_equipements').insert(aCreer);
    if (insErr) throw insErr;
    return aCreer.length;
  },

  // Historique complet de maintenance d'un équipement
  async getHistoriqueEquipement(equipementId: string) {
    const [ots, demandes, plans, historique] = await Promise.all([
      (supabase as any).from('gmao_ordres_travail').select('*').eq('equipement_id', equipementId).order('created_at', { ascending: false }),
      (supabase as any).from('gmao_demandes_intervention').select('*').eq('equipement_id', equipementId).order('created_at', { ascending: false }),
      (supabase as any).from('gmao_plans_maintenance').select('*').eq('equipement_id', equipementId),
      (supabase as any).from('gmao_historique_equipement').select('*').eq('equipement_id', equipementId).order('created_at', { ascending: false }),
    ]);

    const otList = (ots.data || []) as GmaoOrdreTravail[];
    let pieces: any[] = [];
    if (otList.length) {
      const { data } = await (supabase as any)
        .from('gmao_ot_pieces')
        .select('*, gmao_pieces(reference, designation)')
        .in('ot_id', otList.map((o) => o.id));
      pieces = data || [];
    }

    return {
      ots: otList,
      demandes: (demandes.data || []) as GmaoDemande[],
      plans: (plans.data || []) as GmaoPlan[],
      historique: historique.data || [],
      pieces,
      coutTotal: otList.reduce((s, o) => s + Number(o.cout_total || 0), 0),
    };
  },

  /**
   * Vue globale du module : une seule collecte de données réutilisée par tous
   * les écrans (dashboard, équipements, interventions, coûts, rapports).
   */
  async getVueGlobale() {
    const [equipements, demandes, ots, pieces, plans] = await Promise.all([
      gmaoService.getEquipements(),
      gmaoService.getDemandes(),
      gmaoService.getOrdresTravail(),
      gmaoService.getPieces(),
      gmaoService.getPlans(),
    ]);
    return { equipements, demandes, ots, pieces, plans };
  },

  async getDashboard() {
    const [equipements, demandes, ots, pieces] = await Promise.all([
      gmaoService.getEquipements(),
      gmaoService.getDemandes(),
      gmaoService.getOrdresTravail(),
      gmaoService.getPieces(),
    ]);

    const otOuverts = ots.filter((o) => !o.cloture);
    const coutTotal = ots.reduce((s, o) => s + Number(o.cout_total || 0), 0);
    const preventifs = ots.filter((o) => o.type_maintenance === 'preventif').length;
    const tauxPreventif = ots.length ? Math.round((preventifs / ots.length) * 100) : 0;

    return {
      equipements: equipements.length,
      equipementsOperationnels: equipements.filter((e) => e.statut === 'operationnel').length,
      equipementsEnMaintenance: equipements.filter((e) => e.statut === 'en_maintenance').length,
      demandesEnAttente: demandes.filter((d) => d.statut === 'nouvelle').length,
      otOuverts: otOuverts.length,
      otEnRetard: otOuverts.filter(
        (o) => o.date_planifiee && new Date(o.date_planifiee) < new Date()
      ).length,
      coutTotal,
      tauxPreventif,
      piecesSousSeuil: pieces.filter((p) => Number(p.quantite_stock) <= Number(p.seuil_mini)).length,
      ots,
      equipementsList: equipements,
    };
  },
};

