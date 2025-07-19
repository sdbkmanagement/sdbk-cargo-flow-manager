
import { supabase } from '@/integrations/supabase/client';

export interface AlerteDocument {
  id: string;
  vehicule_id: string;
  vehicule_numero: string;
  immatriculation: string;
  document_nom: string;
  document_type: string;
  date_expiration: string;
  niveau_alerte: 'expire' | 'a_renouveler' | 'valide';
  jours_restants: number;
}

export const alertesService = {
  async getAlertesVehicules(): Promise<AlerteDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select(`
          id,
          vehicule_id,
          nom,
          type,
          date_expiration,
          vehicules!inner (
            numero,
            immatriculation,
            tracteur_immatriculation,
            type_vehicule
          )
        `)
        .not('date_expiration', 'is', null);

      if (error) {
        console.error('Erreur lors du chargement des alertes:', error);
        return [];
      }

      const alertes: AlerteDocument[] = [];

      data?.forEach(doc => {
        const vehicule = doc.vehicules as any;
        const dateExpiration = new Date(doc.date_expiration!);
        const today = new Date();
        const diffTime = dateExpiration.getTime() - today.getTime();
        const joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let niveauAlerte: 'expire' | 'a_renouveler' | 'valide' = 'valide';
        
        if (joursRestants < 0) {
          niveauAlerte = 'expire';
        } else if (joursRestants <= 30) {
          niveauAlerte = 'a_renouveler';
        }

        // Only include documents that need attention
        if (niveauAlerte !== 'valide') {
          alertes.push({
            id: doc.id,
            vehicule_id: doc.vehicule_id,
            vehicule_numero: vehicule.numero,
            immatriculation: vehicule.type_vehicule === 'porteur' 
              ? vehicule.immatriculation || ''
              : vehicule.tracteur_immatriculation || '',
            document_nom: doc.nom,
            document_type: doc.type,
            date_expiration: doc.date_expiration!,
            niveau_alerte: niveauAlerte,
            jours_restants: joursRestants
          });
        }
      });

      return alertes;
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      return [];
    }
  }
};
