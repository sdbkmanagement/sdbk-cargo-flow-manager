
import { supabase } from '@/integrations/supabase/client';

export interface Chargement {
  id: string;
  numero: string;
  mission_id: string;
  vehicule_id: string;
  chauffeur_id: string;
  type_chargement: 'hydrocarbures' | 'bauxite';
  volume_poids: number;
  unite_mesure: 'litres' | 'tonnes';
  date_heure_chargement: string;
  lieu_chargement: string;
  lieu_livraison: string;
  client_nom: string;
  observations?: string;
  statut: 'charge' | 'livre' | 'annule';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ChargementsFilters {
  search?: string;
  statut?: string;
  type_chargement?: string;
  date_debut?: string;
  date_fin?: string;
  vehicule_id?: string;
  chauffeur_id?: string;
}

export const chargementsService = {
  // Récupérer tous les chargements avec filtres
  async getChargements(filters?: ChargementsFilters) {
    let query = supabase
      .from('chargements')
      .select(`
        *,
        missions(numero, site_depart, site_arrivee, statut),
        vehicules(immatriculation, marque, modele),
        chauffeurs(nom, prenom)
      `)
      .order('created_at', { ascending: false });

    if (filters?.statut && filters.statut !== 'all') {
      query = query.eq('statut', filters.statut);
    }

    if (filters?.type_chargement && filters.type_chargement !== 'all') {
      query = query.eq('type_chargement', filters.type_chargement);
    }

    if (filters?.vehicule_id) {
      query = query.eq('vehicule_id', filters.vehicule_id);
    }

    if (filters?.chauffeur_id) {
      query = query.eq('chauffeur_id', filters.chauffeur_id);
    }

    if (filters?.date_debut) {
      query = query.gte('date_heure_chargement', filters.date_debut);
    }

    if (filters?.date_fin) {
      query = query.lte('date_heure_chargement', filters.date_fin);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Récupérer un chargement par ID
  async getChargementById(id: string) {
    const { data, error } = await supabase
      .from('chargements')
      .select(`
        *,
        missions(*),
        vehicules(*),
        chauffeurs(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Créer un nouveau chargement
  async createChargement(chargement: Omit<Chargement, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('chargements')
      .insert([chargement])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour un chargement
  async updateChargement(id: string, updates: Partial<Chargement>) {
    const { data, error } = await supabase
      .from('chargements')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Changer le statut d'un chargement
  async updateStatut(id: string, statut: 'charge' | 'livre' | 'annule', utilisateur?: string) {
    const { data, error } = await supabase
      .from('chargements')
      .update({ 
        statut,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Enregistrer l'historique
    await this.createHistorique(id, 'changement_statut', {
      nouveau_statut: statut,
      utilisateur_nom: utilisateur
    });

    return data;
  },

  // Mettre à jour automatiquement le statut selon la mission
  async synchronizeWithMission(missionId: string) {
    // Récupérer le statut de la mission
    const { data: mission } = await supabase
      .from('missions')
      .select('statut')
      .eq('id', missionId)
      .single();

    if (!mission) return;

    // Déterminer le nouveau statut pour les chargements
    let nouveauStatut: 'charge' | 'livre' | 'annule' = 'charge';
    
    if (mission.statut === 'terminee') {
      nouveauStatut = 'livre';
    } else if (mission.statut === 'annulee') {
      nouveauStatut = 'annule';
    }

    // Mettre à jour tous les chargements de cette mission
    const { error } = await supabase
      .from('chargements')
      .update({ 
        statut: nouveauStatut,
        updated_at: new Date().toISOString()
      })
      .eq('mission_id', missionId);

    if (error) {
      console.error('Erreur lors de la synchronisation des chargements:', error);
      throw error;
    }

    console.log(`Chargements de la mission ${missionId} mis à jour vers statut: ${nouveauStatut}`);
  },

  // Supprimer un chargement
  async deleteChargement(id: string) {
    const { error } = await supabase
      .from('chargements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Récupérer les statistiques
  async getStatistiques() {
    const { data, error } = await supabase
      .from('chargements')
      .select('type_chargement, statut, volume_poids, unite_mesure');

    if (error) throw error;

    const stats = {
      totalChargements: data.length,
      chargementsLivres: data.filter(c => c.statut === 'livre').length,
      chargementsEnCours: data.filter(c => c.statut === 'charge').length,
      chargementsAnnules: data.filter(c => c.statut === 'annule').length,
      hydrocarbures: data.filter(c => c.type_chargement === 'hydrocarbures').length,
      bauxite: data.filter(c => c.type_chargement === 'bauxite').length,
      volumeTotal: data.reduce((sum, c) => sum + (c.volume_poids || 0), 0)
    };

    return stats;
  },

  // Créer un historique
  async createHistorique(chargement_id: string, action: string, details: any) {
    const { error } = await supabase
      .from('chargements_historique')
      .insert([{
        chargement_id,
        action,
        details: JSON.stringify(details),
        ...details
      }]);

    if (error) throw error;
  },

  // Récupérer l'historique d'un chargement
  async getHistorique(chargement_id: string) {
    const { data, error } = await supabase
      .from('chargements_historique')
      .select('*')
      .eq('chargement_id', chargement_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
