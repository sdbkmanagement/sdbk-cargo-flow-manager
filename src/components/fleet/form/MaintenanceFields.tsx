
import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MaintenanceFieldsProps {
  register: UseFormRegister<any>;
}

export const MaintenanceFields = ({ register }: MaintenanceFieldsProps) => {
  return (
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
  );
};
