import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Configuration des canaux realtime pour les tables principales
    const channel = supabase
      .channel('schema-db-changes')
      // Écouter les changements sur la table vehicules
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicules'
        },
        () => {
          // Invalider toutes les requêtes liées aux véhicules
          queryClient.invalidateQueries({ queryKey: ['vehicules'] });
          queryClient.invalidateQueries({ queryKey: ['available-vehicules'] });
          queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
        }
      )
      // Écouter les changements sur la table missions
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['missions'] });
          queryClient.invalidateQueries({ queryKey: ['available-vehicules'] });
          queryClient.invalidateQueries({ queryKey: ['chauffeurs-assignes-vehicule'] });
        }
      )
      // Écouter les changements sur la table chauffeurs
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chauffeurs'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
          queryClient.invalidateQueries({ queryKey: ['available-chauffeurs'] });
          queryClient.invalidateQueries({ queryKey: ['chauffeurs-assignes-vehicule'] });
        }
      )
      // Écouter les changements sur la table validation_workflows
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validation_workflows'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['validation-workflows'] });
          queryClient.invalidateQueries({ queryKey: ['vehicules'] });
        }
      )
      // Écouter les changements sur la table validation_etapes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validation_etapes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['validation-etapes'] });
          queryClient.invalidateQueries({ queryKey: ['validation-workflows'] });
          queryClient.invalidateQueries({ queryKey: ['vehicules'] });
        }
      )
      // Écouter les changements sur la table documents_vehicules
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents_vehicules'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents-vehicules'] });
          queryClient.invalidateQueries({ queryKey: ['alertes-documents-vehicules'] });
        }
      )
      // Écouter les changements sur la table documents_chauffeurs
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents_chauffeurs'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents-chauffeurs'] });
          queryClient.invalidateQueries({ queryKey: ['alertes-documents-chauffeurs'] });
        }
      )
      // Écouter les changements sur la table affectations
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'affectations'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['affectations'] });
          queryClient.invalidateQueries({ queryKey: ['chauffeurs-assignes-vehicule'] });
        }
      )
      // Écouter les changements sur la table maintenances
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenances'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['maintenances'] });
          queryClient.invalidateQueries({ queryKey: ['vehicules'] });
        }
      )
      .subscribe();

    // Nettoyage lors de la suppression du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};