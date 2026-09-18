import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface FicheEvaluation {
  id: string;
  chauffeur_id: string;
  type_fiche: 'theorique' | 'pratique';
  date_fiche: string;
  note_obtenue: number | null;
  formateur_nom: string | null;
  commentaire: string | null;
  fichier_nom: string | null;
  fichier_url: string | null;
  created_at: string;
}

export const fichesEvaluationService = {
  async getAll(): Promise<FicheEvaluation[]> {
    const { data, error } = await sb
      .from('fiches_evaluation')
      .select('*')
      .order('date_fiche', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByChauffeur(chauffeurId: string): Promise<FicheEvaluation[]> {
    const { data, error } = await sb
      .from('fiches_evaluation')
      .select('*')
      .eq('chauffeur_id', chauffeurId)
      .order('date_fiche', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async uploadFichier(file: File) {
    const ext = file.name.split('.').pop();
    const path = `formations/fiches-evaluation/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return { url: data.publicUrl, nom: file.name };
  },

  async create(fiche: Partial<FicheEvaluation>) {
    const { error } = await sb.from('fiches_evaluation').insert([fiche]);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await sb.from('fiches_evaluation').delete().eq('id', id);
    if (error) throw error;
  },
};
