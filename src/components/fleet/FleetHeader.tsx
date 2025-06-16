
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FleetHeaderProps {
  onNewVehicle: () => void;
}

export const FleetHeader = ({ onNewVehicle }: FleetHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Gestion de la flotte</h1>
        <p className="text-muted-foreground">
          Gérez vos véhicules, maintenance et documentations
        </p>
      </div>
      <Button onClick={onNewVehicle}>
        <Plus className="mr-2 h-4 w-4" />
        Nouveau véhicule
      </Button>
    </div>
  );
};
