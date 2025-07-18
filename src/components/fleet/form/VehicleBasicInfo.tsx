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

  // Auto-generate vehicle numbers with sequential format V001, V002, etc.
  useEffect(() => {
    if (typeVehicule) {
      const generateNumber = () => {
        // Generate sequential number (in real app, this would come from backend)
        const nextNumber = Math.floor(Math.random() * 999) + 1;
        const formattedNumber = `V${nextNumber.toString().padStart(3, '0')}`;
        setValue('numero', formattedNumber);
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

          {/* Base d'intégration */}
          <div className="space-y-2">
            <Label htmlFor="base" className="text-sm font-medium">Base</Label>
            <Select onValueChange={(value) => setValue('base', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conakry">Conakry</SelectItem>
                <SelectItem value="kamsar">Kamsar</SelectItem>
                <SelectItem value="nzerekore">N'Zérékoré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plaques d'immatriculation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typeVehicule === 'tracteur_remorque' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="tracteur_immatriculation" className="text-sm font-medium flex items-center gap-1">
                  Plaque d'immatriculation tracteur
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </Label>
                <Input
                  id="tracteur_immatriculation"
                  {...register('tracteur_immatriculation', { required: 'La plaque du tracteur est requise' })}
                  placeholder="Ex: AB-123-CD"
                />
                {errors.tracteur_immatriculation && (
                  <p className="text-sm text-destructive">{errors.tracteur_immatriculation.message?.toString()}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="remorque_immatriculation" className="text-sm font-medium flex items-center gap-1">
                  Plaque d'immatriculation remorque
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </Label>
                <Input
                  id="remorque_immatriculation"
                  {...register('remorque_immatriculation', { required: 'La plaque de la remorque est requise' })}
                  placeholder="Ex: EF-456-GH"
                />
                {errors.remorque_immatriculation && (
                  <p className="text-sm text-destructive">{errors.remorque_immatriculation.message?.toString()}</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="immatriculation" className="text-sm font-medium flex items-center gap-1">
                Plaque d'immatriculation
                <AlertCircle className="h-4 w-4 text-destructive" />
              </Label>
              <Input
                id="immatriculation"
                {...register('immatriculation', { required: 'La plaque d\'immatriculation est requise' })}
                placeholder="Ex: AB-123-CD"
              />
              {errors.immatriculation && (
                <p className="text-sm text-destructive">{errors.immatriculation.message?.toString()}</p>
              )}
            </div>
          )}
        </div>

        {/* Numéro automatisé */}
        <div className="space-y-2">
          <Label htmlFor="numero" className="text-sm font-medium">Numéro du véhicule (automatisé)</Label>
          <Input
            id="numero"
            {...register('numero')}
            placeholder="Format: V001, V002, V003..."
            readOnly
            className="bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  );
};