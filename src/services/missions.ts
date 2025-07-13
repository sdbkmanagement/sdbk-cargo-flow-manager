
import { supabase } from '@/integrations/supabase/client';

export interface Mission {
  id: string;
  numero: string;
  vehicule_id: string;
  chauffeur_id: string;
  type_transport: string;
  site_depart: string;
  site_arrivee: string;
  date_heure_depart: string;
  date_heure_arrivee_prevue: string;
  volume_poids?: number;
  unite_mesure?: string;
  observations?: string;
  statut: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const missionsService = {
  // Récupérer toutes les missions
  async getAll() {
    try {
      console.log('Chargement des missions...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('missions')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any;

      if (error) {
        console.error('Erreur missions:', error)
        return []
      }

      console.log('Missions chargées:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale missions:', error)
      return []
    }
  },

  // Créer une nouvelle mission
  async create(missionData: Omit<Mission, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .insert([missionData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création mission:', error)
        throw error
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }
  },

  // Mettre à jour une mission
  async update(id: string, missionData: Partial<Mission>) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .update({ ...missionData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour mission:', error)
        throw error
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error)
      throw error
    }
  },

  // Supprimer une mission
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression mission:', error)
        throw error
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission:', error)
      throw error
    }
  },

  // Récupérer les statistiques des missions
  async getStats() {
    try {
      const { data: missions, error } = await Promise.race([
        supabase.from('missions').select('statut, type_transport, volume_poids, created_at'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;

      if (error) {
        console.error('Erreur stats missions:', error)
        return {
          total: 0,
          en_attente: 0,
          en_cours: 0,
          terminees: 0,
          annulees: 0,
          ce_mois: 0,
          hydrocarbures: 0,
          bauxite: 0,
          volume_total: 0
        }
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const stats = {
        total: missions?.length || 0,
        en_attente: missions?.filter(m => m.statut === 'en_attente').length || 0,
        en_cours: missions?.filter(m => m.statut === 'en_cours').length || 0,
        terminees: missions?.filter(m => m.statut === 'terminee').length || 0,
        annulees: missions?.filter(m => m.statut === 'annulee').length || 0,
        ce_mois: missions?.filter(m => {
          const createdDate = new Date(m.created_at);
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length || 0,
        hydrocarbures: missions?.filter(m => m.type_transport === 'hydrocarbures').length || 0,
        bauxite: missions?.filter(m => m.type_transport === 'bauxite').length || 0,
        volume_total: missions?.reduce((sum, m) => sum + (m.volume_poids || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur générale stats missions:', error)
      return {
        total: 0,
        en_attente: 0,
        en_cours: 0,
        terminees: 0,
        annulees: 0,
        ce_mois: 0,
        hydrocarbures: 0,
        bauxite: 0,
        volume_total: 0
      }
    }
  },

  // Récupérer les véhicules disponibles
  async getAvailableVehicules() {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('statut', 'disponible')
        .order('numero', { ascending: true });

      if (error) {
        console.error('Erreur véhicules disponibles:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur récupération véhicules disponibles:', error)
      return []
    }
  },

  // Récupérer les chauffeurs actifs
  async getActiveChauffeurs() {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('statut', 'actif')
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur chauffeurs actifs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur récupération chauffeurs actifs:', error)
      return []
    }
  },

  // Vérifier la disponibilité des ressources
  async checkResourceAvailability(vehiculeId: string, chauffeurId: string, dateDebut: string, dateFin: string) {
    try {
      // Vérifier les conflits de planning
      const { data: conflits, error } = await supabase
        .from('missions')
        .select('*')
        .or(`vehicule_id.eq.${vehiculeId},chauffeur_id.eq.${chauffeurId}`)
        .in('statut', ['en_attente', 'en_cours']);

      if (error) {
        console.error('Erreur vérification disponibilité:', error)
        return {
          vehicule_disponible: true,
          chauffeur_disponible: true,
          message: 'Vérification impossible'
        }
      }

      const hasConflict = conflits?.some(mission => {
        const missionStart = new Date(mission.date_heure_depart);
        const missionEnd = new Date(mission.date_heure_arrivee_prevue);
        const requestStart = new Date(dateDebut);
        const requestEnd = new Date(dateFin);
        
        return (requestStart < missionEnd && requestEnd > missionStart);
      });

      return {
        vehicule_disponible: !conflits?.some(c => c.vehicule_id === vehiculeId && hasConflict),
        chauffeur_disponible: !conflits?.some(c => c.chauffeur_id === chauffeurId && hasConflict),
        message: hasConflict ? 'Conflit de planning détecté' : 'Ressources disponibles'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error)
      return {
        vehicule_disponible: true,
        chauffeur_disponible: true,
        message: 'Erreur de vérification'
      }
    }
  }
};
