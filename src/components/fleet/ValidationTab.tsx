
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationTabProps {
  vehicles: any[];
}

export const ValidationTab = ({ vehicles }: ValidationTabProps) => {
  const vehiclesNeedingValidation = vehicles.filter(v => v.statut === 'validation_requise');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation des véhicules</CardTitle>
        <CardDescription>
          Processus de validation post-mission
        </CardDescription>
      </CardHeader>
      <CardContent>
        {vehiclesNeedingValidation.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun véhicule en attente de validation.
          </p>
        ) : (
          <div className="space-y-4">
            {vehiclesNeedingValidation.map((vehicle) => (
              <div key={vehicle.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{vehicle.numero}</h3>
                <p className="text-sm text-muted-foreground">
                  {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Validation requise
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
