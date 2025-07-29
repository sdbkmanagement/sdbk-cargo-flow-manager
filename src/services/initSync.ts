
import { validationService } from './validation';

export const initializeSync = async () => {
  try {
    console.log('🔄 Synchronisation automatique de tous les véhicules...');
    await validationService.syncAllVehicles();
    console.log('✅ Synchronisation initiale terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation initiale:', error);
  }
};
