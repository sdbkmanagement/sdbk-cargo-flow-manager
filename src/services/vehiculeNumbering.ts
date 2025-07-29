
import { supabase } from '@/integrations/supabase/client';

export const renameAllVehiclesToSequential = async (): Promise<{ success: boolean; message: string; updated: number }> => {
  try {
    console.log('Début de la renommage des véhicules...');

    // 1. Récupérer tous les véhicules triés par date de création
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicules')
      .select('id, numero, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Erreur lors de la récupération des véhicules:', fetchError);
      return {
        success: false,
        message: 'Erreur lors de la récupération des véhicules',
        updated: 0
      };
    }

    if (!vehicles || vehicles.length === 0) {
      return {
        success: true,
        message: 'Aucun véhicule à renommer',
        updated: 0
      };
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // 2. Renommer chaque véhicule avec V001, V002, etc.
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const newNumber = `V${(i + 1).toString().padStart(3, '0')}`;
      
      // Ne pas mettre à jour si le numéro est déjà correct
      if (vehicle.numero === newNumber) {
        continue;
      }

      console.log(`Renommage de ${vehicle.numero} vers ${newNumber}`);

      const { error: updateError } = await supabase
        .from('vehicules')
        .update({ numero: newNumber })
        .eq('id', vehicle.id);

      if (updateError) {
        console.error(`Erreur lors du renommage du véhicule ${vehicle.id}:`, updateError);
        errors.push(`Erreur pour le véhicule ${vehicle.numero}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `${updatedCount} véhicules renommés avec succès, ${errors.length} erreurs: ${errors.join(', ')}`,
        updated: updatedCount
      };
    }

    return {
      success: true,
      message: `${updatedCount} véhicules renommés avec succès`,
      updated: updatedCount
    };

  } catch (error) {
    console.error('Erreur générale lors du renommage:', error);
    return {
      success: false,
      message: `Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      updated: 0
    };
  }
};
