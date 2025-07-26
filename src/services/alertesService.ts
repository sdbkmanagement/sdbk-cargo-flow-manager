
import { supabase } from '@/integrations/supabase/client';

export interface AlerteDocument {
  id: string;
  chauffeur_id?: string;
  vehicule_id?: string;
  chauffeur_nom?: string;
  vehicule_numero?: string;
  immatriculation?: string;
  document_nom: string;
  document_type: string;
  date_expiration: string | null;
  jours_restants: number | null;
  statut: string;
  niveau_alerte: string;
  type?: 'chauffeur' | 'vehicule';
}

export const alertesService = {
  // Récupérer toutes les alertes documents chauffeurs
  async getAlertesChauffeurs() {
    try {
      console.log('🔍 Début du chargement des alertes documents chauffeurs...');
      
      // Requête directe à la table documents avec jointure
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          entity_id,
          nom,
          type,
          date_expiration,
          statut,
          chauffeurs!inner(nom, prenom)
        `)
        .eq('entity_type', 'chauffeur')
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors du chargement des alertes chauffeurs:', error);
        return [];
      }

      console.log('📄 Documents trouvés:', data);

      if (!data || data.length === 0) {
        console.log('⚠️ Aucun document avec date d\'expiration proche trouvé');
        return [];
      }

      // Construire les alertes
      const alertes = data.map(doc => {
        const joursRestants = Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        let statut = 'valide';
        let niveauAlerte = 'INFO';

        if (joursRestants < 0) {
          statut = 'expire';
          niveauAlerte = 'URGENT - EXPIRÉ';
        } else if (joursRestants <= 7) {
          statut = 'a_renouveler';
          niveauAlerte = 'URGENT';
        } else if (joursRestants <= 30) {
          statut = 'a_renouveler';
          niveauAlerte = 'ATTENTION';
        }

        return {
          id: doc.id,
          chauffeur_id: doc.entity_id,
          chauffeur_nom: doc.chauffeurs ? `${doc.chauffeurs.prenom} ${doc.chauffeurs.nom}` : 'Chauffeur inconnu',
          document_nom: doc.nom,
          document_type: doc.type,
          date_expiration: doc.date_expiration,
          jours_restants: joursRestants,
          statut,
          niveau_alerte: niveauAlerte
        };
      });

      console.log('✅ Alertes chauffeurs construites:', alertes);
      return alertes;
    } catch (error) {
      console.error('💥 Erreur lors du chargement des alertes chauffeurs:', error);
      return [];
    }
  },

  // Récupérer toutes les alertes documents véhicules
  async getAlertesVehicules() {
    try {
      console.log('🚗 Chargement des alertes documents véhicules...');
      
      // Requête directe à la table documents_vehicules avec jointure
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select(`
          id,
          vehicule_id,
          nom,
          type,
          date_expiration,
          statut,
          vehicules!inner(numero, immatriculation)
        `)
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors du chargement des alertes véhicules:', error);
        return [];
      }

      console.log('🚗 Documents véhicules trouvés:', data);

      // Construire les alertes
      const alertes = (data || []).map(doc => {
        const joursRestants = Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        let statut = 'valide';
        let niveauAlerte = 'INFO';

        if (joursRestants < 0) {
          statut = 'expire';
          niveauAlerte = 'URGENT - EXPIRÉ';
        } else if (joursRestants <= 7) {
          statut = 'a_renouveler';
          niveauAlerte = 'URGENT';
        } else if (joursRestants <= 30) {
          statut = 'a_renouveler';
          niveauAlerte = 'ATTENTION';
        }

        return {
          id: doc.id,
          vehicule_id: doc.vehicule_id,
          vehicule_numero: doc.vehicules?.numero || 'N/A',
          immatriculation: doc.vehicules?.immatriculation || '',
          document_nom: doc.nom,
          document_type: doc.type,
          date_expiration: doc.date_expiration,
          jours_restants: joursRestants,
          statut,
          niveau_alerte: niveauAlerte
        };
      });

      console.log('✅ Alertes véhicules construites:', alertes);
      return alertes;
    } catch (error) {
      console.error('💥 Erreur lors du chargement des alertes véhicules:', error);
      return [];
    }
  },

  // Récupérer toutes les alertes (chauffeurs + véhicules)
  async getToutesAlertes() {
    try {
      console.log('🔄 Chargement de toutes les alertes...');
      
      const [alertesChauffeurs, alertesVehicules] = await Promise.all([
        this.getAlertesChauffeurs(),
        this.getAlertesVehicules()
      ]);

      console.log('📊 Alertes chauffeurs récupérées:', alertesChauffeurs.length);
      console.log('📊 Alertes véhicules récupérées:', alertesVehicules.length);

      const toutesAlertes = [
        ...alertesChauffeurs.map((a: any) => ({ ...a, type: 'chauffeur' })),
        ...alertesVehicules.map((a: any) => ({ ...a, type: 'vehicule' }))
      ].sort((a, b) => {
        // Trier par jours restants (les plus critiques d'abord)
        if (a.jours_restants === null && b.jours_restants === null) return 0;
        if (a.jours_restants === null) return 1;
        if (b.jours_restants === null) return -1;
        return a.jours_restants - b.jours_restants;
      });

      console.log('✅ Toutes les alertes fusionnées:', toutesAlertes.length);
      return toutesAlertes;
    } catch (error) {
      console.error('💥 Erreur lors de la récupération de toutes les alertes:', error);
      return [];
    }
  }
};
