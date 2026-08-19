import { supabase } from '@/integrations/supabase/client';

export type ControleAnnuelDocument = { nom: string; url: string; type?: string };

export type ControleAnnuel = {
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
  documents: ControleAnnuelDocument[];
  created_by?: string | null;
  created_by_nom?: string | null;
  updated_by?: string | null;
  updated_by_nom?: string | null;
  created_at: string;
  updated_at: string;
};

const PAGE = 1000;
const TABLE = 'controles_annuels';

export const controlesAnnuelsService = {
  async getAll(): Promise<ControleAnnuel[]> {
    const rows: ControleAnnuel[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select('*')
        .order('date_controle', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const chunk = (data || []) as ControleAnnuel[];
      rows.push(...chunk);
      if (chunk.length < PAGE) break;
      from += PAGE;
    }
    return rows;
  },

  async create(payload: Record<string, unknown>): Promise<ControleAnnuel> {
    const { data, error } = await (supabase as any).from(TABLE).insert(payload).select().single();
    if (error) throw error;
    return data as ControleAnnuel;
  },

  async createMany(rows: Record<string, unknown>[]): Promise<number> {
    if (!rows.length) return 0;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await (supabase as any).from(TABLE).insert(rows.slice(i, i + 200));
      if (error) throw error;
    }
    return rows.length;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<ControleAnnuel> {
    const { data, error } = await (supabase as any).from(TABLE).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as ControleAnnuel;
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  /** Téléverse un justificatif de contrôle annuel dans le bucket documents */
  async uploadDocument(file: File): Promise<ControleAnnuelDocument> {
    const ext = file.name.split('.').pop();
    const chemin = `controle-annuel/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(chemin, file);
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(chemin);
    return { nom: file.name, url: data.publicUrl, type: file.type };
  },
};
