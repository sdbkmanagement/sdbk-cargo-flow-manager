
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { vehiculesService } from '@/services/vehicules';
import { toast } from 'sonner';

export const VehicleStatusUpdateButton = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateAllToValidation = async () => {
    setIsLoading(true);
    try {
      const result = await vehiculesService.updateAllVehiclesToValidation();
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
        onSuccess();
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('❌ Erreur lors de la mise à jour des véhicules');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CheckCircle className="w-4 h-4" />
          Mettre tous en validation
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mettre tous les véhicules en validation</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Cette action va changer le statut de tous les véhicules qui ne sont pas déjà en validation vers 
              <Badge className="mx-2 bg-purple-500 text-white">Validation requise</Badge>
            </p>
            <p className="text-sm text-orange-600">
              ⚠️ Cette action ne peut pas être annulée. Les véhicules devront passer par le processus de validation pour redevenir disponibles.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpdateAllToValidation}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mise à jour...
              </>
            ) : (
              'Confirmer la mise à jour'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
