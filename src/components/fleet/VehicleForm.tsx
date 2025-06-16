
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import { supabase } from '@/integrations/supabase/client';
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

  const watchedValues = watch();

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro du véhicule *</Label>
              <Input
                id="numero"
                {...register('numero', { required: 'Le numéro est requis' })}
                placeholder="Ex: VH001"
              />
              {errors.numero && (
                <p className="text-sm text-red-500">{errors.numero.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="immatriculation">Immatriculation *</Label>
              <Input
                id="immatriculation"
                {...register('immatriculation', { required: 'L\'immatriculation est requise' })}
                placeholder="Ex: AB-123-CD"
              />
              {errors.immatriculation && (
                <p className="text-sm text-red-500">{errors.immatriculation.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                {...register('marque', { required: 'La marque est requise' })}
                placeholder="Ex: Mercedes"
              />
              {errors.marque && (
                <p className="text-sm text-red-500">{errors.marque.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modele">Modèle *</Label>
              <Input
                id="modele"
                {...register('modele', { required: 'Le modèle est requis' })}
                placeholder="Ex: Actros"
              />
              {errors.modele && (
                <p className="text-sm text-red-500">{errors.modele.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_transport">Type de transport *</Label>
              <Select 
                value={watchedValues.type_transport} 
                onValueChange={(value: 'hydrocarbures' | 'bauxite') => setValue('type_transport', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                  <SelectItem value="bauxite">Bauxite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select 
                value={watchedValues.statut} 
                onValueChange={(value: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise') => setValue('statut', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="validation_requise">Validation requise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chauffeur_assigne">Chauffeur assigné</Label>
            <Select 
              value={watchedValues.chauffeur_assigne} 
              onValueChange={(value) => setValue('chauffeur_assigne', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chauffeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun chauffeur assigné</SelectItem>
                {chauffeurs.map((chauffeur) => (
                  <SelectItem key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacite_max">Capacité max</Label>
              <Input
                id="capacite_max"
                type="number"
                step="0.01"
                {...register('capacite_max')}
                placeholder="25000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unite_capacite">Unité</Label>
              <Input
                id="unite_capacite"
                {...register('unite_capacite')}
                placeholder="L, m³, tonnes..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annee_fabrication">Année</Label>
              <Input
                id="annee_fabrication"
                type="number"
                {...register('annee_fabrication')}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_chassis">Numéro de châssis</Label>
              <Input
                id="numero_chassis"
                {...register('numero_chassis')}
                placeholder="VIN123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consommation_moyenne">Consommation (L/100km)</Label>
              <Input
                id="consommation_moyenne"
                type="number"
                step="0.1"
                {...register('consommation_moyenne')}
                placeholder="35.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="derniere_maintenance">Dernière maintenance</Label>
              <Input
                id="derniere_maintenance"
                type="date"
                {...register('derniere_maintenance')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prochaine_maintenance">Prochaine maintenance</Label>
              <Input
                id="prochaine_maintenance"
                type="date"
                {...register('prochaine_maintenance')}
              />
            </div>
          </div>

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
