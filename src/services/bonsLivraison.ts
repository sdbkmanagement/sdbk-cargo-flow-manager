
import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

// Helper function to convert database record to BonLivraison
const convertFromDatabase = (dbRecord: any): BonLivraison => ({
  ...dbRecord,
  produit: dbRecord.produit as 'essence' | 'gasoil',
  statut: dbRecord.statut as 'emis' | 'charge' | 'en_route' | 'livre' | 'termine',
  unite_mesure: 'litres'
});

// Helper function to convert BonLivraison to database format
const convertToDatabase = (bl: Partial<BonLivraison>) => ({
  ...bl,
  produit: bl.produit as string,
  statut: bl.statut as string
});

export const bonsLivraisonService = {
  // Récupérer tous les BL d'une mission
  async getByMissionId(missionId: string): Promise<BonLivraison[]> {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des BL:', error);
        throw error;
      }

      return (data || []).map(convertFromDatabase);
    } catch (error) {
      console.error('Erreur générale BL:', error);
      throw error;
    }
  },

  // Créer un nouveau BL
  async create(blData: Omit<BonLivraison, 'id' | 'created_at' | 'updated_at'>): Promise<BonLivraison> {
    try {
      const dbData = convertToDatabase(blData);
      const { data, error } = await supabase
        .from('bons_livraison')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Erreur création BL:', error);
        throw error;
      }

      return convertFromDatabase(data);
    } catch (error) {
      console.error('Erreur lors de la création du BL:', error);
      throw error;
    }
  },

  // Mettre à jour un BL
  async update(id: string, blData: Partial<BonLivraison>): Promise<BonLivraison> {
    try {
      const dbData = convertToDatabase({ ...blData, updated_at: new Date().toISOString() });
      const { data, error } = await supabase
        .from('bons_livraison')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour BL:', error);
        throw error;
      }

      return convertFromDatabase(data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du BL:', error);
      throw error;
    }
  },

  // Supprimer un BL
  async delete(id: string): Promise<void> {
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
  },

  // Mettre à jour le statut d'un BL
  async updateStatut(id: string, statut: BonLivraison['statut']): Promise<void> {
    try {
      const { error } = await supabase
        .from('bons_livraison')
        .update({ statut: statut as string, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Erreur mise à jour statut BL:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du BL:', error);
      throw error;
    }
  },

  // Récupérer les statistiques des BL
  async getStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('statut, produit, quantite_prevue, quantite_livree, manquant_total');

      if (error) {
        console.error('Erreur stats BL:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        emis: data?.filter(bl => bl.statut === 'emis').length || 0,
        charge: data?.filter(bl => bl.statut === 'charge').length || 0,
        en_route: data?.filter(bl => bl.statut === 'en_route').length || 0,
        livre: data?.filter(bl => bl.statut === 'livre').length || 0,
        termine: data?.filter(bl => bl.statut === 'termine').length || 0,
        essence_total: data?.filter(bl => bl.produit === 'essence').reduce((sum, bl) => sum + (bl.quantite_prevue || 0), 0) || 0,
        gasoil_total: data?.filter(bl => bl.produit === 'gasoil').reduce((sum, bl) => sum + (bl.quantite_prevue || 0), 0) || 0,
        manquant_total: data?.reduce((sum, bl) => sum + (bl.manquant_total || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur générale stats BL:', error);
      throw error;
    }
  }
};
