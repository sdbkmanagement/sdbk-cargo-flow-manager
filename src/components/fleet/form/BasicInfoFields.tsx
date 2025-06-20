
import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
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
  type_carburant: string;
  date_mise_service: string;
  kilometrage: string;
  annee_fabrication: string;
  numero_chassis: string;
  consommation_moyenne: string;
  derniere_maintenance: string;
  prochaine_maintenance: string;
}

interface BasicInfoFieldsProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

export const BasicInfoFields = ({ register, errors }: BasicInfoFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero">Numéro du véhicule *</Label>
          <Input
            id="numero"
            {...register('numero', { required: 'Le numéro est requis' })}
            placeholder="Ex: VH001"
          />
          {errors.numero && (
            <p className="text-sm text-red-500">{errors.numero.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="immatriculation">Immatriculation *</Label>
          <Input
            id="immatriculation"
            {...register('immatriculation', { required: 'L\'immatriculation est requise' })}
            placeholder="Ex: AB-123-CD"
          />
          {errors.immatriculation && (
            <p className="text-sm text-red-500">{errors.immatriculation.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marque">Marque *</Label>
          <Input
            id="marque"
            {...register('marque', { required: 'La marque est requise' })}
            placeholder="Ex: Mercedes"
          />
          {errors.marque && (
            <p className="text-sm text-red-500">{errors.marque.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="modele">Modèle *</Label>
          <Input
            id="modele"
            {...register('modele', { required: 'Le modèle est requis' })}
            placeholder="Ex: Actros"
          />
          {errors.modele && (
            <p className="text-sm text-red-500">{errors.modele.message}</p>
          )}
        </div>
      </div>
    </>
  );
};
