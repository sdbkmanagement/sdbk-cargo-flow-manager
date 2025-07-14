
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleTable } from './VehicleTable';
import type { Vehicule } from '@/services/vehicules';

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (vehicule: Vehicule) => void;
  onDelete: (id: string) => void;
  onViewDocuments?: (vehicule: Vehicule) => void;
  onViewMaintenance?: (vehicule: Vehicule) => void;
  onViewPostMissionWorkflow?: (vehicule: Vehicule) => void;
}

export const VehicleListTab = ({ 
  vehicles, 
  onEdit, 
  onDelete, 
  onViewDocuments, 
  onViewMaintenance,
  onViewPostMissionWorkflow 
}: VehicleListTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Véhicules de la flotte</CardTitle>
        <CardDescription>
          {vehicles.length} véhicule(s) trouvé(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VehicleTable 
          vehicles={vehicles}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDocuments={onViewDocuments}
            onViewMaintenance={onViewMaintenance}
            onViewPostMissionWorkflow={onViewPostMissionWorkflow}
        />
      </CardContent>
    </Card>
  );
};
