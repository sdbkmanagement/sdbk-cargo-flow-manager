import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RemorqueFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export const RemorqueFields = ({ register, errors }: RemorqueFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          🚚 Remorque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remorque_immatriculation">Immatriculation remorque *</Label>
            <Input
              id="remorque_immatriculation"
              {...register('remorque_immatriculation', { 
                required: 'L\'immatriculation de la remorque est requise' 
              })}
              placeholder="Ex: CD-456-EF"
            />
            {errors.remorque_immatriculation && (
              <p className="text-sm text-red-500">{String(errors.remorque_immatriculation.message)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remorque_volume_litres">Volume en litres *</Label>
            <Input
              id="remorque_volume_litres"
              type="number"
              {...register('remorque_volume_litres', { 
                required: 'Le volume de la remorque est requis' 
              })}
              placeholder="Ex: 25000"
              step="0.01"
            />
            {errors.remorque_volume_litres && (
              <p className="text-sm text-red-500">{String(errors.remorque_volume_litres.message)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remorque_marque">Marque remorque *</Label>
            <Input
              id="remorque_marque"
              {...register('remorque_marque', { 
                required: 'La marque de la remorque est requise' 
              })}
              placeholder="Ex: Feldbinder"
            />
            {errors.remorque_marque && (
              <p className="text-sm text-red-500">{String(errors.remorque_marque.message)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remorque_modele">Modèle remorque *</Label>
            <Input
              id="remorque_modele"
              {...register('remorque_modele', { 
                required: 'Le modèle de la remorque est requis' 
              })}
              placeholder="Ex: TSA"
            />
            {errors.remorque_modele && (
              <p className="text-sm text-red-500">{String(errors.remorque_modele.message)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remorque_configuration">Configuration</Label>
            <Input
              id="remorque_configuration"
              {...register('remorque_configuration')}
              placeholder="Ex: Citerne, Benne"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remorque_numero_chassis">Numéro de châssis</Label>
            <Input
              id="remorque_numero_chassis"
              {...register('remorque_numero_chassis')}
              placeholder="Ex: WFE3740001234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remorque_annee_fabrication">Année de fabrication</Label>
            <Input
              id="remorque_annee_fabrication"
              type="number"
              {...register('remorque_annee_fabrication')}
              placeholder="Ex: 2020"
              min="1990"
              max={new Date().getFullYear()}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remorque_date_mise_circulation">Date de mise en circulation</Label>
            <Input
              id="remorque_date_mise_circulation"
              type="date"
              {...register('remorque_date_mise_circulation')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};