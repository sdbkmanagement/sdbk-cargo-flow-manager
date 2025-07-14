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
import { Plus, Calendar, Wrench, AlertTriangle, DollarSign } from 'lucide-react';
import vehiculesService, { type Vehicule } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import type { Database } from '@/integrations/supabase/types';

type MaintenanceVehicule = Database['public']['Tables']['maintenance_vehicules']['Row'];

interface VehicleMaintenanceHistoryProps {
  vehicle: Vehicule;
}

interface MaintenanceFormData {
  type_maintenance: string;
  date_maintenance: string;
  kilometrage_maintenance: string;
  description: string;
  cout: string;
  garage: string;
  pieces_changees: string;
  prochaine_maintenance_prevue: string;
}

export const VehicleMaintenanceHistory = ({ vehicle }: VehicleMaintenanceHistoryProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormData>();

  // Récupération de l'historique de maintenance
  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['vehicle-maintenance', vehicle.id],
    queryFn: () => vehiculesService.getMaintenance(vehicle.id),
  });

  // Mutation pour ajouter une maintenance
  const addMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const maintenanceData = {
        vehicule_id: vehicle.id,
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
      queryClient.invalidateQueries({ queryKey: ['vehicle-maintenance', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast({
        title: 'Maintenance ajoutée',
        description: 'La maintenance a été enregistrée avec succès.',
      });
      setShowAddForm(false);
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

  const getMaintenanceTypeBadge = (type: string) => {
    return type === 'preventive' ? (
      <Badge className="bg-blue-100 text-blue-800">Préventive</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800">Curative</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Historique de maintenance</h3>
          <p className="text-sm text-muted-foreground">
            {vehicle.numero} - {vehicle.immatriculation}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une maintenance
        </Button>
      </div>

      {/* Informations actuelles du véhicule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations actuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Dernière maintenance:</span>
              <span className="ml-2">
                {vehicle.derniere_maintenance 
                  ? new Date(vehicle.derniere_maintenance).toLocaleDateString()
                  : 'Aucune'
                }
              </span>
            </div>
            <div>
              <span className="font-medium">Prochaine maintenance:</span>
              <span className="ml-2">
                {vehicle.prochaine_maintenance 
                  ? new Date(vehicle.prochaine_maintenance).toLocaleDateString()
                  : 'Non planifiée'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des maintenances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique des interventions</CardTitle>
          <CardDescription>
            {maintenances.length} intervention(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune maintenance enregistrée pour ce véhicule</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Garage</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Prochaine</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(maintenance.date_maintenance).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMaintenanceTypeBadge(maintenance.type_maintenance)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div>
                        <p className="truncate">{maintenance.description || '-'}</p>
                        {maintenance.pieces_changees && maintenance.pieces_changees.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pièces: {maintenance.pieces_changees.join(', ')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{maintenance.garage || '-'}</TableCell>
                    <TableCell>
                      {maintenance.cout ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {maintenance.cout.toLocaleString('fr-FR')} GNF
                        </div>
                      ) : '-'}
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
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout de maintenance */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une maintenance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kilometrage_maintenance">Kilométrage</Label>
                <Input
                  id="kilometrage_maintenance"
                  type="number"
                  {...register('kilometrage_maintenance')}
                  placeholder="150000"
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
                <Label htmlFor="prochaine_maintenance_prevue">Prochaine maintenance prévue</Label>
                <Input
                  id="prochaine_maintenance_prevue"
                  type="date"
                  {...register('prochaine_maintenance_prevue')}
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

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
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
