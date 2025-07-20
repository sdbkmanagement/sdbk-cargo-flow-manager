
import { supabase } from '@/integrations/supabase/client';

export const alertesService = {
  // Récupérer toutes les alertes documents chauffeurs
  async getAlertesChauffeurs() {
    try {
      console.log('Chargement des alertes documents chauffeurs...');
      
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*')
        .order('jours_restants', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erreur lors du chargement des alertes chauffeurs:', error);
        return [];
      }

      console.log('Alertes chauffeurs récupérées:', data);

      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const alertesFiltered = data?.filter(alert => {
        if (alert.jours_restants === null) return false;
        return alert.jours_restants <= 30;
      }) || [];

      console.log('Alertes chauffeurs filtrées (≤ 30 jours):', alertesFiltered);
      return alertesFiltered;
    } catch (error) {
      console.error('Erreur lors du chargement des alertes chauffeurs:', error);
      return [];
    }
  },

  // Récupérer toutes les alertes documents véhicules
  async getAlertesVehicules() {
    try {
      console.log('Chargement des alertes documents véhicules...');
      
      const { data, error } = await supabase
        .from('alertes_documents_vehicules')
        .select('*')
        .order('jours_restants', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erreur lors du chargement des alertes véhicules:', error);
        return [];
      }

      console.log('Alertes véhicules récupérées:', data);

      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const alertesFiltered = data?.filter(alert => {
        if (alert.jours_restants === null) return false;
        return alert.jours_restants <= 30;
      }) || [];

      console.log('Alertes véhicules filtrées (≤ 30 jours):', alertesFiltered);
      return alertesFiltered;
    } catch (error) {
      console.error('Erreur lors du chargement des alertes véhicules:', error);
      return [];
    }
  },

  // Récupérer toutes les alertes (chauffeurs + véhicules)
  async getToutesAlertes() {
    try {
      const [alertesChauffeurs, alertesVehicules] = await Promise.all([
        this.getAlertesChauffeurs(),
        this.getAlertesVehicules()
      ]);

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

      console.log('Toutes les alertes fusionnées:', toutesAlertes);
      return toutesAlertes;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les alertes:', error);
      return [];
    }
  }
};
