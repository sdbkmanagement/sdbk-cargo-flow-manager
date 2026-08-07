import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface RHDashboardStats {
  effectif_total: number;
  effectif_actif: number;
  effectif_inactif: number;
  hommes: number;
  femmes: number;
  age_moyen: number | null;
  anciennete_moyenne: number | null;
  masse_salariale: number;
  par_departement: { name: string; value: number }[];
  par_service: { name: string; value: number }[];
  par_fonction: { name: string; value: number }[];
  par_contrat: { name: string; value: number }[];
  pyramide_ages: { name: string; hommes: number; femmes: number; value: number }[];
  absences_en_cours: number;
  conges_en_cours: number;
  contrats_echeance: number;
  documents_expirants: number;
  visites_medicales: number;
  departs_retraite: number;
}

export interface AlerteRH {
  type_alerte: string;
  categorie: string;
  employe_id: string;
  nom_complet: string;
  service: string;
  message: string;
  date_echeance: string;
  jours_restants: number;
  priorite: 'normale' | 'importante' | 'critique';
}

export interface DocumentRH {
  id: string;
  employe_id: string;
  type_document: string;
  numero_document?: string | null;
  date_emission?: string | null;
  date_expiration?: string | null;
  statut: string;
  fichier_url?: string | null;
  fichier_nom?: string | null;
  commentaire?: string | null;
  created_at: string;
}

export const TYPES_DOCUMENTS_RH = [
  'Contrat',
  'Permis de conduire',
  "Pièce d'identité",
  'Passeport',
  'Diplôme',
  'Certification',
  'Certificat médical',
];

export const sirhService = {
  async getDashboardStats(): Promise<RHDashboardStats> {
    const { data, error } = await sb.rpc('get_rh_dashboard_stats');
    if (error) throw error;
    return data as RHDashboardStats;
  },

  async getAlertes(): Promise<AlerteRH[]> {
    const { data, error } = await sb.rpc('get_alertes_rh');
    if (error) throw error;
    return (data || []) as AlerteRH[];
  },

  async getAlertesConfig() {
    const { data, error } = await sb.from('alertes_rh_config').select('*').order('categorie');
    if (error) throw error;
    return data || [];
  },

  async updateAlerteConfig(id: string, updates: { delai_jours?: number; actif?: boolean }) {
    const { error } = await sb.from('alertes_rh_config').update(updates).eq('id', id);
    if (error) throw error;
  },

  // ---------- Documents RH ----------
  async getDocuments(employeId?: string): Promise<any[]> {
    let query = sb
      .from('documents_rh')
      .select('*, employes:employe_id (id, nom, prenom, matricule, service)')
      .order('date_expiration', { ascending: true, nullsFirst: false });
    if (employeId) query = query.eq('employe_id', employeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createDocument(doc: Partial<DocumentRH>) {
    const { error } = await sb.from('documents_rh').insert([doc]);
    if (error) throw error;
  },

  async updateDocument(id: string, updates: Partial<DocumentRH>) {
    const { error } = await sb.from('documents_rh').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteDocument(id: string) {
    const { error } = await sb.from('documents_rh').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadFichier(file: File) {
    const ext = file.name.split('.').pop();
    const path = `rh/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return { url: data.publicUrl, nom: file.name };
  },

  // ---------- Objectifs ----------
  async getObjectifs(employeId?: string) {
    let query = sb
      .from('objectifs')
      .select('*, employes:employe_id (id, nom, prenom, service)')
      .order('date_echeance', { ascending: true, nullsFirst: false });
    if (employeId) query = query.eq('employe_id', employeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async saveObjectif(objectif: any) {
    if (objectif.id) {
      const { id, employes, ...rest } = objectif;
      const { error } = await sb.from('objectifs').update(rest).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('objectifs').insert([objectif]);
      if (error) throw error;
    }
  },

  async deleteObjectif(id: string) {
    const { error } = await sb.from('objectifs').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- Compétences ----------
  async getCompetences() {
    const { data, error } = await sb.from('competences').select('*').order('categorie').order('libelle');
    if (error) throw error;
    return data || [];
  },

  async saveCompetence(competence: any) {
    if (competence.id) {
      const { id, ...rest } = competence;
      const { error } = await sb.from('competences').update(rest).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('competences').insert([competence]);
      if (error) throw error;
    }
  },

  async deleteCompetence(id: string) {
    const { error } = await sb.from('competences').delete().eq('id', id);
    if (error) throw error;
  },

  async getCompetencesEmployes(employeId?: string) {
    let query = sb
      .from('competences_employes')
      .select('*, competences:competence_id (id, libelle, categorie, niveau_requis), employes:employe_id (id, nom, prenom, service, poste)');
    if (employeId) query = query.eq('employe_id', employeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async setCompetenceEmploye(row: { employe_id: string; competence_id: string; niveau: number; certifie?: boolean; annees_experience?: number; potentiel?: number }) {
    const { error } = await sb
      .from('competences_employes')
      .upsert([{ ...row, date_evaluation: new Date().toISOString().slice(0, 10) }], { onConflict: 'employe_id,competence_id' });
    if (error) throw error;
  },

  // ---------- Droits congés ----------
  async getDroitsConges(annee: number) {
    const { data, error } = await sb
      .from('droits_conges')
      .select('*, employes:employe_id (id, nom, prenom, service)')
      .eq('annee', annee);
    if (error) throw error;
    return data || [];
  },

  async setDroitConge(employe_id: string, annee: number, jours_acquis: number, jours_consommes: number) {
    const { error } = await sb
      .from('droits_conges')
      .upsert([{ employe_id, annee, jours_acquis, jours_consommes }], { onConflict: 'employe_id,annee' });
    if (error) throw error;
  },
};
