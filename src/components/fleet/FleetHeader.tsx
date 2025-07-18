
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FleetHeaderProps {
  onAddVehicle: () => void;
  vehicleCount: number;
}

export const FleetHeader = ({ onAddVehicle, vehicleCount }: FleetHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Gestion de la flotte</h1>
        <p className="text-muted-foreground">
          Gérez vos véhicules, maintenance et documentations ({vehicleCount} véhicules)
        </p>
      </div>
      <Button onClick={onAddVehicle} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
        <Plus className="h-4 w-4" />
        Nouveau véhicule
      </Button>
    </div>
  );
};
