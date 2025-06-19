
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { vehiculesService } from '@/services/vehicules';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];

interface MaintenanceFormData {
  vehicule_id: string;
  type_maintenance: 'preventive' | 'curative';
  date_maintenance: string;
  kilometrage_maintenance: string;
  description: string;
  cout: string;
  garage: string;
  pieces_changees: string;
  prochaine_maintenance_prevue: string;
}

interface MaintenanceFormProps {
  vehicles: Vehicule[];
  selectedVehicleId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MaintenanceForm = ({ vehicles, selectedVehicleId, onSuccess, onCancel }: MaintenanceFormProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<MaintenanceFormData>({
    defaultValues: {
      vehicule_id: selectedVehicleId || '',
      type_maintenance: 'preventive',
      date_maintenance: new Date().toISOString().split('T')[0],
      kilometrage_maintenance: '',
      description: '',
      cout: '',
      garage: '',
      pieces_changees: '',
      prochaine_maintenance_prevue: '',
    }
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: vehiculesService.addMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Maintenance enregistrée avec succès');
      onSuccess();
    },
    onError: (error) => {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement de la maintenance');
    }
  });

  const onSubmit = (data: MaintenanceFormData) => {
    const formattedData = {
      vehicule_id: data.vehicule_id,
      type_maintenance: data.type_maintenance,
      date_maintenance: data.date_maintenance,
      kilometrage_maintenance: data.kilometrage_maintenance ? parseInt(data.kilometrage_maintenance) : null,
      description: data.description || null,
      cout: data.cout ? parseFloat(data.cout) : null,
      garage: data.garage || null,
      pieces_changees: data.pieces_changees ? data.pieces_changees.split(',').map(p => p.trim()).filter(p => p) : null,
      prochaine_maintenance_prevue: data.prochaine_maintenance_prevue || null,
    };

    createMaintenanceMutation.mutate(formattedData);
  };

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicule_id">Véhicule *</Label>
        <Select 
          value={watchedValues.vehicule_id} 
          onValueChange={(value) => setValue('vehicule_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un véhicule" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.numero} - {vehicle.immatriculation} ({vehicle.marque} {vehicle.modele})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.vehicule_id && (
          <p className="text-sm text-red-500">Veuillez sélectionner un véhicule</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type_maintenance">Type de maintenance *</Label>
          <Select 
            value={watchedValues.type_maintenance} 
            onValueChange={(value: 'preventive' | 'curative') => setValue('type_maintenance', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Préventive</SelectItem>
              <SelectItem value="curative">Curative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_maintenance">Date de maintenance *</Label>
          <Input
            id="date_maintenance"
            type="date"
            {...register('date_maintenance', { required: 'La date est requise' })}
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
          <Label htmlFor="cout">Coût (€)</Label>
          <Input
            id="cout"
            type="number"
            step="0.01"
            {...register('cout')}
            placeholder="250.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="garage">Garage / Atelier</Label>
        <Input
          id="garage"
          {...register('garage')}
          placeholder="Garage Central"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description des travaux</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Détails des interventions réalisées..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pieces_changees">Pièces changées (séparées par des virgules)</Label>
        <Input
          id="pieces_changees"
          {...register('pieces_changees')}
          placeholder="Filtre à huile, Plaquettes de frein, Courroie"
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

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || createMaintenanceMutation.isPending}
        >
          {isSubmitting || createMaintenanceMutation.isPending 
            ? 'Enregistrement...' 
            : 'Enregistrer'
          }
        </Button>
      </div>
    </form>
  );
};
