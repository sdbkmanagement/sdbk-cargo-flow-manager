import React from 'react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GlobalVehicleFieldsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: any;
}

export const GlobalVehicleFields = ({ register, watch, setValue }: GlobalVehicleFieldsProps) => {
  const typeTransport = watch('type_transport');
  const statut = watch('statut');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type_transport">Catégorie *</Label>
          <Select 
            value={typeTransport || 'hydrocarbures'} 
            onValueChange={(value) => setValue('type_transport', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner la catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
              <SelectItem value="bauxite">Bauxite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statut">Statut *</Label>
          <Select 
            value={statut || 'disponible'} 
            onValueChange={(value) => setValue('statut', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le statut" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base">Base / Dépôt</Label>
          <Input
            id="base"
            {...register('base')}
            placeholder="Ex: Dépôt Conakry, Base Kamsar"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="integration">Intégration</Label>
          <Input
            id="integration"
            {...register('integration')}
            placeholder="Ex: GPS Tracker, OBD, Caméra"
          />
        </div>
      </div>
    </div>
  );
};