import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, AlertCircle } from 'lucide-react';

interface VehicleTracteurInfoProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export const VehicleTracteurInfo = ({ register, errors }: VehicleTracteurInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Partie Tracteur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marque */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_marque" className="text-sm font-medium flex items-center gap-1">
              Marque
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Input
              id="tracteur_marque"
              {...register('tracteur_marque', { 
                required: 'La marque du tracteur est requise' 
              })}
              placeholder="Ex: Mercedes, Volvo, Scania"
            />
            {errors.tracteur_marque && (
              <p className="text-sm text-destructive">{String(errors.tracteur_marque.message)}</p>
            )}
          </div>
          
          {/* Modèle */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_modele" className="text-sm font-medium flex items-center gap-1">
              Modèle
              <AlertCircle className="h-4 w-4 text-destructive" />
            </Label>
            <Input
              id="tracteur_modele"
              {...register('tracteur_modele', { 
                required: 'Le modèle du tracteur est requis' 
              })}
              placeholder="Ex: Actros, FH, R-Series"
            />
            {errors.tracteur_modele && (
              <p className="text-sm text-destructive">{String(errors.tracteur_modele.message)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Configuration */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_configuration" className="text-sm font-medium">Configuration</Label>
            <Input
              id="tracteur_configuration"
              {...register('tracteur_configuration')}
              placeholder="Ex: 4x2, 6x4, 6x2"
            />
          </div>
          
          {/* Numéro de châssis */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_numero_chassis" className="text-sm font-medium">Numéro de châssis</Label>
            <Input
              id="tracteur_numero_chassis"
              {...register('tracteur_numero_chassis')}
              placeholder="Ex: WDB9640261L123456"
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date de fabrication */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_date_fabrication" className="text-sm font-medium">Date de fabrication</Label>
            <Input
              id="tracteur_date_fabrication"
              type="date"
              {...register('tracteur_date_fabrication')}
            />
          </div>
          
          {/* Date de mise en circulation */}
          <div className="space-y-2">
            <Label htmlFor="tracteur_date_mise_circulation" className="text-sm font-medium">Date de mise en circulation</Label>
            <Input
              id="tracteur_date_mise_circulation"
              type="date"
              {...register('tracteur_date_mise_circulation')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};