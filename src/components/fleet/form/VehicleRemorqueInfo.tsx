import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container, AlertCircle } from 'lucide-react';

interface VehicleRemorqueInfoProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export const VehicleRemorqueInfo = ({ register, errors }: VehicleRemorqueInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Container className="h-5 w-5" />
          Partie Remorque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volume en litres */}
          <div className="space-y-2">
            <Label htmlFor="remorque_volume_litres" className="text-sm font-medium flex items-center gap-1">
              Volume en litres
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Input
              id="remorque_volume_litres"
              type="number"
              {...register('remorque_volume_litres', { 
                required: 'Le volume de la remorque est requis',
                min: { value: 1, message: 'Le volume doit être supérieur à 0' }
              })}
              placeholder="Ex: 25000, 40000"
              step="0.01"
            />
            {errors.remorque_volume_litres && (
              <p className="text-sm text-destructive">{String(errors.remorque_volume_litres.message)}</p>
            )}
          </div>

          {/* Marque */}
          <div className="space-y-2">
            <Label htmlFor="remorque_marque" className="text-sm font-medium flex items-center gap-1">
              Marque
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Input
              id="remorque_marque"
              {...register('remorque_marque', { 
                required: 'La marque de la remorque est requise' 
              })}
              placeholder="Ex: Feldbinder, Magyar, LAG"
            />
            {errors.remorque_marque && (
              <p className="text-sm text-destructive">{String(errors.remorque_marque.message)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modèle */}
          <div className="space-y-2">
            <Label htmlFor="remorque_modele" className="text-sm font-medium flex items-center gap-1">
              Modèle
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Input
              id="remorque_modele"
              {...register('remorque_modele', { 
                required: 'Le modèle de la remorque est requis' 
              })}
              placeholder="Ex: TSA, EUT, MAX"
            />
            {errors.remorque_modele && (
              <p className="text-sm text-destructive">{String(errors.remorque_modele.message)}</p>
            )}
          </div>
          
          {/* Configuration */}
          <div className="space-y-2">
            <Label htmlFor="remorque_configuration" className="text-sm font-medium">Configuration</Label>
            <Input
              id="remorque_configuration"
              {...register('remorque_configuration')}
              placeholder="Ex: Citerne, Semi-remorque, Benne"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Numéro de châssis */}
          <div className="space-y-2">
            <Label htmlFor="remorque_numero_chassis" className="text-sm font-medium">Numéro de châssis</Label>
            <Input
              id="remorque_numero_chassis"
              {...register('remorque_numero_chassis')}
              placeholder="Ex: WFE3740001234567"
              className="font-mono"
            />
          </div>
          
          {/* Année de fabrication */}
          <div className="space-y-2">
            <Label htmlFor="remorque_annee_fabrication" className="text-sm font-medium">Année de fabrication</Label>
            <Input
              id="remorque_annee_fabrication"
              type="number"
              {...register('remorque_annee_fabrication', {
                min: { value: 1990, message: 'Année minimum: 1990' },
                max: { value: new Date().getFullYear(), message: `Année maximum: ${new Date().getFullYear()}` }
              })}
              placeholder="Ex: 2020"
              min="1990"
              max={new Date().getFullYear()}
            />
            {errors.remorque_annee_fabrication && (
              <p className="text-sm text-destructive">{String(errors.remorque_annee_fabrication.message)}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remorque_date_mise_circulation" className="text-sm font-medium">Date de mise en circulation</Label>
          <Input
            id="remorque_date_mise_circulation"
            type="date"
            {...register('remorque_date_mise_circulation')}
          />
        </div>
      </CardContent>
    </Card>
  );
};