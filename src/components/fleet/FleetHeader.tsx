
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface FleetHeaderProps {
  onAddVehicle: () => void;
  onImportVehicles: () => void;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({
  onAddVehicle,
  onImportVehicles
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de la Flotte</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos véhicules, leur maintenance et leur statut
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={onImportVehicles}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Importer
        </Button>
        <Button
          onClick={onAddVehicle}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau véhicule
        </Button>
      </div>
    </div>
  );
};
