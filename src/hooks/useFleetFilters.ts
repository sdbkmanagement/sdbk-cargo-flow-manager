
import { useState, useMemo } from 'react';
import type { Vehicule } from '@/services/vehicules';

export const useFleetFilters = (vehicles: Vehicule[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeVehiculeFilter, setTypeVehiculeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transportFilter, setTransportFilter] = useState('all');
  const [baseFilter, setBaseFilter] = useState('all');

  // Calculer les bases disponibles
  const bases = useMemo(() => {
    const uniqueBases = [...new Set(vehicles.map(v => v.base).filter(Boolean))];
    return uniqueBases.sort();
  }, [vehicles]);

  // Filtrer les véhicules
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // Filtre de recherche textuelle
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          vehicle.numero?.toLowerCase().includes(searchLower) ||
          vehicle.immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_immatriculation?.toLowerCase().includes(searchLower) ||
          vehicle.marque?.toLowerCase().includes(searchLower) ||
          vehicle.modele?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_marque?.toLowerCase().includes(searchLower) ||
          vehicle.tracteur_modele?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_marque?.toLowerCase().includes(searchLower) ||
          vehicle.remorque_modele?.toLowerCase().includes(searchLower) ||
          vehicle.proprietaire_nom?.toLowerCase().includes(searchLower) ||
          vehicle.proprietaire_prenom?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Filtre par type de véhicule
      if (typeVehiculeFilter !== 'all' && vehicle.type_vehicule !== typeVehiculeFilter) {
        return false;
      }

      // Filtre par statut
      if (statusFilter !== 'all' && vehicle.statut !== statusFilter) {
        return false;
      }

      // Filtre par type de transport
      if (transportFilter !== 'all' && vehicle.type_transport !== transportFilter) {
        return false;
      }

      // Filtre par base
      if (baseFilter !== 'all' && vehicle.base !== baseFilter) {
        return false;
      }

      return true;
    });
  }, [vehicles, searchTerm, typeVehiculeFilter, statusFilter, transportFilter, baseFilter]);

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (typeVehiculeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (transportFilter !== 'all') count++;
    if (baseFilter !== 'all') count++;
    return count;
  }, [searchTerm, typeVehiculeFilter, statusFilter, transportFilter, baseFilter]);

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setTypeVehiculeFilter('all');
    setStatusFilter('all');
    setTransportFilter('all');
    setBaseFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    typeVehiculeFilter,
    setTypeVehiculeFilter,
    statusFilter,
    setStatusFilter,
    transportFilter,
    setTransportFilter,
    baseFilter,
    setBaseFilter,
    bases,
    filteredVehicles,
    activeFiltersCount,
    resetFilters
  };
};
