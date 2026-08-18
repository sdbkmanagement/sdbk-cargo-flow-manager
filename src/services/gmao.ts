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

  // Import des véhicules existants comme équipements (liaison, pas de copie)
  async importerVehicules(): Promise<number> {
    const { data: vehicules, error } = await supabase
      .from('vehicules')
      .select('id, numero, immatriculation, marque, modele, type_vehicule')
      .limit(1000);
    if (error) throw error;

    const existants = await gmaoService.getEquipements();
    const dejaLies = new Set(existants.map((e) => e.vehicule_id).filter(Boolean));

    const aCreer = (vehicules || [])
      .filter((v: any) => !dejaLies.has(v.id))
      .map((v: any) => ({
        code: `EQ-${v.numero || v.immatriculation}`,
        designation: `${v.marque || 'Véhicule'} ${v.modele || ''} ${v.immatriculation || ''}`.trim(),
        vehicule_id: v.id,
        marque: v.marque,
        modele: v.modele,
        statut: 'operationnel',
      }));

    if (aCreer.length === 0) return 0;
    const { error: insErr } = await (supabase as any).from('gmao_equipements').insert(aCreer);
    if (insErr) throw insErr;
    return aCreer.length;
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
