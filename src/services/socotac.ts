import { supabase } from '@/integrations/supabase/client';

export type SocotacDocument = { nom: string; url: string; type?: string };

export type SocotacControle = {
  id: string;
  equipement_id?: string | null;
  equipement_remorque_id?: string | null;
  immatriculation_tracteur?: string | null;
  immatriculation_remorque?: string | null;
  conducteur_nom?: string | null;
  conducteur_contact?: string | null;
  date_controle: string;
  date_prochain_controle?: string | null;
  resultat: 'accepte' | 'rejete' | string;
  motif_rejet?: string | null;
  observations?: string | null;
  action_corrective?: string | null;
  responsable_action?: string | null;
  date_correction_prevue?: string | null;
  date_correction?: string | null;
  date_contre_visite?: string | null;
  resultat_contre_visite?: string | null;
  documents: SocotacDocument[];
  created_by?: string | null;
  created_by_nom?: string | null;
  updated_by?: string | null;
  updated_by_nom?: string | null;
  created_at: string;
  updated_at: string;
};

export type SocotacAudit = {
  id: string;
  controle_id: string | null;
  action: string;
  champ?: string | null;
  ancienne_valeur?: string | null;
  nouvelle_valeur?: string | null;
  utilisateur_nom?: string | null;
  created_at: string;
};

const PAGE = 1000;

export const socotacService = {
  async getAll(): Promise<SocotacControle[]> {
    const rows: SocotacControle[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await (supabase as any)
        .from('socotac_controles')
        .select('*')
        .order('date_controle', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const chunk = (data || []) as SocotacControle[];
      rows.push(...chunk);
      if (chunk.length < PAGE) break;
      from += PAGE;
    }
    return rows;
  },

  async create(payload: Record<string, unknown>): Promise<SocotacControle> {
    const { data, error } = await (supabase as any)
      .from('socotac_controles')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as SocotacControle;
  },

  async createMany(rows: Record<string, unknown>[]): Promise<number> {
    if (!rows.length) return 0;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await (supabase as any).from('socotac_controles').insert(rows.slice(i, i + 200));
      if (error) throw error;
    }
    return rows.length;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<SocotacControle> {
    const { data, error } = await (supabase as any)
      .from('socotac_controles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SocotacControle;
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase as any).from('socotac_controles').delete().eq('id', id);
    if (error) throw error;
  },

  async getAudit(controleId: string): Promise<SocotacAudit[]> {
    const { data, error } = await (supabase as any)
      .from('socotac_audit')
      .select('*')
      .eq('controle_id', controleId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SocotacAudit[];
  },

  /** Téléverse un justificatif SOCOTAC dans le bucket documents */
  async uploadDocument(file: File): Promise<SocotacDocument> {
    const ext = file.name.split('.').pop();
    const chemin = `socotac/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(chemin, file);
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(chemin);
    return { nom: file.name, url: data.publicUrl, type: file.type };
  },
};
