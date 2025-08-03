
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { ExportButton } from '@/components/common/ExportButton';
import { exportFleetService } from '@/services/exportFleetService';
import { useVehicles } from '@/hooks/useVehicles';

interface FleetHeaderProps {
  onNewVehicle: () => void;
  onRefresh: () => void;
}

export const FleetHeader = ({ onNewVehicle, onRefresh }: FleetHeaderProps) => {
  const { data: vehicles = [] } = useVehicles();

  const handleExportExcel = () => {
    exportFleetService.exportToExcel(vehicles, 'flotte_vehicules');
  };

  const handleExportCSV = () => {
    exportFleetService.exportToCSV(vehicles, 'flotte_vehicules');
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de la flotte</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos véhicules, leurs documents et leur maintenance
        </p>
      </div>
      <div className="flex gap-3">
        <ExportButton
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
          disabled={vehicles.length === 0}
        />
        <Button
          variant="outline"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
        <Button
          onClick={onNewVehicle}
          className="bg-orange-500 hover:bg-orange-600 gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau véhicule
        </Button>
      </div>
    </div>
  );
};
