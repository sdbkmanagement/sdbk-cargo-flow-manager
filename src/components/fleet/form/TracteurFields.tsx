import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TracteurFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export const TracteurFields = ({ register, errors }: TracteurFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          🚛 Tracteur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tracteur_immatriculation">Immatriculation tracteur *</Label>
            <Input
              id="tracteur_immatriculation"
              {...register('tracteur_immatriculation', { 
                required: 'L\'immatriculation du tracteur est requise' 
              })}
              placeholder="Ex: AB-123-CD"
            />
            {errors.tracteur_immatriculation && (
              <p className="text-sm text-red-500">{String(errors.tracteur_immatriculation.message)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tracteur_marque">Marque tracteur *</Label>
            <Input
              id="tracteur_marque"
              {...register('tracteur_marque', { 
                required: 'La marque du tracteur est requise' 
              })}
              placeholder="Ex: Mercedes"
            />
            {errors.tracteur_marque && (
              <p className="text-sm text-red-500">{String(errors.tracteur_marque.message)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tracteur_modele">Modèle tracteur *</Label>
            <Input
              id="tracteur_modele"
              {...register('tracteur_modele', { 
                required: 'Le modèle du tracteur est requis' 
              })}
              placeholder="Ex: Actros"
            />
            {errors.tracteur_modele && (
              <p className="text-sm text-red-500">{String(errors.tracteur_modele.message)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tracteur_configuration">Configuration</Label>
            <Input
              id="tracteur_configuration"
              {...register('tracteur_configuration')}
              placeholder="Ex: 4x2, 6x4"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tracteur_numero_chassis">Numéro de châssis</Label>
            <Input
              id="tracteur_numero_chassis"
              {...register('tracteur_numero_chassis')}
              placeholder="Ex: WDB9640261L123456"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tracteur_annee_fabrication">Année de fabrication</Label>
            <Input
              id="tracteur_annee_fabrication"
              type="number"
              {...register('tracteur_annee_fabrication')}
              placeholder="Ex: 2020"
              min="1990"
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tracteur_date_mise_circulation">Date de mise en circulation</Label>
          <Input
            id="tracteur_date_mise_circulation"
            type="date"
            {...register('tracteur_date_mise_circulation')}
          />
        </div>
      </CardContent>
    </Card>
  );
};