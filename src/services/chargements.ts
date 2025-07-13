
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
  // Récupérer tous les chargements avec timeout
  async getChargements(filters?: ChargementsFilters) {
    try {
      console.log('Chargement des chargements...')
      
      let query = supabase
        .from('chargements')
        .select('*')
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

      const { data, error } = await Promise.race([
        query,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any;

      if (error) {
        console.error('Erreur chargements:', error)
        return []
      }

      console.log('Chargements chargés:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale chargements:', error)
      return []
    }
  },

  // Récupérer un chargement par ID
  async getChargementById(id: string) {
    try {
      const { data, error } = await supabase
        .from('chargements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur récupération chargement:', error)
        return null
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du chargement:', error)
      return null
    }
  },

  // Créer un nouveau chargement
  async createChargement(chargement: Omit<Chargement, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('chargements')
        .insert([chargement])
        .select()
        .single();

      if (error) {
        console.error('Erreur création chargement:', error)
        throw error
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du chargement:', error)
      throw error
    }
  },

  // Mettre à jour le statut d'un chargement
  async updateStatut(id: string, statut: 'charge' | 'livre' | 'annule') {
    try {
      const { data, error } = await supabase
        .from('chargements')
        .update({ 
          statut, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour statut chargement:', error)
        throw error
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      throw error
    }
  },

  // Récupérer les statistiques
  async getStatistiques() {
    try {
      const { data, error } = await Promise.race([
        supabase.from('chargements').select('type_chargement, statut, volume_poids, unite_mesure'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;

      if (error) {
        console.error('Erreur stats chargements:', error)
        return {
          totalChargements: 0,
          chargementsLivres: 0,
          chargementsEnCours: 0,
          chargementsAnnules: 0,
          hydrocarbures: 0,
          bauxite: 0,
          volumeTotal: 0
        }
      }

      const stats = {
        totalChargements: data?.length || 0,
        chargementsLivres: data?.filter(c => c.statut === 'livre').length || 0,
        chargementsEnCours: data?.filter(c => c.statut === 'charge').length || 0,
        chargementsAnnules: data?.filter(c => c.statut === 'annule').length || 0,
        hydrocarbures: data?.filter(c => c.type_chargement === 'hydrocarbures').length || 0,
        bauxite: data?.filter(c => c.type_chargement === 'bauxite').length || 0,
        volumeTotal: data?.reduce((sum, c) => sum + (c.volume_poids || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur générale stats chargements:', error)
      return {
        totalChargements: 0,
        chargementsLivres: 0,
        chargementsEnCours: 0,
        chargementsAnnules: 0,
        hydrocarbures: 0,
        bauxite: 0,
        volumeTotal: 0
      }
    }
  }
};
