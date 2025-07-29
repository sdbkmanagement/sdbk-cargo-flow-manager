
import { validationService } from './validation';

export const initializeSync = async () => {
  console.log('🚀 Initialisation de la synchronisation des véhicules...');
  
  try {
    // Exécuter une synchronisation initiale au démarrage
    await validationService.syncAllVehicles();
    console.log('✅ Synchronisation initiale terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation initiale:', error);
  }
};

// Exécuter la synchronisation initiale
initializeSync();
