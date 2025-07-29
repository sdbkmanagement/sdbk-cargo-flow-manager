
import { supabase } from '@/integrations/supabase/client';

export const vehiculeSyncService = {
  async syncVehicleStatusFromValidation(vehiculeId: string) {
    console.log(`🔄 Synchronisation du statut pour véhicule ${vehiculeId}`);

    try {
      // Récupérer le workflow actuel du véhicule
      const { data: workflow, error: workflowError } = await supabase
        .from('validation_workflows')
        .select(`
          id,
          vehicule_id,
          statut_global,
          etapes:validation_etapes(
            id,
            etape,
            statut
          )
        `)
        .eq('vehicule_id', vehiculeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (workflowError || !workflow) {
        console.log('❌ Aucun workflow trouvé pour ce véhicule');
        return { success: false, message: 'Aucun workflow de validation trouvé' };
      }

      // Vérifier le statut des étapes
      const etapesValidees = workflow.etapes.filter(etape => etape.statut === 'valide');
      const etapesRejetees = workflow.etapes.filter(etape => etape.statut === 'rejete');

      let nouveauStatutVehicule = 'validation_requise';
      let validationRequise = true;

      if (etapesRejetees.length > 0) {
        nouveauStatutVehicule = 'indisponible';
        validationRequise = false;
      } else if (etapesValidees.length === workflow.etapes.length) {
        nouveauStatutVehicule = 'disponible';
        validationRequise = false;
      }

      console.log(`🎯 Synchronisation: ${vehiculeId} -> ${nouveauStatutVehicule}`);

      // Mettre à jour le véhicule
      const { error: updateError } = await supabase
        .from('vehicules')
        .update({ 
          statut: nouveauStatutVehicule,
          validation_requise: validationRequise,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehiculeId);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
        return { success: false, message: 'Erreur lors de la synchronisation' };
      }

      console.log('✅ Synchronisation réussie');
      return { 
        success: true, 
        message: `Véhicule synchronisé: ${nouveauStatutVehicule}`,
        newStatus: nouveauStatutVehicule
      };

    } catch (error) {
      console.error('💥 Erreur lors de la synchronisation:', error);
      return { success: false, message: 'Erreur lors de la synchronisation' };
    }
  },

  async getAllVehiclesForSync() {
    console.log('🔄 Récupération des véhicules pour synchronisation');

    try {
      const { data: vehicles, error } = await supabase
        .from('vehicules')
        .select('id, numero, statut, validation_requise')
        .order('numero');

      if (error) {
        console.error('❌ Erreur lors de la récupération des véhicules:', error);
        return [];
      }

      return vehicles || [];
    } catch (error) {
      console.error('💥 Erreur lors de la récupération des véhicules:', error);
      return [];
    }
  }
};
