
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleTable } from './VehicleTable';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (vehicule: Vehicule) => void;
  onDelete: (id: string) => void;
  onViewDocuments?: (vehicule: Vehicule) => void;
  onViewMaintenance?: (vehicule: Vehicule) => void;
}

export const VehicleListTab = ({ 
  vehicles, 
  onEdit, 
  onDelete, 
  onViewDocuments, 
  onViewMaintenance 
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
        />
      </CardContent>
    </Card>
  );
};
