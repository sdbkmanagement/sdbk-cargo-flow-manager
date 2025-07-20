
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
      
      // D'abord, vérifier s'il y a des documents pour les chauffeurs
      const { data: allDocuments, error: allDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur');

      console.log('📄 Tous les documents chauffeurs:', allDocuments);
      
      if (allDocsError) {
        console.error('❌ Erreur lors de la récupération de tous les documents:', allDocsError);
      }

      // Maintenant essayer la vue
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*')
        .order('jours_restants', { ascending: true, nullsFirst: false });

      console.log('🎯 Données brutes de la vue alertes_documents_chauffeurs:', data);
      console.log('🎯 Erreur éventuelle:', error);

      if (error) {
        console.error('❌ Erreur lors du chargement des alertes chauffeurs:', error);
        
        // Fallback: construire les alertes manuellement
        console.log('🔄 Tentative de fallback manuel...');
        return await this.getAlertesChauffeursFallback();
      }

      if (!data || data.length === 0) {
        console.log('⚠️ Aucune donnée retournée par la vue, tentative de fallback...');
        return await this.getAlertesChauffeursFallback();
      }

      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const alertesFiltered = data?.filter(alert => {
        if (alert.jours_restants === null) return false;
        return alert.jours_restants <= 30;
      }) || [];

      console.log('✅ Alertes chauffeurs filtrées (≤ 30 jours):', alertesFiltered);
      return alertesFiltered;
    } catch (error) {
      console.error('💥 Erreur lors du chargement des alertes chauffeurs:', error);
      return await this.getAlertesChauffeursFallback();
    }
  },

  // Méthode de fallback pour construire les alertes manuellement
  async getAlertesChauffeursFallback() {
    try {
      console.log('🔄 Exécution de la méthode fallback...');
      
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select(`
          id,
          entity_id,
          nom,
          type,
          date_expiration
        `)
        .eq('entity_type', 'chauffeur')
        .not('date_expiration', 'is', null);

      if (docsError) {
        console.error('❌ Erreur fallback documents:', docsError);
        return [];
      }

      console.log('📄 Documents trouvés dans le fallback:', documents);

      if (!documents || documents.length === 0) {
        console.log('⚠️ Aucun document avec date d\'expiration trouvé');
        return [];
      }

      // Récupérer les informations des chauffeurs
      const chauffeurIds = documents.map(doc => doc.entity_id).filter(Boolean);
      console.log('👥 IDs des chauffeurs:', chauffeurIds);

      const { data: chauffeurs, error: chauffeursError } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom')
        .in('id', chauffeurIds);

      if (chauffeursError) {
        console.error('❌ Erreur récupération chauffeurs:', chauffeursError);
        return [];
      }

      console.log('👤 Chauffeurs trouvés:', chauffeurs);

      // Construire les alertes manuellement
      const alertes = documents.map(doc => {
        const chauffeur = chauffeurs?.find(c => c.id === doc.entity_id);
        const dateExpiration = new Date(doc.date_expiration);
        const aujourd = new Date();
        const joursRestants = Math.ceil((dateExpiration.getTime() - aujourd.getTime()) / (1000 * 60 * 60 * 24));

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
          chauffeur_nom: chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'Chauffeur inconnu',
          document_nom: doc.nom,
          document_type: doc.type,
          date_expiration: doc.date_expiration,
          jours_restants: joursRestants,
          statut,
          niveau_alerte: niveauAlerte
        };
      }).filter(alerte => alerte.jours_restants <= 30); // Filtrer les alertes pertinentes

      console.log('✅ Alertes construites manuellement:', alertes);
      return alertes;

    } catch (error) {
      console.error('💥 Erreur dans la méthode fallback:', error);
      return [];
    }
  },

  // Récupérer toutes les alertes documents véhicules
  async getAlertesVehicules() {
    try {
      console.log('🚗 Chargement des alertes documents véhicules...');
      
      const { data, error } = await supabase
        .from('alertes_documents_vehicules')
        .select('*')
        .order('jours_restants', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('❌ Erreur lors du chargement des alertes véhicules:', error);
        return [];
      }

      console.log('🚗 Alertes véhicules récupérées:', data);

      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const alertesFiltered = data?.filter(alert => {
        if (alert.jours_restants === null) return false;
        return alert.jours_restants <= 30;
      }) || [];

      console.log('✅ Alertes véhicules filtrées (≤ 30 jours):', alertesFiltered);
      return alertesFiltered;
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
