
import React from 'react';
import { VehicleTable } from './VehicleTable';
import { VehicleFiltersAdvanced } from './VehicleFiltersAdvanced';
import { SearchInput } from './SearchInput';
import { useVehicleFilters } from '@/hooks/useVehicleFilters';
import type { Vehicule } from '@/services/vehicules';

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDocuments: (vehicle: Vehicule) => void;
}

export const VehicleListTab = ({ vehicles, onEdit, onDelete, onViewDocuments }: VehicleListTabProps) => {
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredVehicles,
    filterStats,
    availableBases
  } = useVehicleFilters(vehicles);

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <SearchInput
        value={filters.search}
        onChange={(value) => updateFilter('search', value)}
        placeholder="Rechercher par numéro, immatriculation, marque, modèle..."
      />

      {/* Filtres avancés */}
      <VehicleFiltersAdvanced
        filters={filters}
        onFilterChange={updateFilter}
        onResetFilters={resetFilters}
        availableBases={availableBases}
        filterStats={filterStats}
      />

      {/* Tableau des résultats */}
      <VehicleTable
        vehicles={filteredVehicles}
        onEdit={(vehicle) => onEdit(vehicle.id)}
        onDelete={onDelete}
        onViewDocuments={onViewDocuments}
      />
    </div>
  );
};
