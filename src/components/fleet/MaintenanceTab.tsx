
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar, AlertTriangle, Wrench } from 'lucide-react';

import { MaintenanceForm } from './MaintenanceForm';
import { vehiculesService } from '@/services/vehicules';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type MaintenanceVehicule = Database['public']['Tables']['maintenance_vehicules']['Row'];

interface MaintenanceTabProps {
  vehicles: Vehicule[];
}

export const MaintenanceTab = ({ vehicles }: MaintenanceTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  const { data: maintenanceHistory = [] } = useQuery({
    queryKey: ['maintenance-history'],
    queryFn: async () => {
      const allMaintenance = await Promise.all(
        vehicles.map(async (vehicle) => {
          const maintenance = await vehiculesService.getMaintenance(vehicle.id);
          return maintenance.map(m => ({ ...m, vehicule: vehicle }));
        })
      );
      return allMaintenance.flat();
    },
    enabled: vehicles.length > 0
  });

  const urgentMaintenanceVehicles = vehicles.filter(vehicle => 
    vehicle.prochaine_maintenance && 
    new Date(vehicle.prochaine_maintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const handleNewMaintenance = (vehicleId?: string) => {
    setSelectedVehicle(vehicleId || '');
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Suivi des maintenances</h2>
          <p className="text-muted-foreground">
            Programmation et historique des entretiens
          </p>
        </div>
        <Button onClick={() => handleNewMaintenance()}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle maintenance
        </Button>
      </div>

      {/* Alertes maintenance urgente */}
      {urgentMaintenanceVehicles.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Maintenances urgentes
            </CardTitle>
            <CardDescription className="text-red-700">
              {urgentMaintenanceVehicles.length} véhicule(s) nécessitent une maintenance dans les 30 prochains jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentMaintenanceVehicles.map(vehicle => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{vehicle.numero} - {vehicle.immatriculation}</p>
                    <p className="text-sm text-muted-foreground">
                      Maintenance prévue le {new Date(vehicle.prochaine_maintenance!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleNewMaintenance(vehicle.id)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Programmer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des maintenances */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des maintenances</CardTitle>
          <CardDescription>
            {maintenanceHistory.length} intervention(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Garage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceHistory.map((maintenance: any) => (
                <TableRow key={maintenance.id}>
                  <TableCell>
                    {new Date(maintenance.date_maintenance).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{maintenance.vehicule.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {maintenance.vehicule.immatriculation}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={maintenance.type_maintenance === 'preventive' ? 'default' : 'destructive'}>
                      {maintenance.type_maintenance === 'preventive' ? 'Préventive' : 'Curative'}
                    </Badge>
                  </TableCell>
                  <TableCell>{maintenance.description || '-'}</TableCell>
                  <TableCell>
                    {maintenance.cout ? `${maintenance.cout.toLocaleString()} €` : '-'}
                  </TableCell>
                  <TableCell>{maintenance.garage || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle maintenance</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            vehicles={vehicles}
            selectedVehicleId={selectedVehicle}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
