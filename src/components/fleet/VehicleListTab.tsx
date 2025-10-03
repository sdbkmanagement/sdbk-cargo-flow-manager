
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
  onFilteredVehiclesChange?: (vehicles: Vehicule[]) => void;
}

export const VehicleListTab = ({ vehicles, onEdit, onDelete, onViewDocuments, onFilteredVehiclesChange }: VehicleListTabProps) => {
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredVehicles,
    filterStats,
    availableBases
  } = useVehicleFilters(vehicles);

  // MODIFICATION POINT 2: Notifier le parent des véhicules filtrés pour l'export
  React.useEffect(() => {
    onFilteredVehiclesChange?.(filteredVehicles);
  }, [filteredVehicles, onFilteredVehiclesChange]);

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
