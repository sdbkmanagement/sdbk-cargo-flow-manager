
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { VehicleBasicInfo } from './form/VehicleBasicInfo';
import { VehicleTracteurInfo } from './form/VehicleTracteurInfo';
import { VehicleRemorqueInfo } from './form/VehicleRemorqueInfo';
import { VehicleStepIndicator } from './form/VehicleStepIndicator';
import { FormNavigation } from '../drivers/form/FormNavigation';

import { vehiculesService } from '@/services/vehicules';

interface VehicleFormProps {
  vehicule?: any;
  onSuccess?: () => void;
}

export const VehicleForm = ({ vehicule, onSuccess }: VehicleFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      // Informations générales
      numero: vehicule?.numero || '',
      type_vehicule: vehicule?.type_vehicule || 'porteur',
      type_transport: vehicule?.type_transport || 'hydrocarbures',
      base: vehicule?.base || '',
      
      // Plaques d'immatriculation
      immatriculation: vehicule?.immatriculation || '',
      tracteur_immatriculation: vehicule?.tracteur_immatriculation || '',
      remorque_immatriculation: vehicule?.remorque_immatriculation || '',
      
      // Tracteur fields
      tracteur_marque: vehicule?.tracteur_marque || '',
      tracteur_modele: vehicule?.tracteur_modele || '',
      tracteur_configuration: vehicule?.tracteur_configuration || '',
      tracteur_numero_chassis: vehicule?.tracteur_numero_chassis || '',
      tracteur_date_fabrication: vehicule?.tracteur_date_fabrication || '',
      tracteur_date_mise_circulation: vehicule?.tracteur_date_mise_circulation || '',
      
      // Remorque fields
      remorque_volume_litres: vehicule?.remorque_volume_litres || null,
      remorque_marque: vehicule?.remorque_marque || '',
      remorque_modele: vehicule?.remorque_modele || '',
      remorque_configuration: vehicule?.remorque_configuration || '',
      remorque_numero_chassis: vehicule?.remorque_numero_chassis || '',
      remorque_date_fabrication: vehicule?.remorque_date_fabrication || '',
      remorque_date_mise_circulation: vehicule?.remorque_date_mise_circulation || '',
      
      // Pour les porteurs
      marque: vehicule?.marque || '',
      modele: vehicule?.modele || '',
      numero_chassis: vehicule?.numero_chassis || '',
      date_fabrication: vehicule?.date_fabrication || '',
    }
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Données envoyées à la création:', data);
      
      // Nettoyer les données pour s'assurer qu'elles correspondent à la structure de la DB
      const cleanedData = {
        numero: data.numero,
        type_vehicule: data.type_vehicule || 'porteur',
        type_transport: data.type_transport || 'hydrocarbures',
        statut: 'validation_requise', // Valeur par défaut
        base: data.base,
        
        // Plaques d'immatriculation
        immatriculation: data.type_vehicule === 'porteur' ? data.immatriculation : null,
        tracteur_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_immatriculation : null,
        remorque_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.remorque_immatriculation : null,
        
        // Informations tracteur
        tracteur_marque: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_marque : null,
        tracteur_modele: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_modele : null,
        tracteur_configuration: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_configuration : null,
        tracteur_numero_chassis: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_numero_chassis : null,
        tracteur_date_fabrication: data.type_vehicule === 'tracteur_remorque' && data.tracteur_date_fabrication ? data.tracteur_date_fabrication : null,
        tracteur_date_mise_circulation: data.type_vehicule === 'tracteur_remorque' && data.tracteur_date_mise_circulation ? data.tracteur_date_mise_circulation : null,
        
        // Informations remorque
        remorque_volume_litres: data.type_vehicule === 'tracteur_remorque' && data.remorque_volume_litres ? Number(data.remorque_volume_litres) : null,
        remorque_marque: data.type_vehicule === 'tracteur_remorque' ? data.remorque_marque : null,
        remorque_modele: data.type_vehicule === 'tracteur_remorque' ? data.remorque_modele : null,
        remorque_configuration: data.type_vehicule === 'tracteur_remorque' ? data.remorque_configuration : null,
        remorque_numero_chassis: data.type_vehicule === 'tracteur_remorque' ? data.remorque_numero_chassis : null,
        remorque_date_fabrication: data.type_vehicule === 'tracteur_remorque' && data.remorque_date_fabrication ? data.remorque_date_fabrication : null,
        remorque_date_mise_circulation: data.type_vehicule === 'tracteur_remorque' && data.remorque_date_mise_circulation ? data.remorque_date_mise_circulation : null,
        
        // Informations porteur
        marque: data.type_vehicule === 'porteur' ? data.marque : null,
        modele: data.type_vehicule === 'porteur' ? data.modele : null,
        numero_chassis: data.type_vehicule === 'porteur' ? data.numero_chassis : null,
        date_fabrication: data.type_vehicule === 'porteur' && data.date_fabrication ? data.date_fabrication : null,
      };

      const vehicleResult = await vehiculesService.create(cleanedData);
      return vehicleResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      toast({
        title: "Véhicule créé",
        description: "Le véhicule a été ajouté avec succès.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erreur création véhicule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le véhicule. Vérifiez les informations saisies.",
        variant: "destructive"
      });
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Nettoyer les données pour la mise à jour
      const cleanedData = {
        numero: data.numero,
        type_vehicule: data.type_vehicule || 'porteur',
        type_transport: data.type_transport || 'hydrocarbures',
        base: data.base,
        
        // Plaques d'immatriculation
        immatriculation: data.type_vehicule === 'porteur' ? data.immatriculation : null,
        tracteur_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_immatriculation : null,
        remorque_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.remorque_immatriculation : null,
        
        // Informations tracteur
        tracteur_marque: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_marque : null,
        tracteur_modele: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_modele : null,
        tracteur_configuration: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_configuration : null,
        tracteur_numero_chassis: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_numero_chassis : null,
        tracteur_date_fabrication: data.type_vehicule === 'tracteur_remorque' && data.tracteur_date_fabrication ? data.tracteur_date_fabrication : null,
        tracteur_date_mise_circulation: data.type_vehicule === 'tracteur_remorque' && data.tracteur_date_mise_circulation ? data.tracteur_date_mise_circulation : null,
        
        // Informations remorque
        remorque_volume_litres: data.type_vehicule === 'tracteur_remorque' && data.remorque_volume_litres ? Number(data.remorque_volume_litres) : null,
        remorque_marque: data.type_vehicule === 'tracteur_remorque' ? data.remorque_marque : null,
        remorque_modele: data.type_vehicule === 'tracteur_remorque' ? data.remorque_modele : null,
        remorque_configuration: data.type_vehicule === 'tracteur_remorque' ? data.remorque_configuration : null,
        remorque_numero_chassis: data.type_vehicule === 'tracteur_remorque' ? data.remorque_numero_chassis : null,
        remorque_date_fabrication: data.type_vehicule === 'tracteur_remorque' && data.remorque_date_fabrication ? data.remorque_date_fabrication : null,
        remorque_date_mise_circulation: data.type_vehicule === 'tracteur_remorque' && data.remorque_date_mise_circulation ? data.remorque_date_mise_circulation : null,
        
        // Informations porteur
        marque: data.type_vehicule === 'porteur' ? data.marque : null,
        modele: data.type_vehicule === 'porteur' ? data.modele : null,
        numero_chassis: data.type_vehicule === 'porteur' ? data.numero_chassis : null,
        date_fabrication: data.type_vehicule === 'porteur' && data.date_fabrication ? data.date_fabrication : null,
      };

      const result = await vehiculesService.update(id, cleanedData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      toast({
        title: "Véhicule modifié",
        description: "Les informations ont été mises à jour.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erreur modification véhicule:', error);
      toast({
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

  const vehicleType = form.watch('type_vehicule');
  const totalSteps = vehicleType === 'tracteur_remorque' ? 3 : 2;

  const handleNext = () => {
    setCurrentStep(Math.min(totalSteps, currentStep + 1));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleSubmitForm = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          {vehicule ? 'Modifier le véhicule' : 'Créer un nouveau véhicule'}
        </h2>
        <p className="text-muted-foreground">
          Formulaire structuré pour l'enregistrement complet des informations véhicule
        </p>
      </div>

      <VehicleStepIndicator 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        vehicleType={vehicleType}
      />

      <Form {...form}>
        <form className="space-y-6">
          {/* Étape 1: Informations générales */}
          {currentStep === 1 && (
            <VehicleBasicInfo 
              register={form.register}
              errors={form.formState.errors}
              watch={form.watch}
              setValue={form.setValue}
            />
          )}

          {/* Étape 2: Informations véhicule */}
          {currentStep === 2 && vehicleType === 'tracteur_remorque' && (
            <VehicleTracteurInfo 
              register={form.register}
              errors={form.formState.errors}
            />
          )}

          {currentStep === 2 && vehicleType === 'porteur' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    Marque
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...form.register('marque', { required: 'La marque est requise' })}
                    placeholder="Ex: Mercedes, Volvo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {form.formState.errors.marque && (
                    <p className="text-sm text-destructive">{form.formState.errors.marque.message?.toString()}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    Modèle
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...form.register('modele', { required: 'Le modèle est requis' })}
                    placeholder="Ex: Actros, FH"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {form.formState.errors.modele && (
                    <p className="text-sm text-destructive">{form.formState.errors.modele.message?.toString()}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Numéro de châssis</label>
                  <input
                    {...form.register('numero_chassis')}
                    placeholder="Ex: WDB9640261L123456"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de fabrication</label>
                  <input
                    type="date"
                    {...form.register('date_fabrication')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Remorque (uniquement pour tracteur+remorque) */}
          {currentStep === 3 && vehicleType === 'tracteur_remorque' && (
            <VehicleRemorqueInfo 
              register={form.register}
              errors={form.formState.errors}
            />
          )}

          <FormNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmitForm}
            onCancel={onSuccess}
            isSubmitting={createVehicleMutation.isPending || updateVehicleMutation.isPending}
          />
        </form>
      </Form>
    </div>
  );
};
