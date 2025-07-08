
import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleTypeField } from './VehicleTypeField';
import { GlobalVehicleFields } from './GlobalVehicleFields';

interface BasicInfoFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: any;
}

export const BasicInfoFields = ({ register, errors, watch, setValue }: BasicInfoFieldsProps) => {
  const typeVehicule = watch('type_vehicule');

  return (
    <>
      {/* Type de véhicule */}
      <VehicleTypeField register={register} watch={watch} setValue={setValue} />
      
      {/* Numéro du véhicule */}
      <div className="space-y-2">
        <Label htmlFor="numero">Numéro du véhicule *</Label>
        <Input
          id="numero"
          {...register('numero', { required: 'Le numéro est requis' })}
          placeholder="Ex: VH001"
        />
        {errors.numero && (
          <p className="text-sm text-red-500">{String(errors.numero.message)}</p>
        )}
      </div>

      {/* Champs pour véhicule porteur */}
      {typeVehicule === 'porteur' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="immatriculation">Immatriculation *</Label>
              <Input
                id="immatriculation"
                {...register('immatriculation', { required: 'L\'immatriculation est requise' })}
                placeholder="Ex: AB-123-CD"
              />
              {errors.immatriculation && (
                <p className="text-sm text-red-500">{String(errors.immatriculation.message)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                {...register('marque', { required: 'La marque est requise' })}
                placeholder="Ex: Mercedes"
              />
              {errors.marque && (
                <p className="text-sm text-red-500">{String(errors.marque.message)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modele">Modèle *</Label>
            <Input
              id="modele"
              {...register('modele', { required: 'Le modèle est requis' })}
              placeholder="Ex: Actros"
            />
            {errors.modele && (
              <p className="text-sm text-red-500">{String(errors.modele.message)}</p>
            )}
          </div>
        </>
      )}

      {/* Champs globaux */}
      <GlobalVehicleFields register={register} watch={watch} setValue={setValue} />
    </>
  );
};
