
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BasicInfoFields } from './form/BasicInfoFields';
import { SpecificationsFields } from './form/SpecificationsFields';
import { OperationalFields } from './form/OperationalFields';
import { MaintenanceFields } from './form/MaintenanceFields';
import { TransportStatusFields } from './form/TransportStatusFields';
import { TracteurFields } from './form/TracteurFields';
import { RemorqueFields } from './form/RemorqueFields';

import { vehiculesService } from '@/services/vehicules';

interface VehicleFormProps {
  vehicule?: any;
  onSuccess?: () => void;
}

export const VehicleForm = ({ vehicule, onSuccess }: VehicleFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast: showToast } = toast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      numero: vehicule?.numero || '',
      type_vehicule: vehicule?.type_vehicule || 'porteur',
      marque: vehicule?.marque || '',
      modele: vehicule?.modele || '',
      immatriculation: vehicule?.immatriculation || '',
      numero_chassis: vehicule?.numero_chassis || '',
      annee_fabrication: vehicule?.annee_fabrication || new Date().getFullYear(),
      type_transport: vehicule?.type_transport || 'hydrocarbures',
      capacite_max: vehicule?.capacite_max || 0,
      unite_capacite: vehicule?.unite_capacite || 'litres',
      consommation_moyenne: vehicule?.consommation_moyenne || 0,
      kilometrage: vehicule?.kilometrage || 0,
      statut: vehicule?.statut || 'disponible',
      base: vehicule?.base || '',
      integration: vehicule?.integration || '',
      // Tracteur fields
      tracteur_immatriculation: vehicule?.tracteur_immatriculation || '',
      tracteur_marque: vehicule?.tracteur_marque || '',
      tracteur_modele: vehicule?.tracteur_modele || '',
      tracteur_configuration: vehicule?.tracteur_configuration || '',
      tracteur_numero_chassis: vehicule?.tracteur_numero_chassis || '',
      tracteur_annee_fabrication: vehicule?.tracteur_annee_fabrication || null,
      tracteur_date_mise_circulation: vehicule?.tracteur_date_mise_circulation || '',
      // Remorque fields
      remorque_immatriculation: vehicule?.remorque_immatriculation || '',
      remorque_marque: vehicule?.remorque_marque || '',
      remorque_modele: vehicule?.remorque_modele || '',
      remorque_configuration: vehicule?.remorque_configuration || '',
      remorque_numero_chassis: vehicule?.remorque_numero_chassis || '',
      remorque_volume_litres: vehicule?.remorque_volume_litres || null,
      remorque_annee_fabrication: vehicule?.remorque_annee_fabrication || null,
      remorque_date_mise_circulation: vehicule?.remorque_date_mise_circulation || '',
      // Maintenance fields
      derniere_maintenance: vehicule?.derniere_maintenance || '',
      prochaine_maintenance: vehicule?.prochaine_maintenance || '',
    }
  });

  const createVehicleMutation = useMutation({
    mutationFn: vehiculesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      showToast({
        title: "Véhicule créé",
        description: "Le véhicule a été ajouté avec succès.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erreur création véhicule:', error);
      showToast({
        title: "Erreur",
        description: "Impossible de créer le véhicule.",
        variant: "destructive"
      });
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vehiculesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      showToast({
        title: "Véhicule modifié",
        description: "Les informations ont été mises à jour.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erreur modification véhicule:', error);
      showToast({
        title: "Erreur",
        description: "Impossible de modifier le véhicule.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: any) => {
    try {
      console.log('Données du formulaire:', data);
      
      if (vehicule?.id) {
        updateVehicleMutation.mutate({ id: vehicule.id, data });
      } else {
        createVehicleMutation.mutate(data);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const totalSteps = 5;
  const isLastStep = currentStep === totalSteps;
  const vehicleType = form.watch('type_vehicule');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {vehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}
        </h2>
        <div className="text-sm text-muted-foreground">
          Étape {currentStep} sur {totalSteps}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {currentStep === 1 && <BasicInfoFields form={form} />}
          {currentStep === 2 && <SpecificationsFields form={form} />}
          {currentStep === 3 && vehicleType === 'tracteur_remorque' && <TracteurFields form={form} />}
          {currentStep === 3 && vehicleType === 'tracteur_remorque' && <RemorqueFields form={form} />}
          {currentStep === 3 && vehicleType === 'porteur' && <OperationalFields form={form} />}
          {currentStep === 4 && <MaintenanceFields form={form} />}
          {currentStep === 5 && <TransportStatusFields form={form} />}

          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>

            {!isLastStep ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {createVehicleMutation.isPending || updateVehicleMutation.isPending
                  ? 'Sauvegarde...' 
                  : vehicule ? 'Modifier' : 'Créer'
                }
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
