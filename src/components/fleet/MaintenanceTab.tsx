
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Wrench, AlertTriangle, Calendar, Truck } from 'lucide-react';
import { vehiculesService } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type MaintenanceVehicule = Database['public']['Tables']['maintenance_vehicules']['Row'];

interface MaintenanceTabProps {
  vehicles: Vehicule[];
}

interface MaintenanceFormData {
  vehicule_id: string;
  type_maintenance: string;
  date_maintenance: string;
  kilometrage_maintenance: string;
  description: string;
  cout: string;
  garage: string;
  pieces_changees: string;
  prochaine_maintenance_prevue: string;
}

export const MaintenanceTab = ({ vehicles }: MaintenanceTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormData>();

  // Récupération de toutes les maintenances
  const { data: allMaintenances = [] } = useQuery({
    queryKey: ['all-maintenances'],
    queryFn: async () => {
      const maintenances = await Promise.all(
        vehicles.map(async (vehicle) => {
          const vehicleMaintenances = await vehiculesService.getMaintenance(vehicle.id);
          return vehicleMaintenances.map(m => ({ ...m, vehicle }));
        })
      );
      return maintenances.flat().sort((a, b) => 
        new Date(b.date_maintenance).getTime() - new Date(a.date_maintenance).getTime()
      );
    },
    enabled: vehicles.length > 0,
  });

  // Mutation pour ajouter une maintenance
  const addMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const maintenanceData = {
        vehicule_id: data.vehicule_id,
        type_maintenance: data.type_maintenance,
        date_maintenance: data.date_maintenance,
        kilometrage_maintenance: data.kilometrage_maintenance ? parseInt(data.kilometrage_maintenance) : null,
        description: data.description || null,
        cout: data.cout ? parseFloat(data.cout) : null,
        garage: data.garage || null,
        pieces_changees: data.pieces_changees ? data.pieces_changees.split(',').map(p => p.trim()) : null,
        prochaine_maintenance_prevue: data.prochaine_maintenance_prevue || null,
      };
      return vehiculesService.addMaintenance(maintenanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast({
        title: 'Maintenance ajoutée',
        description: 'La maintenance a été enregistrée avec succès.',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la maintenance.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    addMaintenanceMutation.mutate(data);
  };

  // Calcul des alertes maintenance
  const getMaintenanceAlerts = () => {
    const alerts = vehicles.filter(vehicle => {
      if (!vehicle.prochaine_maintenance) return false;
      const nextMaintenance = new Date(vehicle.prochaine_maintenance);
      return nextMaintenance <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    });
    return alerts;
  };

  const maintenanceAlerts = getMaintenanceAlerts();

  const getMaintenanceTypeBadge = (type: string) => {
    return type === 'preventive' ? (
      <Badge className="bg-blue-100 text-blue-800">Préventive</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800">Curative</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alertes maintenance */}
      {maintenanceAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertes maintenance ({maintenanceAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenanceAlerts.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{vehicle.numero} - {vehicle.immatriculation}</span>
                    <span className="text-sm text-muted-foreground">
                      {vehicle.marque} {vehicle.modele}
                    </span>
                  </div>
                  <div className="text-sm text-orange-700">
                    Maintenance prévue le {new Date(vehicle.prochaine_maintenance!).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des maintenances</CardTitle>
            <CardDescription>
              Suivi complet des interventions sur la flotte
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle maintenance
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Garage</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Prochaine maintenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMaintenances.map((maintenance: any) => (
                <TableRow key={maintenance.id}>
                  <TableCell>
                    {new Date(maintenance.date_maintenance).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{maintenance.vehicle.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {maintenance.vehicle.immatriculation}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getMaintenanceTypeBadge(maintenance.type_maintenance)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {maintenance.description || '-'}
                  </TableCell>
                  <TableCell>{maintenance.garage || '-'}</TableCell>
                  <TableCell>
                    {maintenance.cout ? `${maintenance.cout.toLocaleString('fr-FR')} GNF` : '-'}
                  </TableCell>
                  <TableCell>
                    {maintenance.prochaine_maintenance_prevue 
                      ? new Date(maintenance.prochaine_maintenance_prevue).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout de maintenance */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle maintenance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicule_id">Véhicule *</Label>
                <select
                  id="vehicule_id"
                  {...register('vehicule_id', { required: 'Véhicule requis' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.numero} - {vehicle.immatriculation} ({vehicle.marque} {vehicle.modele})
                    </option>
                  ))}
                </select>
                {errors.vehicule_id && (
                  <p className="text-sm text-red-500">{errors.vehicule_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_maintenance">Type de maintenance *</Label>
                <select
                  id="type_maintenance"
                  {...register('type_maintenance', { required: 'Type requis' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sélectionner le type</option>
                  <option value="preventive">Préventive</option>
                  <option value="curative">Curative</option>
                </select>
                {errors.type_maintenance && (
                  <p className="text-sm text-red-500">{errors.type_maintenance.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_maintenance">Date de maintenance *</Label>
                <Input
                  id="date_maintenance"
                  type="date"
                  {...register('date_maintenance', { required: 'Date requise' })}
                />
                {errors.date_maintenance && (
                  <p className="text-sm text-red-500">{errors.date_maintenance.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kilometrage_maintenance">Kilométrage</Label>
                <Input
                  id="kilometrage_maintenance"
                  type="number"
                  {...register('kilometrage_maintenance')}
                  placeholder="150000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Détails de l'intervention..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="garage">Garage</Label>
                <Input
                  id="garage"
                  {...register('garage')}
                  placeholder="Nom du garage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cout">Coût (GNF)</Label>
                <Input
                  id="cout"
                  type="number"
                  step="0.01"
                  {...register('cout')}
                  placeholder="1250000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieces_changees">Pièces changées (séparées par des virgules)</Label>
              <Input
                id="pieces_changees"
                {...register('pieces_changees')}
                placeholder="Filtre à huile, Plaquettes de frein, Pneus avant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prochaine_maintenance_prevue">Prochaine maintenance prévue</Label>
              <Input
                id="prochaine_maintenance_prevue"
                type="date"
                {...register('prochaine_maintenance_prevue')}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={addMaintenanceMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {addMaintenanceMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
