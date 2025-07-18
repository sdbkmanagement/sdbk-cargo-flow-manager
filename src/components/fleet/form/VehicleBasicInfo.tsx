import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, AlertCircle } from 'lucide-react';

interface VehicleBasicInfoProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const VehicleBasicInfo = ({ register, errors, watch, setValue }: VehicleBasicInfoProps) => {
  const typeVehicule = watch('type_vehicule');

  // Auto-generate vehicle numbers based on type
  useEffect(() => {
    if (typeVehicule) {
      const generateNumber = () => {
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        if (typeVehicule === 'tracteur_remorque') {
          setValue('numero_tracteur', `V${randomSuffix}-TRACTEUR`);
          setValue('numero_remorque', `V${randomSuffix}-REMORQUE`);
        } else {
          setValue('numero', `V${randomSuffix}-${typeVehicule.toUpperCase()}`);
        }
      };
      
      generateNumber();
    }
  }, [typeVehicule, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Informations générales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type de véhicule */}
          <div className="space-y-2">
            <Label htmlFor="type_vehicule" className="text-sm font-medium flex items-center gap-1">
              Type de véhicule
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Select 
              value={typeVehicule || 'porteur'} 
              onValueChange={(value) => setValue('type_vehicule', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="porteur">Porteur</SelectItem>
                <SelectItem value="tracteur_remorque">Tracteur + Remorque</SelectItem>
              </SelectContent>
            </Select>
            {errors.type_vehicule && (
              <p className="text-sm text-destructive">{errors.type_vehicule.message?.toString()}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="categorie" className="text-sm font-medium">Catégorie</Label>
            <Select onValueChange={(value) => setValue('categorie', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport_hydrocarbures">Transport Hydrocarbures</SelectItem>
                <SelectItem value="transport_marchandises">Transport Marchandises</SelectItem>
                <SelectItem value="livraison_urbaine">Livraison Urbaine</SelectItem>
                <SelectItem value="longue_distance">Longue Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="statut" className="text-sm font-medium flex items-center gap-1">
              Statut du véhicule
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Select 
              value={watch('statut') || 'disponible'} 
              onValueChange={(value) => setValue('statut', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="en_mission">En mission</SelectItem>
                <SelectItem value="maintenance">En maintenance</SelectItem>
                <SelectItem value="hors_service">Hors service</SelectItem>
                <SelectItem value="validation_requise">Validation requise</SelectItem>
              </SelectContent>
            </Select>
            {errors.statut && (
              <p className="text-sm text-destructive">{errors.statut.message?.toString()}</p>
            )}
          </div>

          {/* Base d'intégration */}
          <div className="space-y-2">
            <Label htmlFor="base" className="text-sm font-medium">Base d'intégration</Label>
            <Select onValueChange={(value) => setValue('base', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abidjan">Abidjan</SelectItem>
                <SelectItem value="bouake">Bouaké</SelectItem>
                <SelectItem value="yamoussoukro">Yamoussoukro</SelectItem>
                <SelectItem value="san_pedro">San Pedro</SelectItem>
                <SelectItem value="korhogo">Korhogo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Numéros automatisés */}
        {typeVehicule === 'tracteur_remorque' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_tracteur" className="text-sm font-medium">Numéro de tracteur (automatisé)</Label>
              <Input
                id="numero_tracteur"
                {...register('numero_tracteur')}
                placeholder="Auto-généré"
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_remorque" className="text-sm font-medium">Numéro de remorque (automatisé)</Label>
              <Input
                id="numero_remorque"
                {...register('numero_remorque')}
                placeholder="Auto-généré"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="numero" className="text-sm font-medium">Numéro du véhicule (automatisé)</Label>
            <Input
              id="numero"
              {...register('numero')}
              placeholder="Auto-généré selon le type"
              readOnly
              className="bg-muted"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};