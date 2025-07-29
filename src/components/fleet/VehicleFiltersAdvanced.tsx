
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { VehicleFilters } from '@/hooks/useVehicleFilters';

interface VehicleFiltersAdvancedProps {
  filters: VehicleFilters;
  onFilterChange: (key: keyof VehicleFilters, value: string) => void;
  onResetFilters: () => void;
  availableBases: string[];
  filterStats: {
    total: number;
    disponibles: number;
    en_mission: number;
    maintenance: number;
    validation_requise: number;
  };
}

export const VehicleFiltersAdvanced = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableBases,
  filterStats
}: VehicleFiltersAdvancedProps) => {
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;

  const getFilterLabel = (key: keyof VehicleFilters, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      typeVehicule: {
        porteur: 'Porteur',
        tracteur_remorque: 'Tracteur-Remorque'
      },
      status: {
        disponible: 'Disponible',
        en_mission: 'En mission',
        maintenance: 'Maintenance',
        validation_requise: 'Validation requise'
      },
      categorie: {
        hydrocarbures: 'Hydrocarbures',
        marchandise: 'Bauxite'
      },
      validationRequise: {
        oui: 'Validation requise',
        non: 'Validation non requise'
      },
      maintenanceStatus: {
        en_maintenance: 'En maintenance',
        operationnel: 'Opérationnel'
      }
    };

    return labels[key]?.[value] || value;
  };

  const removeFilter = (key: keyof VehicleFilters) => {
    onFilterChange(key, key === 'search' ? '' : 'all');
  };

  return (
    <div className="space-y-4">
      {/* Filtres principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Type de véhicule</Label>
          <Select value={filters.typeVehicule} onValueChange={(value) => onFilterChange('typeVehicule', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="porteur">Porteur</SelectItem>
              <SelectItem value="tracteur_remorque">Tracteur-Remorque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Statut</Label>
          <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
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
          <Select value={filters.categorie} onValueChange={(value) => onFilterChange('categorie', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
              <SelectItem value="marchandise">Bauxite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Base</Label>
          <Select value={filters.base} onValueChange={(value) => onFilterChange('base', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les bases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les bases</SelectItem>
              {availableBases.map((base) => (
                <SelectItem key={base} value={base}>
                  {base}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Validation</Label>
          <Select value={filters.validationRequise} onValueChange={(value) => onFilterChange('validationRequise', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes validations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes validations</SelectItem>
              <SelectItem value="oui">Validation requise</SelectItem>
              <SelectItem value="non">Validation non requise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Maintenance</Label>
          <Select value={filters.maintenanceStatus} onValueChange={(value) => onFilterChange('maintenanceStatus', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="en_maintenance">En maintenance</SelectItem>
              <SelectItem value="operationnel">Opérationnel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtres actifs et actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {activeFiltersCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filtres actifs :
              </span>
              
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: "{filters.search}"
                  <button onClick={() => removeFilter('search')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {Object.entries(filters).map(([key, value]) => {
                if (key === 'search' || value === 'all' || value === '') return null;
                return (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {getFilterLabel(key as keyof VehicleFilters, value)}
                    <button onClick={() => removeFilter(key as keyof VehicleFilters)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Réinitialiser
              </Button>
            </>
          )}
        </div>

        {/* Statistiques des résultats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium">{filterStats.total} véhicules</span>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white">
              {filterStats.disponibles} disponibles
            </Badge>
            <Badge className="bg-blue-500 text-white">
              {filterStats.en_mission} en mission
            </Badge>
            <Badge className="bg-yellow-500 text-white">
              {filterStats.maintenance} maintenance
            </Badge>
            <Badge className="bg-purple-500 text-white">
              {filterStats.validation_requise} validation
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
