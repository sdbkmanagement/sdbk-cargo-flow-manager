
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceTabProps {
  vehicles: any[];
}

export const MaintenanceTab = ({ vehicles }: MaintenanceTabProps) => {
  const vehiclesInMaintenance = vehicles.filter(v => v.statut === 'maintenance');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance des véhicules</CardTitle>
        <CardDescription>
          Suivi et gestion de la maintenance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {vehiclesInMaintenance.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun véhicule actuellement en maintenance.
          </p>
        ) : (
          <div className="space-y-4">
            {vehiclesInMaintenance.map((vehicle) => (
              <div key={vehicle.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{vehicle.numero}</h3>
                <p className="text-sm text-muted-foreground">
                  {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    En maintenance
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
