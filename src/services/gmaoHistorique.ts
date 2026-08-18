import { supabase } from '@/integrations/supabase/client';

export type InterventionHistorique = {
  id: string;
  numero: string | null;
  titre: string;
  description?: string | null;
  type_maintenance: string;
  nature: string;
  priorite: string;
  statut: string;
  date_intervention: string | null;
  date_planifiee?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  duree_immobilisation_heures: number;
  diagnostic?: string | null;
  travaux_realises?: string | null;
  panne?: string | null;
  cout_pieces: number;
  cout_main_oeuvre: number;
  cout_prestation: number;
  cout_autres: number;
  cout_total: number;
  compteur_km?: number | null;
  compteur_heures?: number | null;
  fournisseur?: string | null;
  techniciens: string[];
  pieces: { reference: string; designation: string; quantite: number; montant: number }[];
  documents: { nom: string; url: string }[];
  cloture: boolean;
  cloture_par?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type FiltresHistorique = {
  dateDebut?: string;
  dateFin?: string;
  type?: string;
  statut?: string;
  technicien?: string;
  fournisseur?: string;
  nature?: string;
};

const nom = (t: any) => [t?.prenom, t?.nom].filter(Boolean).join(' ').trim();

/** Récupère tout le carnet de maintenance d'un équipement (source : ordres de travail GMAO) */
export async function getInterventionsEquipement(equipementId: string): Promise<InterventionHistorique[]> {
  const { data, error } = await (supabase as any)
    .from('gmao_ordres_travail')
    .select(`*,
      gmao_fournisseurs(nom),
      gmao_demandes_intervention(numero, titre, description),
      gmao_ot_pieces(quantite, montant, gmao_pieces(reference, designation)),
      gmao_ot_techniciens(heures, role, gmao_techniciens(nom, prenom))`)
    .eq('equipement_id', equipementId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const ots = (data || []) as any[];
  let jointes: any[] = [];
  if (ots.length) {
    const { data: pj } = await (supabase as any)
      .from('gmao_pieces_jointes')
      .select('*')
      .eq('entite', 'ot')
      .in('entite_id', ots.map((o) => o.id));
    jointes = pj || [];
  }

  const liste: InterventionHistorique[] = ots.map((o) => ({
    id: o.id,
    numero: o.numero,
    titre: o.titre,
    description: o.description,
    type_maintenance: o.type_maintenance,
    nature: o.titre,
    priorite: o.priorite,
    statut: o.statut,
    date_intervention: o.date_debut || o.date_planifiee || o.created_at,
    date_planifiee: o.date_planifiee,
    date_debut: o.date_debut,
    date_fin: o.date_fin,
    duree_immobilisation_heures: Number(o.duree_immobilisation_heures || 0),
    diagnostic: o.diagnostic,
    travaux_realises: o.travaux_realises,
    panne: o.gmao_demandes_intervention?.titre || o.diagnostic || null,
    cout_pieces: Number(o.cout_pieces || 0),
    cout_main_oeuvre: Number(o.cout_main_oeuvre || 0),
    cout_prestation: Number(o.cout_prestation || 0),
    cout_autres: Number(o.cout_autres || 0),
    cout_total: Number(o.cout_total || 0),
    fournisseur: o.gmao_fournisseurs?.nom || null,
    techniciens: (o.gmao_ot_techniciens || []).map((t: any) => nom(t.gmao_techniciens)).filter(Boolean),
    pieces: (o.gmao_ot_pieces || []).map((p: any) => ({
      reference: p.gmao_pieces?.reference || '—',
      designation: p.gmao_pieces?.designation || '—',
      quantite: Number(p.quantite || 0),
      montant: Number(p.montant || 0),
    })),
    documents: jointes
      .filter((j) => j.entite_id === o.id)
      .map((j) => ({ nom: j.nom, url: j.url })),
    cloture: !!o.cloture,
    cloture_par: o.cloture_par,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }));

  return liste.sort(
    (a, b) => new Date(b.date_intervention || 0).getTime() - new Date(a.date_intervention || 0).getTime()
  );
}

export function filtrerInterventions(liste: InterventionHistorique[], f: FiltresHistorique) {
  return liste.filter((i) => {
    const d = i.date_intervention ? new Date(i.date_intervention) : null;
    if (f.dateDebut && (!d || d < new Date(`${f.dateDebut}T00:00:00`))) return false;
    if (f.dateFin && (!d || d > new Date(`${f.dateFin}T23:59:59`))) return false;
    if (f.type && f.type !== 'tous' && i.type_maintenance !== f.type) return false;
    if (f.statut && f.statut !== 'tous' && i.statut !== f.statut) return false;
    if (f.technicien && f.technicien !== 'tous' && !i.techniciens.includes(f.technicien)) return false;
    if (f.fournisseur && f.fournisseur !== 'tous' && i.fournisseur !== f.fournisseur) return false;
    if (f.nature && !`${i.titre} ${i.description || ''}`.toLowerCase().includes(f.nature.toLowerCase())) return false;
    return true;
  });
}

export function synthese(liste: InterventionHistorique[]) {
  const total = liste.length;
  const preventif = liste.filter((i) => i.type_maintenance === 'preventif').length;
  const correctif = liste.filter((i) => i.type_maintenance === 'correctif').length;
  const coutPieces = liste.reduce((s, i) => s + i.cout_pieces, 0);
  const coutMO = liste.reduce((s, i) => s + i.cout_main_oeuvre, 0);
  const coutTotal = liste.reduce((s, i) => s + i.cout_total, 0);
  const immobilisation = liste.reduce((s, i) => s + i.duree_immobilisation_heures, 0);
  const derniere = liste[0]?.date_intervention || null;
  return { total, preventif, correctif, coutPieces, coutMO, coutTotal, immobilisation, derniere };
}
