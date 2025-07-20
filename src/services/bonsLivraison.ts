
import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

// Simple conversion functions without complex typing
const convertFromDatabase = (dbRecord: any): BonLivraison => {
  return {
    id: dbRecord.id,
    numero: dbRecord.numero,
    client_nom: dbRecord.client_nom,
    client_code: dbRecord.client_code,
    client_code_total: dbRecord.client_code_total,
    destination: dbRecord.destination,
    vehicule_id: dbRecord.vehicule_id,
    chauffeur_id: dbRecord.chauffeur_id,
    date_emission: dbRecord.date_emission,
    produit: dbRecord.produit,
    quantite_prevue: dbRecord.quantite_prevue,
    unite_mesure: dbRecord.unite_mesure || 'litres',
    numero_tournee: dbRecord.numero_tournee,
    date_chargement_prevue: dbRecord.date_chargement_prevue,
    date_chargement_reelle: dbRecord.date_chargement_reelle,
    date_depart: dbRecord.date_depart,
    date_arrivee_prevue: dbRecord.date_arrivee_prevue,
    date_arrivee_reelle: dbRecord.date_arrivee_reelle,
    date_dechargement: dbRecord.date_dechargement,
    quantite_livree: dbRecord.quantite_livree,
    manquant_cuve: dbRecord.manquant_cuve,
    manquant_compteur: dbRecord.manquant_compteur,
    manquant_total: dbRecord.manquant_total,
    prix_unitaire: dbRecord.prix_unitaire,
    montant_total: dbRecord.montant_total,
    montant_facture: dbRecord.montant_facture,
    associe_id: dbRecord.associe_id,
    chiffre_affaire_associe: dbRecord.chiffre_affaire_associe,
    statut: dbRecord.statut,
    observations: dbRecord.observations,
    facture: dbRecord.facture,
    mission_id: dbRecord.mission_id,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    saisi_par: dbRecord.saisi_par,
    transitaire_nom: dbRecord.transitaire_nom
  };
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
      // Create the insert object with explicit typing
      const insertData = {
        numero: blData.numero,
        client_nom: blData.client_nom,
        client_code: blData.client_code || null,
        client_code_total: blData.client_code_total || null,
        destination: blData.destination,
        vehicule_id: blData.vehicule_id,
        chauffeur_id: blData.chauffeur_id,
        date_emission: blData.date_emission,
        produit: blData.produit,
        quantite_prevue: blData.quantite_prevue,
        unite_mesure: blData.unite_mesure || 'litres',
        statut: blData.statut || 'emis',
        mission_id: blData.mission_id || null,
        numero_tournee: blData.numero_tournee || null,
        date_chargement_prevue: blData.date_chargement_prevue || null,
        date_chargement_reelle: blData.date_chargement_reelle || null,
        date_depart: blData.date_depart || null,
        date_arrivee_prevue: blData.date_arrivee_prevue || null,
        date_arrivee_reelle: blData.date_arrivee_reelle || null,
        date_dechargement: blData.date_dechargement || null,
        quantite_livree: blData.quantite_livree || null,
        manquant_cuve: blData.manquant_cuve || 0,
        manquant_compteur: blData.manquant_compteur || 0,
        manquant_total: blData.manquant_total || 0,
        prix_unitaire: blData.prix_unitaire || null,
        montant_total: blData.montant_total || null,
        montant_facture: blData.montant_facture || null,
        associe_id: blData.associe_id || null,
        chiffre_affaire_associe: blData.chiffre_affaire_associe || null,
        observations: blData.observations || null,
        facture: blData.facture || false,
        saisi_par: blData.saisi_par || null,
        transitaire_nom: blData.transitaire_nom || null
      };

      const { data, error } = await supabase
        .from('bons_livraison')
        .insert(insertData)
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
        .update({ statut: statut, updated_at: new Date().toISOString() })
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
