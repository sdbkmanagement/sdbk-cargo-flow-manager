
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validationService } from '@/services/validation';

export const useAutoSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Initialisation de la synchronisation automatique...');

    // Écouter les changements sur validation_etapes pour déclencher la synchronisation
    const channel = supabase
      .channel('auto-sync-validation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'validation_etapes'
        },
        async (payload) => {
          console.log('🔄 Changement détecté dans validation_etapes:', payload);
          
          // Déclencher la synchronisation automatique avec un délai pour éviter les conflits
          setTimeout(async () => {
            try {
              await validationService.syncAllVehicles();
              
              // Invalider les requêtes pertinentes
              queryClient.invalidateQueries({ queryKey: ['vehicules'] });
              queryClient.invalidateQueries({ queryKey: ['validation-workflows'] });
              queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
              
              console.log('✅ Synchronisation automatique terminée');
            } catch (error) {
              console.error('❌ Erreur lors de la synchronisation automatique:', error);
            }
          }, 1000); // Délai de 1 seconde
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Nettoyage de la synchronisation automatique...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
