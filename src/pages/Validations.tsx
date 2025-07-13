
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ValidationWorkflowCard } from '@/components/fleet/validation/ValidationWorkflowCard';
import { ValidationStats } from '@/components/fleet/validation/ValidationStats';
import { vehiculesService } from '@/services/vehicules';
import { validationService } from '@/services/validation';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

type Vehicule = {
  id: string;
  numero: string;
  immatriculation?: string;
  tracteur_immatriculation?: string;
  marque?: string;
  modele?: string;
  type_transport: string;
  statut: string;
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Réduire le nombre d'éléments par page

  // Récupération des véhicules avec pagination
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useQuery({
    queryKey: ['vehicles-validation', currentPage],
    queryFn: async () => {
      console.log('Chargement des véhicules pour validation');
      const allVehicles = await vehiculesService.getAll();
      
      // Filtrer et paginer côté client pour commencer
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return allVehicles.slice(start, end);
    },
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Récupération des statistiques avec cache plus long
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: validationService.getStatistiquesGlobales,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Filtrage des véhicules (optimisé)
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((vehicle: Vehicule) => {
      const matchesSearch = 
        vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.immatriculation && vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.tracteur_immatriculation && vehicle.tracteur_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.marque && vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'en_validation' && vehicle.statut === 'validation_requise') ||
        (statusFilter === 'valide' && vehicle.statut === 'disponible') ||
        (statusFilter === 'rejete' && vehicle.statut === 'validation_requise');
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const handleRefresh = async () => {
    console.log('Actualisation manuelle des données');
    validationService.clearCache();
    await Promise.all([refetchVehicles(), refetchStats()]);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des workflows de validation...</p>
          <p className="text-sm text-gray-500 mt-2">Page {currentPage}</p>
        </div>
      </div>
    );
  }

  if (vehiclesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur lors du chargement des workflows</p>
          <p className="text-sm mt-2">{vehiclesError.message}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows de Validation</h1>
          <p className="text-gray-600 mt-2">
            Gestion des processus de validation des véhicules (Page {currentPage})
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <ValidationStats />

      <Card>
        <CardHeader>
          <CardTitle>Validation des véhicules</CardTitle>
          <CardDescription>
            Suivez et gérez les workflows de validation pour chaque véhicule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un véhicule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_validation">En validation</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Navigation pagination */}
          <div className="flex justify-between items-center mb-4">
            <Button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} - {filteredVehicles.length} véhicule(s)
            </span>
            <Button 
              onClick={handleNextPage} 
              disabled={filteredVehicles.length < itemsPerPage}
              variant="outline"
              size="sm"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Liste des workflows */}
          <div className="space-y-4">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <ValidationWorkflowCard
                  key={vehicle.id}
                  vehiculeId={vehicle.id}
                  vehiculeNumero={`${vehicle.numero} (${vehicle.immatriculation || vehicle.tracteur_immatriculation || 'N/A'})`}
                  userRole="admin"
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun véhicule trouvé pour les critères sélectionnés.</p>
                <Button onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }} variant="outline" className="mt-4">
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Validations;
