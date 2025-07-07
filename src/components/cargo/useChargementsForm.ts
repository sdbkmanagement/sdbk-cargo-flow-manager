
import { useState } from 'react';
import { chargementsService } from '@/services/chargements';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useChargementsForm = (onSuccess?: () => void) => {
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createChargementMutation = useMutation({
    mutationFn: chargementsService.createChargement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chargements'] });
      queryClient.invalidateQueries({ queryKey: ['chargements-stats'] });
      toast({
        title: "Chargement créé",
        description: `Le chargement ${data.numero} a été créé avec succès.`,
      });
      // Rediriger vers la liste des chargements
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Erreur lors de la création du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le chargement.",
        variant: "destructive",
      });
    }
  });

  return {
    selectedMission,
    setSelectedMission,
    createChargementMutation,
    isCreating: createChargementMutation.isPending
  };
};
