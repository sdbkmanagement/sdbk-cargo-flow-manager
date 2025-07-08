
import React from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
}

interface TransportStatusFieldsProps {
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  chauffeurs: Chauffeur[];
}

export const TransportStatusFields = ({ setValue, watch, chauffeurs }: TransportStatusFieldsProps) => {
  const watchedValues = watch();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type_transport">Type de transport *</Label>
          <Select 
            value={watchedValues.type_transport} 
            onValueChange={(value: 'hydrocarbures' | 'bauxite') => setValue('type_transport', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
              <SelectItem value="bauxite">Bauxite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="statut">Statut</Label>
          <Select 
            value={watchedValues.statut} 
            onValueChange={(value: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise') => setValue('statut', value)}
          >
            <SelectTrigger>
              <SelectValue />
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

      <div className="space-y-2">
        <Label htmlFor="chauffeur_assigne">Chauffeur assigné</Label>
        <Select 
          value={watchedValues.chauffeur_assigne || "none"} 
          onValueChange={(value) => setValue('chauffeur_assigne', value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un chauffeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun chauffeur assigné</SelectItem>
            {chauffeurs.map((chauffeur) => (
              <SelectItem key={chauffeur.id} value={chauffeur.id}>
                {chauffeur.prenom} {chauffeur.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
