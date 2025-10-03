
import { supabase } from '@/integrations/supabase/client';

export interface Mission {
  id: string;
  numero: string;
  vehicule_id: string;
  chauffeur_id: string;
  type_transport: string;
  site_depart: string;
  site_arrivee: string;
  volume_poids?: number;
  unite_mesure?: string;
  observations?: string;
  statut: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  created_at: string;
  updated_at: string;
  created_by?: string;
  vehicule?: any;
  chauffeur?: any;
}

export const missionsService = {
  // Récupérer toutes les missions avec les relations
  async getAll() {
    try {
      console.log('Chargement des missions...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('missions')
          .select(`
            *,
            vehicule:vehicules(numero, marque, modele, immatriculation, remorque_immatriculation, tracteur_immatriculation),
            chauffeur:chauffeurs(nom, prenom, telephone),
            bons_livraison:bons_livraison(numero_tournee)
          `)
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

  // Vérifier si un véhicule est disponible pour une mission
  async checkVehiculeAvailability(vehiculeId: string, missionId?: string) {
    try {
      console.log('🔍 Vérification disponibilité véhicule:', vehiculeId);
      
      // Vérifier le statut du véhicule
      const { data: vehicule, error: vehiculeError } = await supabase
        .from('vehicules')
        .select('statut, validation_requise')
        .eq('id', vehiculeId)
        .single();

      if (vehiculeError) {
        console.error('Erreur lors de la vérification du véhicule:', vehiculeError);
        return {
          available: false,
          message: 'Véhicule introuvable'
        };
      }

      // Le véhicule doit être disponible et ne pas nécessiter de validation
      if (vehicule.statut !== 'disponible') {
        return {
          available: false,
          message: `Véhicule non disponible. Statut actuel: ${vehicule.statut}`
        };
      }

      if (vehicule.validation_requise) {
        return {
          available: false,
          message: 'Véhicule nécessite une validation avant assignation'
        };
      }

      // Vérifier s'il y a des missions en cours pour ce véhicule
      let query = supabase
        .from('missions')
        .select('id, numero, statut')
        .eq('vehicule_id', vehiculeId)
        .in('statut', ['en_attente', 'en_cours']);

      // Exclure la mission actuelle si on est en train de la modifier
      if (missionId) {
        query = query.neq('id', missionId);
      }

      const { data: missionsEnCours, error: missionsError } = await query;

      if (missionsError) {
        console.error('Erreur lors de la vérification des missions:', missionsError);
        return {
          available: false,
          message: 'Erreur lors de la vérification des missions en cours'
        };
      }

      if (missionsEnCours && missionsEnCours.length > 0) {
        const mission = missionsEnCours[0];
        return {
          available: false,
          message: `Véhicule déjà assigné à la mission ${mission.numero} (${mission.statut})`
        };
      }

      return {
        available: true,
        message: 'Véhicule disponible pour assignation'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      return {
        available: false,
        message: 'Erreur lors de la vérification de disponibilité'
      };
    }
  },

  // Créer une nouvelle mission avec vérification
  async create(missionData: Omit<Mission, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('🚀 Création d\'une nouvelle mission pour véhicule:', missionData.vehicule_id);
      
      // Vérifier la disponibilité du véhicule
      const availability = await this.checkVehiculeAvailability(missionData.vehicule_id);
      
      if (!availability.available) {
        console.error('❌ Véhicule non disponible:', availability.message);
        throw new Error(availability.message);
      }

      console.log('✅ Véhicule disponible, création de la mission...');

      const { data, error } = await supabase
        .from('missions')
        .insert([missionData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création mission:', error)
        throw error
      }

      console.log('✅ Mission créée avec succès:', data.numero);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }
  },

  // Mettre à jour une mission avec vérification
  async update(id: string, missionData: Partial<Mission>) {
    try {
      console.log('🔄 Mise à jour mission:', id);
      
      // Si on change le véhicule, vérifier sa disponibilité
      if (missionData.vehicule_id) {
        const availability = await this.checkVehiculeAvailability(missionData.vehicule_id, id);
        
        if (!availability.available) {
          console.error('❌ Véhicule non disponible:', availability.message);
          throw new Error(availability.message);
        }
      }

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

      console.log('✅ Mission mise à jour avec succès');
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
          annulees: 0
        }
      }

      const stats = {
        total: missions?.length || 0,
        en_attente: missions?.filter(m => m.statut === 'en_attente').length || 0,
        en_cours: missions?.filter(m => m.statut === 'en_cours').length || 0,
        terminees: missions?.filter(m => m.statut === 'terminee').length || 0,
        annulees: missions?.filter(m => m.statut === 'annulee').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur générale stats missions:', error)
      return {
        total: 0,
        en_attente: 0,
        en_cours: 0,
        terminees: 0,
        annulees: 0
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

  // Récupérer les véhicules disponibles pour une nouvelle mission
  async getAvailableVehicules() {
    try {
      console.log('🔍 Recherche des véhicules disponibles...');
      
      // Récupérer tous les véhicules qui sont disponibles et ne nécessitent pas de validation
      const { data: vehicules, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('statut', 'disponible')
        .eq('validation_requise', false)
        .order('numero', { ascending: true });

      if (error) {
        console.error('Erreur véhicules disponibles:', error)
        return []
      }

      if (!vehicules || vehicules.length === 0) {
        console.log('⚠️ Aucun véhicule disponible trouvé');
        return [];
      }

      console.log(`✅ ${vehicules.length} véhicules potentiellement disponibles`);

      // Vérifier qu'ils ne sont pas déjà assignés à une mission en cours
      const vehiculesDisponibles = [];
      
      for (const vehicule of vehicules) {
        const { data: missionsEnCours } = await supabase
          .from('missions')
          .select('id, numero')
          .eq('vehicule_id', vehicule.id)
          .in('statut', ['en_attente', 'en_cours'])
          .limit(1);

        if (!missionsEnCours || missionsEnCours.length === 0) {
          vehiculesDisponibles.push(vehicule);
        } else {
          console.log(`⚠️ Véhicule ${vehicule.numero} déjà assigné à la mission ${missionsEnCours[0].numero}`);
        }
      }

      console.log(`✅ ${vehiculesDisponibles.length} véhicules réellement disponibles`);
      return vehiculesDisponibles;
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
      // Vérifier s'il y a des missions actives pour ces ressources
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

      // Pour l'instant, on considère qu'il y a conflit s'il y a déjà des missions actives
      const vehiculeConflict = conflits?.some(c => c.vehicule_id === vehiculeId);
      const chauffeurConflict = conflits?.some(c => c.chauffeur_id === chauffeurId);

      return {
        vehicule_disponible: !vehiculeConflict,
        chauffeur_disponible: !chauffeurConflict,
        message: (vehiculeConflict || chauffeurConflict) ? 'Ressource déjà assignée à une mission active' : 'Ressources disponibles'
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
