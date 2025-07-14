
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BasicInfoFields } from './form/BasicInfoFields';
import { SpecificationsFields } from './form/SpecificationsFields';
import { TransportStatusFields } from './form/TransportStatusFields';
import { MaintenanceFields } from './form/MaintenanceFields';
import { DocumentUploadSection } from './form/DocumentUploadSection';
import { OperationalFields } from './form/OperationalFields';
import { TracteurFields } from './form/TracteurFields';
import { RemorqueFields } from './form/RemorqueFields';
import vehiculesService, { type Vehicule } from '@/services/vehicules';
import { chauffeursService } from '@/services/chauffeurs';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type VehiculeInsert = Database['public']['Tables']['vehicules']['Insert'];

interface FormData {
  // Champs de base
  numero: string;
  type_vehicule: 'porteur' | 'tracteur_remorque';
  type_transport: 'hydrocarbures' | 'bauxite';
  statut: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise';
  base: string;
  integration: string;
  
  // Champs pour véhicule porteur
  marque: string;
  modele: string;
  immatriculation: string;
  chauffeur_assigne: string;
  capacite_max: string;
  unite_capacite: string;
  type_carburant: string;
  date_mise_service: string;
  kilometrage: string;
  annee_fabrication: string;
  numero_chassis: string;
  consommation_moyenne: string;
  derniere_maintenance: string;
  prochaine_maintenance: string;
  
  // Champs pour tracteur
  tracteur_immatriculation: string;
  tracteur_marque: string;
  tracteur_modele: string;
  tracteur_configuration: string;
  tracteur_numero_chassis: string;
  tracteur_annee_fabrication: string;
  tracteur_date_mise_circulation: string;
  
  // Champs pour remorque
  remorque_immatriculation: string;
  remorque_volume_litres: string;
  remorque_marque: string;
  remorque_modele: string;
  remorque_configuration: string;
  remorque_numero_chassis: string;
  remorque_annee_fabrication: string;
  remorque_date_mise_circulation: string;
}

interface VehicleFormProps {
  vehicle?: Vehicule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleForm = ({ vehicle, onClose, onSuccess }: VehicleFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      type_vehicule: 'porteur',
      statut: 'disponible',
      type_transport: 'hydrocarbures',
    }
  });

  // Récupérer la liste des chauffeurs
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  // Charger les données du véhicule pour l'édition
  useEffect(() => {
    if (vehicle) {
      Object.keys(vehicle).forEach((key) => {
        const value = vehicle[key as keyof Vehicule];
        if (value !== null && value !== undefined) {
          setValue(key as keyof FormData, String(value));
        }
      });
    }
  }, [vehicle, setValue]);

  // Mutation pour créer/modifier un véhicule
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const vehicleData: VehiculeInsert = {
        numero: data.numero,
        type_vehicule: data.type_vehicule,
        type_transport: data.type_transport,
        statut: data.statut || 'disponible', // Ensure statut is always provided
        base: data.base || null,
        integration: data.integration || null,
        
        // Champs pour véhicule porteur
        marque: data.type_vehicule === 'porteur' ? data.marque : null,
        modele: data.type_vehicule === 'porteur' ? data.modele : null,
        immatriculation: data.type_vehicule === 'porteur' ? data.immatriculation : null,
        chauffeur_assigne: data.chauffeur_assigne || null,
        capacite_max: data.capacite_max ? parseFloat(data.capacite_max) : null,
        unite_capacite: data.unite_capacite || null,
        kilometrage: data.kilometrage ? parseInt(data.kilometrage) : 0,
        annee_fabrication: data.annee_fabrication ? parseInt(data.annee_fabrication) : null,
        numero_chassis: data.numero_chassis || null,
        consommation_moyenne: data.consommation_moyenne ? parseFloat(data.consommation_moyenne) : null,
        derniere_maintenance: data.derniere_maintenance || null,
        prochaine_maintenance: data.prochaine_maintenance || null,
        
        // Champs pour tracteur
        tracteur_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_immatriculation : null,
        tracteur_marque: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_marque : null,
        tracteur_modele: data.type_vehicule === 'tracteur_remorque' ? data.tracteur_modele : null,
        tracteur_configuration: data.tracteur_configuration || null,
        tracteur_numero_chassis: data.tracteur_numero_chassis || null,
        tracteur_annee_fabrication: data.tracteur_annee_fabrication ? parseInt(data.tracteur_annee_fabrication) : null,
        tracteur_date_mise_circulation: data.tracteur_date_mise_circulation || null,
        
        // Champs pour remorque
        remorque_immatriculation: data.type_vehicule === 'tracteur_remorque' ? data.remorque_immatriculation : null,
        remorque_volume_litres: data.remorque_volume_litres ? parseFloat(data.remorque_volume_litres) : null,
        remorque_marque: data.type_vehicule === 'tracteur_remorque' ? data.remorque_marque : null,
        remorque_modele: data.type_vehicule === 'tracteur_remorque' ? data.remorque_modele : null,
        remorque_configuration: data.remorque_configuration || null,
        remorque_numero_chassis: data.remorque_numero_chassis || null,
        remorque_annee_fabrication: data.remorque_annee_fabrication ? parseInt(data.remorque_annee_fabrication) : null,
        remorque_date_mise_circulation: data.remorque_date_mise_circulation || null,
      };

      if (vehicle) {
        return vehiculesService.update(vehicle.id, vehicleData);
      } else {
        return vehiculesService.create(vehicleData);
      }
    },
    onSuccess: () => {
      toast({
        title: vehicle ? 'Véhicule modifié' : 'Véhicule créé',
        description: `Le véhicule a été ${vehicle ? 'modifié' : 'créé'} avec succès.`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Impossible de ${vehicle ? 'modifier' : 'créer'} le véhicule.`,
        variant: 'destructive',
      });
      console.error('Erreur:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const typeVehicule = watch('type_vehicule');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informations de base</TabsTrigger>
              <TabsTrigger value="specs">Spécifications</TabsTrigger>
              <TabsTrigger value="status">Transport & Statut</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations de base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <BasicInfoFields register={register} errors={errors} watch={watch} setValue={setValue} />
                  </CardContent>
                </Card>

                {/* Sections dynamiques selon le type de véhicule */}
                {typeVehicule === 'tracteur_remorque' && (
                  <div className="space-y-6">
                    <TracteurFields register={register} errors={errors} />
                    <RemorqueFields register={register} errors={errors} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications techniques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SpecificationsFields register={register} />
                  <OperationalFields register={register} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transport et statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TransportStatusFields 
                    setValue={setValue} 
                    watch={watch} 
                    chauffeurs={chauffeurs} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MaintenanceFields register={register} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {vehicle && (
            <DocumentUploadSection vehicleId={vehicle.id} />
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {mutation.isPending ? 'Enregistrement...' : (vehicle ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
