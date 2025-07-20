
import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

// Simplified conversion functions
const convertFromDatabase = (dbRecord: any): BonLivraison => {
  return {
    ...dbRecord,
    produit: dbRecord.produit as 'essence' | 'gasoil',
    statut: dbRecord.statut as 'emis' | 'charge' | 'en_route' | 'livre' | 'termine',
    unite_mesure: dbRecord.unite_mesure || 'litres'
  };
};

const convertToDatabase = (bl: any) => {
  // Remove conversion functions and let Supabase handle the types
  const { ...dbRecord } = bl;
  return dbRecord;
};

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
      // Directly pass the data without complex conversion
      const { data, error } = await supabase
        .from('bons_livraison')
        .insert({
          numero: blData.numero,
          client_nom: blData.client_nom,
          client_code: blData.client_code,
          client_code_total: blData.client_code_total,
          destination: blData.destination,
          vehicule_id: blData.vehicule_id,
          chauffeur_id: blData.chauffeur_id,
          date_emission: blData.date_emission,
          produit: blData.produit,
          quantite_prevue: blData.quantite_prevue,
          unite_mesure: blData.unite_mesure || 'litres',
          statut: blData.statut || 'emis',
          mission_id: blData.mission_id,
          numero_tournee: blData.numero_tournee,
          date_chargement_prevue: blData.date_chargement_prevue,
          date_chargement_reelle: blData.date_chargement_reelle,
          date_depart: blData.date_depart,
          date_arrivee_prevue: blData.date_arrivee_prevue,
          date_arrivee_reelle: blData.date_arrivee_reelle,
          date_dechargement: blData.date_dechargement,
          quantite_livree: blData.quantite_livree,
          manquant_cuve: blData.manquant_cuve || 0,
          manquant_compteur: blData.manquant_compteur || 0,
          manquant_total: blData.manquant_total || 0,
          prix_unitaire: blData.prix_unitaire,
          montant_total: blData.montant_total,
          montant_facture: blData.montant_facture,
          associe_id: blData.associe_id,
          chiffre_affaire_associe: blData.chiffre_affaire_associe,
          observations: blData.observations,
          facture: blData.facture || false,
          saisi_par: blData.saisi_par,
          transitaire_nom: blData.transitaire_nom
        })
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
      const { data, error } = await supabase
        .from('bons_livraison')
        .update({
          ...blData,
          updated_at: new Date().toISOString()
        })
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
