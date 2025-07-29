
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { VehicleRenumberButton } from './VehicleRenumberButton';
import { VehicleStatusUpdateButton } from './VehicleStatusUpdateButton';

interface FleetHeaderProps {
  onNewVehicle: () => void;
  onRefresh: () => void;
}

export const FleetHeader = ({ onNewVehicle, onRefresh }: FleetHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de la Flotte</h1>
        <p className="text-gray-600 mt-1">Gérez vos véhicules, leur maintenance et leurs affectations</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <VehicleStatusUpdateButton onSuccess={onRefresh} />
        <VehicleRenumberButton onComplete={onRefresh} />
        
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
        
        <Button
          onClick={onNewVehicle}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau véhicule
        </Button>
      </div>
    </div>
  );
};
