
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BasicInfoFields } from './form/BasicInfoFields';
import { SpecificationsFields } from './form/SpecificationsFields';
import { TransportStatusFields } from './form/TransportStatusFields';
import { MaintenanceFields } from './form/MaintenanceFields';
import { DocumentUploadSection } from './form/DocumentUploadSection';
import { vehiculesService } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type VehiculeInsert = Database['public']['Tables']['vehicules']['Insert'];

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
  type_carburant: string;
  date_mise_service: string;
  kilometrage: string;
  annee_fabrication: string;
  numero_chassis: string;
  consommation_moyenne: string;
  derniere_maintenance: string;
  prochaine_maintenance: string;
}

interface VehicleFormProps {
  vehicle?: Vehicule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleForm = ({ vehicle, onClose, onSuccess }: VehicleFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    defaultValues: {
      statut: 'disponible',
      type_transport: 'hydrocarbures',
    }
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
        marque: data.marque,
        modele: data.modele,
        immatriculation: data.immatriculation,
        type_transport: data.type_transport,
        statut: data.statut,
        chauffeur_assigne: data.chauffeur_assigne || null,
        capacite_max: data.capacite_max ? parseFloat(data.capacite_max) : null,
        unite_capacite: data.unite_capacite || null,
        type_carburant: data.type_carburant || null,
        date_mise_service: data.date_mise_service || null,
        kilometrage: data.kilometrage ? parseInt(data.kilometrage) : 0,
        annee_fabrication: data.annee_fabrication ? parseInt(data.annee_fabrication) : null,
        numero_chassis: data.numero_chassis || null,
        consommation_moyenne: data.consommation_moyenne ? parseFloat(data.consommation_moyenne) : null,
        derniere_maintenance: data.derniere_maintenance || null,
        prochaine_maintenance: data.prochaine_maintenance || null,
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BasicInfoFields register={register} errors={errors} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications techniques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SpecificationsFields register={register} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="type_carburant" className="block text-sm font-medium text-gray-700">
                        Type de carburant
                      </label>
                      <input
                        id="type_carburant"
                        {...register('type_carburant')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Diesel, Essence..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="date_mise_service" className="block text-sm font-medium text-gray-700">
                        Date de mise en service
                      </label>
                      <input
                        id="date_mise_service"
                        type="date"
                        {...register('date_mise_service')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="kilometrage" className="block text-sm font-medium text-gray-700">
                      Kilométrage actuel
                    </label>
                    <input
                      id="kilometrage"
                      type="number"
                      {...register('kilometrage')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="150000"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transport et statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TransportStatusFields register={register} />
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
