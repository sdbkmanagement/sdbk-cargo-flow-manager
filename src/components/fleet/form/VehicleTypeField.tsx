import React from 'react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VehicleTypeFieldProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: any;
}

export const VehicleTypeField = ({ register, watch, setValue }: VehicleTypeFieldProps) => {
  const typeVehicule = watch('type_vehicule');

  return (
    <div className="space-y-2">
      <Label htmlFor="type_vehicule">Type de véhicule *</Label>
      <Select 
        value={typeVehicule || 'porteur'} 
        onValueChange={(value) => setValue('type_vehicule', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner le type de véhicule" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="porteur">Porteur</SelectItem>
          <SelectItem value="tracteur_remorque">Tracteur + Remorque</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};