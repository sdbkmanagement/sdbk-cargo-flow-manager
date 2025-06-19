
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { BasicInfoFields } from './form/BasicInfoFields';
import { TransportStatusFields } from './form/TransportStatusFields';
import { SpecificationsFields } from './form/SpecificationsFields';
import { MaintenanceFields } from './form/MaintenanceFields';

import { vehiculesService } from '@/services/vehicules';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

interface FormData {
  numero: string;
  marque: string;
  modele: string;
  immatriculation: string;
  type_transport: 'hydrocarbures' | 'bauxite';
  statut: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise';
  chauffeur_assigne: string;
  capacite_max: string;
  unite_capacite: string;
  annee_fabrication: string;
  numero_chassis: string;
  consommation_moyenne: string;
  derniere_maintenance: string;
  prochaine_maintenance: string;
}

interface VehicleFormProps {
  vehicule?: Vehicule | null;
  chauffeurs: Chauffeur[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const VehicleForm = ({ vehicule, chauffeurs, onSuccess, onCancel }: VehicleFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      numero: vehicule?.numero || '',
      marque: vehicule?.marque || '',
      modele: vehicule?.modele || '',
      immatriculation: vehicule?.immatriculation || '',
      type_transport: vehicule?.type_transport as 'hydrocarbures' | 'bauxite' || 'hydrocarbures',
      statut: vehicule?.statut as any || 'disponible',
      chauffeur_assigne: vehicule?.chauffeur_assigne || '',
      capacite_max: vehicule?.capacite_max?.toString() || '',
      unite_capacite: vehicule?.unite_capacite || '',
      annee_fabrication: vehicule?.annee_fabrication?.toString() || '',
      numero_chassis: vehicule?.numero_chassis || '',
      consommation_moyenne: vehicule?.consommation_moyenne?.toString() || '',
      derniere_maintenance: vehicule?.derniere_maintenance || '',
      prochaine_maintenance: vehicule?.prochaine_maintenance || '',
    }
  });

  const createMutation = useMutation({
    mutationFn: vehiculesService.create,
    onSuccess: () => {
      toast.success('Véhicule créé avec succès');
      onSuccess();
    },
    onError: (error) => {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création du véhicule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vehiculesService.update(id, data),
    onSuccess: () => {
      toast.success('Véhicule modifié avec succès');
      onSuccess();
    },
    onError: (error) => {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification du véhicule');
    }
  });

  const onSubmit = (data: FormData) => {
    const formattedData = {
      numero: data.numero,
      marque: data.marque,
      modele: data.modele,
      immatriculation: data.immatriculation,
      type_transport: data.type_transport,
      statut: data.statut,
      chauffeur_assigne: data.chauffeur_assigne || null,
      capacite_max: data.capacite_max ? parseFloat(data.capacite_max) : null,
      unite_capacite: data.unite_capacite || null,
      annee_fabrication: data.annee_fabrication ? parseInt(data.annee_fabrication) : null,
      numero_chassis: data.numero_chassis || null,
      consommation_moyenne: data.consommation_moyenne ? parseFloat(data.consommation_moyenne) : null,
      derniere_maintenance: data.derniere_maintenance || null,
      prochaine_maintenance: data.prochaine_maintenance || null,
    };

    if (vehicule) {
      updateMutation.mutate({ id: vehicule.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Renseignez les informations principales du véhicule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BasicInfoFields register={register} errors={errors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transport et statut</CardTitle>
          <CardDescription>
            Définissez le type de transport et l'assignation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransportStatusFields 
            setValue={setValue} 
            watch={watch} 
            chauffeurs={chauffeurs}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spécifications techniques</CardTitle>
          <CardDescription>
            Caractéristiques techniques du véhicule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SpecificationsFields register={register} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>
            Planification et suivi des maintenances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MaintenanceFields register={register} />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
        >
          {isSubmitting || createMutation.isPending || updateMutation.isPending 
            ? 'Enregistrement...' 
            : vehicule ? 'Modifier' : 'Créer'
          }
        </Button>
      </div>
    </form>
  );
};
