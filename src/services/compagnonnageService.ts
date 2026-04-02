import { supabase } from '@/integrations/supabase/client';

export interface FicheCompagnonnage {
  id: string;
  chauffeur_id: string;
  date_formation: string;
  date_echeance: string | null;
  formateur_nom: string | null;
  theme: string;
  statut: 'valide' | 'a_renouveler' | 'expire';
  commentaire: string | null;
  created_at: string;
  updated_at: string;
  chauffeurs?: { id: string; nom: string; prenom: string; matricule: string | null; telephone: string; statut: string | null };
}

export const compagnonnageService = {
  async getAll(): Promise<FicheCompagnonnage[]> {
    const { data, error } = await supabase
      .from('fiches_compagnonnage')
      .select(`*, chauffeurs(id, nom, prenom, matricule, telephone, statut)`)
      .order('date_formation', { ascending: false });
    if (error) throw error;
    return (data as any) || [];
  },

  async create(fiche: Omit<FicheCompagnonnage, 'id' | 'created_at' | 'updated_at' | 'chauffeurs'>): Promise<FicheCompagnonnage> {
    // Calculate statut based on date_echeance
    let statut = 'valide';
    if (fiche.date_echeance) {
      const echeance = new Date(fiche.date_echeance);
      const now = new Date();
      const in30days = new Date();
      in30days.setDate(in30days.getDate() + 30);
      if (echeance < now) statut = 'expire';
      else if (echeance <= in30days) statut = 'a_renouveler';
    }

    const { data, error } = await supabase
      .from('fiches_compagnonnage')
      .insert([{ ...fiche, statut }])
      .select(`*, chauffeurs(id, nom, prenom, matricule, telephone, statut)`)
      .single();
    if (error) throw error;
    return data as any;
  },

  async update(id: string, fiche: Partial<FicheCompagnonnage>): Promise<FicheCompagnonnage> {
    const updateData: any = { ...fiche, updated_at: new Date().toISOString() };
    delete updateData.chauffeurs;

    if (updateData.date_echeance) {
      const echeance = new Date(updateData.date_echeance);
      const now = new Date();
      const in30days = new Date();
      in30days.setDate(in30days.getDate() + 30);
      if (echeance < now) updateData.statut = 'expire';
      else if (echeance <= in30days) updateData.statut = 'a_renouveler';
      else updateData.statut = 'valide';
    }

    const { data, error } = await supabase
      .from('fiches_compagnonnage')
      .update(updateData)
      .eq('id', id)
      .select(`*, chauffeurs(id, nom, prenom, matricule, telephone, statut)`)
      .single();
    if (error) throw error;
    return data as any;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fiches_compagnonnage')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
