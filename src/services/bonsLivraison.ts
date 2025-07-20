
import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

export const bonsLivraisonService = {
  // Récupérer tous les bons de livraison
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des BL:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale BL:', error);
      throw error;
    }
  },

  // Récupérer les BL par mission_id
  async getByMissionId(missionId: string) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des BL par mission:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale BL par mission:', error);
      throw error;
    }
  },

  // Créer un bon de livraison
  async create(blData: Omit<BonLivraison, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .insert([blData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création BL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du BL:', error);
      throw error;
    }
  },

  // Mettre à jour un bon de livraison
  async update(id: string, blData: Partial<BonLivraison>) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .update({ ...blData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour BL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du BL:', error);
      throw error;
    }
  },

  // Supprimer un bon de livraison
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('bons_livraison')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression BL:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du BL:', error);
      throw error;
    }
  }
};
