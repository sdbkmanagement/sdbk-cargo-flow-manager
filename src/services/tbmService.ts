import { supabase } from '@/integrations/supabase/client';

export interface TbmSession {
  id: string;
  mois: number;
  annee: number;
  numero_reunion: number;
  theme: string | null;
  date_reunion: string | null;
  created_at: string;
  updated_at: string;
}

export interface TbmPresence {
  id: string;
  session_id: string;
  chauffeur_id: string | null;
  employe_id: string | null;
  present: boolean;
  date_presence: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collaborateur {
  id: string;
  nom: string;
  prenom: string;
  type: 'employe' | 'chauffeur';
  statut: string | null;
  poste?: string;
  vehicule_assigne?: string | null;
}

const MOIS_NOMS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const tbmService = {
  getMoisNom(mois: number) { return MOIS_NOMS[mois] || ''; },

  async getSessions(mois: number, annee: number): Promise<TbmSession[]> {
    const { data, error } = await supabase
      .from('tbm_sessions' as any)
      .select('*')
      .eq('mois', mois)
      .eq('annee', annee)
      .order('numero_reunion');
    if (error) throw error;
    return (data || []) as any;
  },

  async upsertSession(session: { mois: number; annee: number; numero_reunion: number; theme?: string; date_reunion?: string }): Promise<TbmSession> {
    // Check if exists
    const { data: existing } = await supabase
      .from('tbm_sessions' as any)
      .select('id')
      .eq('mois', session.mois)
      .eq('annee', session.annee)
      .eq('numero_reunion', session.numero_reunion)
      .maybeSingle();

    if ((existing as any)?.id) {
      const { data, error } = await supabase
        .from('tbm_sessions' as any)
        .update({ theme: session.theme, date_reunion: session.date_reunion })
        .eq('id', (existing as any).id)
        .select()
        .single();
      if (error) throw error;
      return data as any;
    } else {
      const { data, error } = await supabase
        .from('tbm_sessions' as any)
        .insert([session])
        .select()
        .single();
      if (error) throw error;
      return data as any;
    }
  },

  async initSessions(mois: number, annee: number): Promise<TbmSession[]> {
    const sessions: TbmSession[] = [];
    for (let r = 1; r <= 4; r++) {
      const s = await this.upsertSession({ mois, annee, numero_reunion: r });
      sessions.push(s);
    }
    return sessions;
  },

  async getPresences(sessionId: string): Promise<TbmPresence[]> {
    const { data, error } = await supabase
      .from('tbm_presences' as any)
      .select('*')
      .eq('session_id', sessionId);
    if (error) throw error;
    return (data || []) as any;
  },

  async getAllPresences(sessionIds: string[]): Promise<TbmPresence[]> {
    if (sessionIds.length === 0) return [];
    const { data, error } = await supabase
      .from('tbm_presences' as any)
      .select('*')
      .in('session_id', sessionIds);
    if (error) throw error;
    return (data || []) as any;
  },

  async togglePresence(sessionId: string, collaborateur: Collaborateur, present: boolean, datePresence?: string): Promise<void> {
    const isChauf = collaborateur.type === 'chauffeur';
    const filter: any = { session_id: sessionId };
    if (isChauf) filter.chauffeur_id = collaborateur.id;
    else filter.employe_id = collaborateur.id;

    // Check existing
    let query = supabase.from('tbm_presences' as any).select('id').eq('session_id', sessionId);
    if (isChauf) query = query.eq('chauffeur_id', collaborateur.id);
    else query = query.eq('employe_id', collaborateur.id);
    
    const { data: existing } = await query.maybeSingle();

    if ((existing as any)?.id) {
      await supabase
        .from('tbm_presences' as any)
        .update({ present, date_presence: datePresence || null })
        .eq('id', (existing as any).id);
    } else if (present) {
      const insert: any = {
        session_id: sessionId,
        present,
        date_presence: datePresence || null,
      };
      if (isChauf) insert.chauffeur_id = collaborateur.id;
      else insert.employe_id = collaborateur.id;
      await supabase.from('tbm_presences' as any).insert([insert]);
    }
  },

  async getAllCollaborateurs(): Promise<Collaborateur[]> {
    const [{ data: employes }, { data: chauffeurs }] = await Promise.all([
      supabase.from('employes').select('id, nom, prenom, statut, poste').eq('statut', 'actif').order('nom'),
      supabase.from('chauffeurs').select('id, nom, prenom, statut, vehicule_assigne').order('nom'),
    ]);

    const result: Collaborateur[] = [];
    (employes || []).forEach((e: any) => result.push({ id: e.id, nom: e.nom, prenom: e.prenom, type: 'employe', statut: e.statut, poste: e.poste }));
    (chauffeurs || []).forEach((c: any) => result.push({ id: c.id, nom: c.nom, prenom: c.prenom, type: 'chauffeur', statut: c.statut, vehicule_assigne: c.vehicule_assigne }));
    return result;
  },

  getStats(collaborateurs: Collaborateur[], presences: TbmPresence[], sessionIds: string[]) {
    const totalPersonnes = collaborateurs.length;
    const reunionsRealisees = sessionIds.filter(sid => presences.some(p => p.session_id === sid && p.present)).length;
    const totalPresences = presences.filter(p => p.present).length;
    const maxPresences = totalPersonnes * sessionIds.length;
    const tauxParticipation = maxPresences > 0 ? Math.round((totalPresences / maxPresences) * 100) : 0;

    return {
      totalPersonnes,
      reunionsPlanifiees: 4,
      reunionsRealisees,
      totalPresences,
      tauxParticipation,
    };
  }
};
