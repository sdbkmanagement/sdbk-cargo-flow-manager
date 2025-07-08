import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VehicleFiltersProps {
  typeVehiculeFilter: string;
  setTypeVehiculeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categorieFilter: string;
  setCategorieFilter: (value: string) => void;
  baseFilter: string;
  setBaseFilter: (value: string) => void;
  bases: string[];
}

export const VehicleFilters = ({
  typeVehiculeFilter,
  setTypeVehiculeFilter,
  statusFilter,
  setStatusFilter,
  categorieFilter,
  setCategorieFilter,
  baseFilter,
  setBaseFilter,
  bases
}: VehicleFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type de véhicule</Label>
        <Select value={typeVehiculeFilter} onValueChange={setTypeVehiculeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="porteur">Porteur</SelectItem>
            <SelectItem value="tracteur_remorque">Tracteur + Remorque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Statut</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="en_mission">En mission</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="validation_requise">Validation requise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Catégorie</Label>
        <Select value={categorieFilter} onValueChange={setCategorieFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
            <SelectItem value="bauxite">Bauxite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Base</Label>
        <Select value={baseFilter} onValueChange={setBaseFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les bases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les bases</SelectItem>
            {bases.map((base) => (
              <SelectItem key={base} value={base}>
                {base}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};