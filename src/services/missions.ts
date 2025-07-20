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

  // Supprimer une mission et tous ses enregistrements liés
  async delete(id: string) {
    try {
      console.log('Début de la suppression de la mission:', id);
      
      // 1. Supprimer les chargements liés à cette mission
      const { error: chargementsError } = await supabase
        .from('chargements')
        .delete()
        .eq('mission_id', id);

      if (chargementsError) {
        console.error('Erreur suppression chargements:', chargementsError);
        throw new Error('Impossible de supprimer les chargements liés à cette mission');
      }
      
      console.log('Chargements supprimés avec succès');

      // 2. Supprimer les bons de livraison liés à cette mission
      const { error: blError } = await supabase
        .from('bons_livraison')
        .delete()
        .eq('mission_id', id);

      if (blError) {
        console.error('Erreur suppression bons de livraison:', blError);
        throw new Error('Impossible de supprimer les bons de livraison liés à cette mission');
      }
      
      console.log('Bons de livraison supprimés avec succès');

      // 3. Maintenant supprimer la mission elle-même
      const { error: missionError } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);

      if (missionError) {
        console.error('Erreur suppression mission:', missionError);
        throw new Error('Impossible de supprimer la mission');
      }
      
      console.log('Mission supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission:', error);
      throw error;
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

  // Récupérer les chauffeurs assignés à un véhicule
  async getChauffeursAssignesVehicule(vehiculeId: string) {
    try {
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select(`
          chauffeur:chauffeurs(
            id,
            nom,
            prenom,
            telephone,
            statut
          )
        `)
        .eq('vehicule_id', vehiculeId)
        .eq('statut', 'active');

      if (error) {
        console.error('Erreur lors du chargement des chauffeurs assignés:', error);
        return [];
      }

      return data?.map(item => item.chauffeur).filter(Boolean) || [];
    } catch (error) {
      console.error('Erreur générale chauffeurs assignés:', error);
      return [];
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
