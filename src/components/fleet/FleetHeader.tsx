
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { VehicleRenumberButton } from './VehicleRenumberButton';

interface FleetHeaderProps {
  onNewVehicle: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export const FleetHeader = ({ onNewVehicle, onImport, onExport, onRefresh }: FleetHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la flotte</h1>
        <p className="text-gray-600">Gérez vos véhicules et leur maintenance</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <VehicleRenumberButton onComplete={onRefresh} />
        
        {onImport && (
          <Button variant="outline" onClick={onImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Importer
          </Button>
        )}
        
        {onExport && (
          <Button variant="outline" onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        )}
        
        <Button onClick={onNewVehicle} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau véhicule
        </Button>
      </div>
    </div>
  );
};
