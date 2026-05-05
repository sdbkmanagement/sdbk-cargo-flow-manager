import { supabase } from '@/integrations/supabase/client';

export type ObcViolationType =
  | 'survitesse'
  | 'freinage_excessif'
  | 'acceleration_excessive'
  | 'conduite_nuit'
  | 'conduite_journaliere'
  | 'conduite_continue'
  | 'conduite_hebdomadaire'
  | 'anomalie_obc';

export const OBC_VIOLATION_LABELS: Record<ObcViolationType, string> = {
  survitesse: 'Survitesse',
  freinage_excessif: 'Freinage excessif',
  acceleration_excessive: 'Accélération excessive',
  conduite_nuit: 'Conduite de nuit',
  conduite_journaliere: 'Conduite journalière (>10h)',
  conduite_continue: 'Conduite continue (>2h30)',
  conduite_hebdomadaire: 'Conduite hebdomadaire (>56h)',
  anomalie_obc: 'Anomalie OBC',
};

export interface ObcViolation {
  id: string;
  chauffeur_id: string;
  date_violation: string;
  type_violation: ObcViolationType;
  commentaire?: string | null;
  preuve_url?: string | null;
  mesures_prises?: string | null;
  points_retires: number;
  auto_generee: boolean;
  created_at: string;
}

export interface ObcTempsConduite {
  id: string;
  chauffeur_id: string;
  date_jour: string;
  distance_km: number;
  temps_conduite_h: number;
  temps_continu_max_h: number;
  commentaire?: string | null;
}

export interface ObcAlerte {
  id: string;
  chauffeur_id: string | null;
  type_alerte: string;
  niveau: 'info' | 'warning' | 'critique';
  message: string;
  lu: boolean;
  created_at: string;
}

export interface ObcChauffeurPoints {
  chauffeur_id: string;
  points_actuels: number;
  updated_at: string;
}

export const obcService = {
  // VIOLATIONS
  async listViolations(filters: { chauffeurId?: string; type?: ObcViolationType; dateDebut?: string; dateFin?: string } = {}) {
    let q = (supabase as any).from('obc_violations').select('*').order('date_violation', { ascending: false });
    if (filters.chauffeurId) q = q.eq('chauffeur_id', filters.chauffeurId);
    if (filters.type) q = q.eq('type_violation', filters.type);
    if (filters.dateDebut) q = q.gte('date_violation', filters.dateDebut);
    if (filters.dateFin) q = q.lte('date_violation', filters.dateFin);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ObcViolation[];
  },

  async createViolation(payload: Omit<ObcViolation, 'id' | 'created_at' | 'auto_generee'> & { created_by?: string }) {
    const { data, error } = await (supabase as any).from('obc_violations').insert(payload).select().single();
    if (error) throw error;
    return data as ObcViolation;
  },

  async deleteViolation(id: string) {
    const { error } = await (supabase as any).from('obc_violations').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadPreuve(file: File, chauffeurId: string) {
    const ext = file.name.split('.').pop();
    const path = `${chauffeurId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('obc-preuves').upload(path, file);
    if (error) throw error;
    const { data } = await supabase.storage.from('obc-preuves').createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl || path;
  },

  // POINTS
  async listPoints() {
    const { data, error } = await (supabase as any).from('obc_chauffeur_points').select('*');
    if (error) throw error;
    return (data || []) as ObcChauffeurPoints[];
  },

  async historiquePoints(chauffeurId: string) {
    const { data, error } = await (supabase as any)
      .from('obc_points_historique')
      .select('*')
      .eq('chauffeur_id', chauffeurId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // TEMPS DE CONDUITE
  async listTemps(filters: { chauffeurId?: string; dateDebut?: string; dateFin?: string } = {}) {
    let q = (supabase as any).from('obc_temps_conduite').select('*').order('date_jour', { ascending: false });
    if (filters.chauffeurId) q = q.eq('chauffeur_id', filters.chauffeurId);
    if (filters.dateDebut) q = q.gte('date_jour', filters.dateDebut);
    if (filters.dateFin) q = q.lte('date_jour', filters.dateFin);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ObcTempsConduite[];
  },

  async insertTemps(payload: Omit<ObcTempsConduite, 'id'>) {
    const { data, error } = await (supabase as any)
      .from('obc_temps_conduite')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as ObcTempsConduite;
  },
  // Conserver pour compat
  async upsertTemps(payload: Omit<ObcTempsConduite, 'id'>) {
    return this.insertTemps(payload);
  },

  async deleteTemps(id: string) {
    const { error } = await (supabase as any).from('obc_temps_conduite').delete().eq('id', id);
    if (error) throw error;
  },

  // ALERTES
  async listAlertes(unreadOnly = false) {
    let q = (supabase as any).from('obc_alertes').select('*').order('created_at', { ascending: false }).limit(200);
    if (unreadOnly) q = q.eq('lu', false);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ObcAlerte[];
  },

  async marquerLu(id: string) {
    const { error } = await (supabase as any).from('obc_alertes').update({ lu: true }).eq('id', id);
    if (error) throw error;
  },

  // CONFIG
  async getConfig() {
    const { data, error } = await (supabase as any).from('obc_config').select('*');
    if (error) throw error;
    return data || [];
  },

  async updateConfig(cle: string, valeur: number) {
    const { error } = await (supabase as any).from('obc_config').update({ valeur, updated_at: new Date().toISOString() }).eq('cle', cle);
    if (error) throw error;
  },
};
