
import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicInfoFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const BasicInfoFields = ({ register, errors, watch, setValue }: BasicInfoFieldsProps) => {
  const typeVehicule = watch('type_vehicule');

  // Auto-generate vehicle number based on type
  useEffect(() => {
    if (typeVehicule) {
      const generateNumber = async () => {
        try {
          // Get the latest vehicle number for this type
          const prefix = typeVehicule === 'porteur' ? 'P' : 'TR';
          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          const autoNumber = `${prefix}${randomSuffix}-${new Date().getFullYear()}`;
          setValue('numero', autoNumber);
        } catch (error) {
          console.error('Erreur génération numéro:', error);
        }
      };
      
      generateNumber();
    }
  }, [typeVehicule, setValue]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="numero">Numéro du véhicule *</Label>
        <Input
          id="numero"
          {...register('numero', { required: 'Le numéro est requis' })}
          placeholder="Auto-généré selon le type"
          readOnly
          className="bg-gray-50"
        />
        {errors.numero && (
          <p className="text-sm text-red-600 mt-1">{errors.numero.message?.toString()}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type_vehicule">Type de véhicule *</Label>
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
          <p className="text-sm text-red-600 mt-1">{errors.type_vehicule.message?.toString()}</p>
        )}
      </div>

      {typeVehicule === 'porteur' && (
        <>
          <div>
            <Label htmlFor="marque">Marque *</Label>
            <Input
              id="marque"
              {...register('marque', { required: 'La marque est requise' })}
              placeholder="Ex: Mercedes, Volvo..."
            />
            {errors.marque && (
              <p className="text-sm text-red-600 mt-1">{errors.marque.message?.toString()}</p>
            )}
          </div>

          <div>
            <Label htmlFor="modele">Modèle *</Label>
            <Input
              id="modele"
              {...register('modele', { required: 'Le modèle est requis' })}
              placeholder="Ex: Actros, FH..."
            />
            {errors.modele && (
              <p className="text-sm text-red-600 mt-1">{errors.modele.message?.toString()}</p>
            )}
          </div>

          <div>
            <Label htmlFor="immatriculation">Immatriculation *</Label>
            <Input
              id="immatriculation"
              {...register('immatriculation', { required: 'L\'immatriculation est requise' })}
              placeholder="Ex: AB-123-CD"
            />
            {errors.immatriculation && (
              <p className="text-sm text-red-600 mt-1">{errors.immatriculation.message?.toString()}</p>
            )}
          </div>
        </>
      )}

      <div>
        <Label htmlFor="base">Base d'affectation</Label>
        <Input
          id="base"
          {...register('base')}
          placeholder="Ex: Abidjan, Yamoussoukro..."
        />
      </div>

      <div>
        <Label htmlFor="integration">Intégration</Label>
        <Input
          id="integration"
          {...register('integration')}
          placeholder="Système d'intégration"
        />
      </div>
    </div>
  );
};
