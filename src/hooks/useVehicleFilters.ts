
import { useState, useMemo } from 'react';
import type { Vehicule } from '@/services/vehicules';

export interface VehicleFilters {
  search: string;
  typeVehicule: string;
  status: string;
  categorie: string;
  base: string;
  validationRequise: string;
  maintenanceStatus: string;
}

const initialFilters: VehicleFilters = {
  search: '',
  typeVehicule: 'all',
  status: 'all',
  categorie: 'all',
  base: 'all',
  validationRequise: 'all',
  maintenanceStatus: 'all'
};

export const useVehicleFilters = (vehicles: Vehicule[]) => {
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters);

  // Fonction pour mettre à jour un filtre spécifique
  const updateFilter = (key: keyof VehicleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Calcul des bases disponibles
  const availableBases = useMemo(() => {
    const bases = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.base) bases.add(vehicle.base);
    });
    return Array.from(bases).sort();
  }, [vehicles]);

  // Filtrage optimisé avec useMemo
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.numero?.toLowerCase().includes(searchLower) ||
          vehicle.immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.marque?.toLowerCase().includes(searchLower) ||
          vehicle.modele?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_marque?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_modele?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_marque?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_modele?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtre par type de véhicule
      if (filters.typeVehicule !== 'all' && vehicle.type_vehicule !== filters.typeVehicule) {
        return false;
      }

      // Filtre par statut
      if (filters.status !== 'all' && vehicle.statut !== filters.status) {
        return false;
      }

      // Filtre par catégorie (type de transport)
      if (filters.categorie !== 'all' && vehicle.type_transport !== filters.categorie) {
        return false;
      }

      // Filtre par base
      if (filters.base !== 'all' && vehicle.base !== filters.base) {
        return false;
      }

      // Filtre par validation requise
      if (filters.validationRequise !== 'all') {
        const requiresValidation = vehicle.validation_requise === true;
        if (filters.validationRequise === 'oui' && !requiresValidation) return false;
        if (filters.validationRequise === 'non' && requiresValidation) return false;
      }

      // Filtre par statut de maintenance
      if (filters.maintenanceStatus !== 'all') {
        const isInMaintenance = vehicle.statut === 'maintenance';
        if (filters.maintenanceStatus === 'en_maintenance' && !isInMaintenance) return false;
        if (filters.maintenanceStatus === 'operationnel' && isInMaintenance) return false;
      }

      return true;
    });
  }, [vehicles, filters]);

  // Statistiques des résultats filtrés
  const filterStats = useMemo(() => {
    const stats = {
      total: filteredVehicles.length,
      disponibles: 0,
      en_mission: 0,
      maintenance: 0,
      validation_requise: 0
    };

    filteredVehicles.forEach(vehicle => {
      switch (vehicle.statut) {
        case 'disponible':
          stats.disponibles++;
          break;
        case 'en_mission':
          stats.en_mission++;
          break;
        case 'maintenance':
          stats.maintenance++;
          break;
        case 'validation_requise':
          stats.validation_requise++;
          break;
      }
    });

    return stats;
  }, [filteredVehicles]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredVehicles,
    filterStats,
    availableBases
  };
};
