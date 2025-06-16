
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import { supabase } from '@/integrations/supabase/client';
import { BasicInfoFields } from './form/BasicInfoFields';
import { TransportStatusFields } from './form/TransportStatusFields';
import { SpecificationsFields } from './form/SpecificationsFields';
import { MaintenanceFields } from './form/MaintenanceFields';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicule?: Vehicule | null;
}

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

export const VehicleForm = ({ isOpen, onClose, onSuccess, vehicule }: VehicleFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      numero: '',
      marque: '',
      modele: '',
      immatriculation: '',
      type_transport: 'hydrocarbures',
      statut: 'disponible',
      chauffeur_assigne: '',
      capacite_max: '',
      unite_capacite: '',
      annee_fabrication: '',
      numero_chassis: '',
      consommation_moyenne: '',
      derniere_maintenance: '',
      prochaine_maintenance: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadChauffeurs();
      if (vehicule) {
        console.log('Remplissage du formulaire avec:', vehicule);
        reset({
          numero: vehicule.numero || '',
          marque: vehicule.marque || '',
          modele: vehicule.modele || '',
          immatriculation: vehicule.immatriculation || '',
          type_transport: (vehicule.type_transport as 'hydrocarbures' | 'bauxite') || 'hydrocarbures',
          statut: (vehicule.statut as 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise') || 'disponible',
          chauffeur_assigne: vehicule.chauffeur_assigne || '',
          capacite_max: vehicule.capacite_max?.toString() || '',
          unite_capacite: vehicule.unite_capacite || '',
          annee_fabrication: vehicule.annee_fabrication?.toString() || '',
          numero_chassis: vehicule.numero_chassis || '',
          consommation_moyenne: vehicule.consommation_moyenne?.toString() || '',
          derniere_maintenance: vehicule.derniere_maintenance || '',
          prochaine_maintenance: vehicule.prochaine_maintenance || ''
        });
      } else {
        console.log('Réinitialisation du formulaire pour nouveau véhicule');
        reset({
          numero: '',
          marque: '',
          modele: '',
          immatriculation: '',
          type_transport: 'hydrocarbures',
          statut: 'disponible',
          chauffeur_assigne: '',
          capacite_max: '',
          unite_capacite: '',
          annee_fabrication: '',
          numero_chassis: '',
          consommation_moyenne: '',
          derniere_maintenance: '',
          prochaine_maintenance: ''
        });
      }
    }
  }, [isOpen, vehicule, reset]);

  const loadChauffeurs = async () => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('statut', 'actif');
      
      if (error) {
        console.error('Erreur lors du chargement des chauffeurs:', error);
        setChauffeurs([]);
        return;
      }
      setChauffeurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
      setChauffeurs([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log('Soumission du formulaire avec:', data);
    setLoading(true);

    try {
      const dataToSubmit = {
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
        prochaine_maintenance: data.prochaine_maintenance || null
      };

      console.log('Données préparées pour soumission:', dataToSubmit);

      if (vehicule) {
        await vehiculesService.update(vehicule.id, dataToSubmit);
        toast({
          title: "Véhicule modifié",
          description: "Le véhicule a été modifié avec succès",
        });
      } else {
        await vehiculesService.create(dataToSubmit);
        toast({
          title: "Véhicule créé",
          description: "Le véhicule a été créé avec succès",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Fermeture du formulaire');
    reset();
    onClose();
  };

  console.log('Rendu du formulaire - isOpen:', isOpen, 'vehicule:', vehicule);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {vehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}
          </DialogTitle>
          <DialogDescription>
            {vehicule ? 'Modifiez les informations du véhicule' : 'Ajoutez un nouveau véhicule à la flotte'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <BasicInfoFields register={register} errors={errors} />
          
          <TransportStatusFields 
            setValue={setValue} 
            watch={watch} 
            chauffeurs={chauffeurs} 
          />

          <SpecificationsFields register={register} />

          <MaintenanceFields register={register} />

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : vehicule ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
