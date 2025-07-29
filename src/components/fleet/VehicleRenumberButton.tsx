
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { RefreshCw, Hash } from 'lucide-react';
import { renameAllVehiclesToSequential } from '@/services/vehiculeNumbering';

interface VehicleRenumberButtonProps {
  onComplete?: () => void;
}

export const VehicleRenumberButton = ({ onComplete }: VehicleRenumberButtonProps) => {
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRenumber = async () => {
    setIsRenaming(true);
    
    try {
      const result = await renameAllVehiclesToSequential();
      
      if (result.success) {
        toast.success(result.message);
        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la renumérotation');
      console.error('Erreur renumérotation:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Hash className="h-4 w-4" />
          Renuméroter tous les véhicules
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Renuméroter tous les véhicules</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va renommer tous les véhicules existants avec une numérotation séquentielle : V001, V002, V003, etc.
            <br /><br />
            <strong>Attention :</strong> Cette action est irréversible et mettra à jour tous les numéros de véhicules dans l'ordre de leur création.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRenumber}
            disabled={isRenaming}
            className="gap-2"
          >
            {isRenaming ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Renumérotation...
              </>
            ) : (
              'Confirmer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
