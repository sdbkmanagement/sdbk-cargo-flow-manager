
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Truck, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { VehicleBasicInfo } from './form/VehicleBasicInfo';
import { VehicleTracteurInfo } from './form/VehicleTracteurInfo';
import { VehicleRemorqueInfo } from './form/VehicleRemorqueInfo';
import { VehicleDocuments } from './form/VehicleDocuments';
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
    mutationFn: vehiculesService.create,
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
        description: "Impossible de créer le véhicule.",
        variant: "destructive"
      });
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vehiculesService.update(id, data),
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
  const totalSteps = vehicleType === 'tracteur_remorque' ? 4 : 3;

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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Informations du véhicule porteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marque" className="text-sm font-medium flex items-center gap-1">
                      Marque
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </Label>
                    <Input
                      id="marque"
                      {...form.register('marque', { required: 'La marque est requise' })}
                      placeholder="Ex: Mercedes, Volvo"
                    />
                    {form.formState.errors.marque && (
                      <p className="text-sm text-destructive">{form.formState.errors.marque.message?.toString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modele" className="text-sm font-medium flex items-center gap-1">
                      Modèle
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </Label>
                    <Input
                      id="modele"
                      {...form.register('modele', { required: 'Le modèle est requis' })}
                      placeholder="Ex: Actros, FH"
                    />
                    {form.formState.errors.modele && (
                      <p className="text-sm text-destructive">{form.formState.errors.modele.message?.toString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_chassis" className="text-sm font-medium">Numéro de châssis</Label>
                    <Input
                      id="numero_chassis"
                      {...form.register('numero_chassis')}
                      placeholder="Ex: WDB9640261L123456"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_fabrication" className="text-sm font-medium">Date de fabrication</Label>
                    <Input
                      id="date_fabrication"
                      type="date"
                      {...form.register('date_fabrication')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 3: Remorque (uniquement pour tracteur+remorque) */}
          {currentStep === 3 && vehicleType === 'tracteur_remorque' && (
            <VehicleRemorqueInfo 
              register={form.register}
              errors={form.formState.errors}
            />
          )}

          {/* Étape 3/4: Documents */}
          {((currentStep === 3 && vehicleType === 'porteur') || 
            (currentStep === 4 && vehicleType === 'tracteur_remorque')) && (
            <VehicleDocuments 
              register={form.register}
              errors={form.formState.errors}
              watch={form.watch}
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
