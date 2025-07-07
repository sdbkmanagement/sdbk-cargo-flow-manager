
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Edit } from 'lucide-react';
import { chargementsService } from '@/services/chargements';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ChargementActionsProps {
  chargement: any;
  onEdit?: (chargement: any) => void;
}

export const ChargementActions = ({ chargement, onEdit }: ChargementActionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatutMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: 'charge' | 'livre' | 'annule' }) => {
      return chargementsService.updateStatut(id, statut);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargements'] });
      queryClient.invalidateQueries({ queryKey: ['chargements-stats'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut du chargement a été modifié avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du chargement.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateStatut = async (statut: 'charge' | 'livre' | 'annule') => {
    if (window.confirm(`Êtes-vous sûr de vouloir changer le statut vers "${getStatutLabel(statut)}" ?`)) {
      updateStatutMutation.mutate({ id: chargement.id, statut });
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'charge': return 'Chargé';
      case 'livre': return 'Livré';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <>
            <DropdownMenuItem onClick={() => onEdit(chargement)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {chargement.statut === 'charge' && (
          <DropdownMenuItem 
            onClick={() => handleUpdateStatut('livre')}
            disabled={updateStatutMutation.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Marquer comme livré
          </DropdownMenuItem>
        )}
        
        {chargement.statut !== 'annule' && (
          <DropdownMenuItem 
            onClick={() => handleUpdateStatut('annule')}
            disabled={updateStatutMutation.isPending}
            className="text-red-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Annuler
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
