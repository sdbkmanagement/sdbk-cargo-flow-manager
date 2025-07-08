import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OperationalFieldsProps {
  register: UseFormRegister<any>;
}

export const OperationalFields = ({ register }: OperationalFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type_carburant">Type de carburant</Label>
          <Input
            id="type_carburant"
            {...register('type_carburant')}
            placeholder="Diesel, Essence..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date_mise_service">Date de mise en service</Label>
          <Input
            id="date_mise_service"
            type="date"
            {...register('date_mise_service')}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="kilometrage">Kilométrage actuel</Label>
        <Input
          id="kilometrage"
          type="number"
          {...register('kilometrage')}
          placeholder="150000"
        />
      </div>
    </div>
  );
};