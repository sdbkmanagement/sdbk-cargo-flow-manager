import { supabase } from '@/integrations/supabase/client';

export type TypeControle = 'socotac' | 'annuel';

export type ControleHistorique = {
  id: string;
  type_controle: TypeControle | string;
  controle_id: string;
  date_controle: string | null;
  date_prochain_controle: string | null;
  resultat: string | null;
  motif_rejet: string | null;
  observations: string | null;
  documents: { nom: string; url: string; type?: string }[] | null;
  enregistre_par: string | null;
  created_at: string;
};

export const controlesHistoriqueService = {
  /** Versions précédentes d'un contrôle (la plus récente en premier) */
  async getByControle(type: TypeControle, controleId: string): Promise<ControleHistorique[]> {
    const { data, error } = await (supabase as any)
      .from('controles_historique')
      .select('*')
      .eq('type_controle', type)
      .eq('controle_id', controleId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ControleHistorique[];
  },
};
