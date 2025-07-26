
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Truck, Upload } from 'lucide-react';
import { VehicleTracteurRemorqueImport } from './VehicleTracteurRemorqueImport';

interface FleetHeaderProps {
  onAddVehicle: () => void;
  vehicleCount: number;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({ onAddVehicle, vehicleCount }) => {
  const [showVehicleImport, setShowVehicleImport] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestion de flotte</h1>
          <span className="text-muted-foreground">({vehicleCount} véhicules)</span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowVehicleImport(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Véhicules
          </Button>
          <Button onClick={onAddVehicle}>
            Ajouter un véhicule
          </Button>
        </div>
      </div>

      {/* Dialog pour l'import de véhicules */}
      <Dialog open={showVehicleImport} onOpenChange={setShowVehicleImport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import de véhicules</DialogTitle>
          </DialogHeader>
          <VehicleTracteurRemorqueImport
            onClose={() => setShowVehicleImport(false)}
            onSuccess={() => {
              setShowVehicleImport(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
