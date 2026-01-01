import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeData = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Éviter les souscriptions multiples
    if (isSubscribedRef.current) {
      return;
    }

    // Créer un nom de channel unique pour éviter les conflits
    const channelName = `schema-db-changes-${Date.now()}`;
    
    // Configuration des canaux realtime pour les tables principales
    const channel = supabase
      .channel(channelName)
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

    channelRef.current = channel;
    isSubscribedRef.current = true;

    // Nettoyage lors de la suppression du composant
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [queryClient]);
};