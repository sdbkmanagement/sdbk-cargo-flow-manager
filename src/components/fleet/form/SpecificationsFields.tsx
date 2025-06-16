
import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormData {
  numero: string;
  marque: string;
  modele: string;
  immatriculation: string;
  type_transport: 'hydrocarbures' | 'bauxite';
  statut: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise';
  chauffeur_assigne: string;
  capacite_max: string;
  unite_capacite: string;
  annee_fabrication: string;
  numero_chassis: string;
  consommation_moyenne: string;
  derniere_maintenance: string;
  prochaine_maintenance: string;
}

interface SpecificationsFieldsProps {
  register: UseFormRegister<FormData>;
}

export const SpecificationsFields = ({ register }: SpecificationsFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacite_max">Capacité max</Label>
          <Input
            id="capacite_max"
            type="number"
            step="0.01"
            {...register('capacite_max')}
            placeholder="25000"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unite_capacite">Unité</Label>
          <Input
            id="unite_capacite"
            {...register('unite_capacite')}
            placeholder="L, m³, tonnes..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="annee_fabrication">Année</Label>
          <Input
            id="annee_fabrication"
            type="number"
            {...register('annee_fabrication')}
            placeholder="2020"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero_chassis">Numéro de châssis</Label>
          <Input
            id="numero_chassis"
            {...register('numero_chassis')}
            placeholder="VIN123456789"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="consommation_moyenne">Consommation (L/100km)</Label>
          <Input
            id="consommation_moyenne"
            type="number"
            step="0.1"
            {...register('consommation_moyenne')}
            placeholder="35.5"
          />
        </div>
      </div>
    </>
  );
};
