import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

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

      return (data || []).map(record => {
        const bl: BonLivraison = {
          id: record.id,
          numero: record.numero,
          client_nom: record.client_nom,
          client_code: record.client_code,
          client_code_total: record.client_code_total,
          destination: record.destination,
          vehicule_id: record.vehicule_id,
          chauffeur_id: record.chauffeur_id,
          date_emission: record.date_emission,
          produit: record.produit as 'essence' | 'gasoil',
          quantite_prevue: record.quantite_prevue,
          unite_mesure: 'litres' as const,
          numero_tournee: record.numero_tournee,
          date_chargement_prevue: record.date_chargement_prevue,
          date_chargement_reelle: record.date_chargement_reelle,
          date_depart: record.date_depart,
          date_arrivee_prevue: record.date_arrivee_prevue,
          date_arrivee_reelle: record.date_arrivee_reelle,
          date_dechargement: record.date_dechargement,
          quantite_livree: record.quantite_livree,
          manquant_cuve: record.manquant_cuve,
          manquant_compteur: record.manquant_compteur,
          manquant_total: record.manquant_total,
          prix_unitaire: record.prix_unitaire,
          montant_total: record.montant_total,
          montant_facture: record.montant_facture,
          associe_id: record.associe_id,
          chiffre_affaire_associe: record.chiffre_affaire_associe,
          statut: record.statut as BonLivraison['statut'],
          observations: (record as any).observations || undefined,
          facture: record.facture,
          mission_id: (record as any).mission_id || undefined,
          created_at: record.created_at,
          updated_at: record.updated_at,
          saisi_par: record.saisi_par,
          transitaire_nom: record.transitaire_nom
        };
        return bl;
      });
    } catch (error) {
      console.error('Erreur générale BL:', error);
      throw error;
    }
  },

  // Créer un nouveau BL
  async create(blData: Omit<BonLivraison, 'id' | 'created_at' | 'updated_at'>): Promise<BonLivraison> {
    try {
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

      const bl: BonLivraison = {
        id: data.id,
        numero: data.numero,
        client_nom: data.client_nom,
        client_code: data.client_code,
        client_code_total: data.client_code_total,
        destination: data.destination,
        vehicule_id: data.vehicule_id,
        chauffeur_id: data.chauffeur_id,
        date_emission: data.date_emission,
        produit: data.produit as 'essence' | 'gasoil',
        quantite_prevue: data.quantite_prevue,
        unite_mesure: 'litres' as const,
        numero_tournee: data.numero_tournee,
        date_chargement_prevue: data.date_chargement_prevue,
        date_chargement_reelle: data.date_chargement_reelle,
        date_depart: data.date_depart,
        date_arrivee_prevue: data.date_arrivee_prevue,
        date_arrivee_reelle: data.date_arrivee_reelle,
        date_dechargement: data.date_dechargement,
        quantite_livree: data.quantite_livree,
        manquant_cuve: data.manquant_cuve,
        manquant_compteur: data.manquant_compteur,
        manquant_total: data.manquant_total,
        prix_unitaire: data.prix_unitaire,
        montant_total: data.montant_total,
        montant_facture: data.montant_facture,
        associe_id: data.associe_id,
        chiffre_affaire_associe: data.chiffre_affaire_associe,
        statut: data.statut as BonLivraison['statut'],
        observations: (data as any).observations || undefined,
        facture: data.facture,
        mission_id: (data as any).mission_id || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        saisi_par: data.saisi_par,
        transitaire_nom: data.transitaire_nom
      };
      
      return bl;
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

      const bl: BonLivraison = {
        id: data.id,
        numero: data.numero,
        client_nom: data.client_nom,
        client_code: data.client_code,
        client_code_total: data.client_code_total,
        destination: data.destination,
        vehicule_id: data.vehicule_id,
        chauffeur_id: data.chauffeur_id,
        date_emission: data.date_emission,
        produit: data.produit as 'essence' | 'gasoil',
        quantite_prevue: data.quantite_prevue,
        unite_mesure: 'litres' as const,
        numero_tournee: data.numero_tournee,
        date_chargement_prevue: data.date_chargement_prevue,
        date_chargement_reelle: data.date_chargement_reelle,
        date_depart: data.date_depart,
        date_arrivee_prevue: data.date_arrivee_prevue,
        date_arrivee_reelle: data.date_arrivee_reelle,
        date_dechargement: data.date_dechargement,
        quantite_livree: data.quantite_livree,
        manquant_cuve: data.manquant_cuve,
        manquant_compteur: data.manquant_compteur,
        manquant_total: data.manquant_total,
        prix_unitaire: data.prix_unitaire,
        montant_total: data.montant_total,
        montant_facture: data.montant_facture,
        associe_id: data.associe_id,
        chiffre_affaire_associe: data.chiffre_affaire_associe,
        statut: data.statut as BonLivraison['statut'],
        observations: (data as any).observations || undefined,
        facture: data.facture,
        mission_id: (data as any).mission_id || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        saisi_par: data.saisi_par,
        transitaire_nom: data.transitaire_nom
      };
      
      return bl;
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
