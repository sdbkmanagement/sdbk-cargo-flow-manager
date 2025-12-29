
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ValidationWorkflowCard } from '@/components/fleet/validation/ValidationWorkflowCard';
import { ValidationStats } from '@/components/fleet/validation/ValidationStats';
import vehiculesService, { type Vehicule } from '@/services/vehicules';
import { validationService } from '@/services/validation';
import { supabase } from '@/integrations/supabase/client';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';
import { RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Search } from 'lucide-react';
const Validations = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { hasValidationAccess, getUserRole, getUserRoles } = useValidationPermissions();

  // Vérifier si l'utilisateur a accès aux validations
  if (!hasValidationAccess()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder aux validations.
          </p>
          <p className="text-sm text-gray-500">
            Rôles requis : maintenance, administratif, hsecq, obc
          </p>
          <p className="text-sm text-gray-500">
            Vos rôles : {getUserRoles().join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Récupération optimisée des véhicules avec pagination côté serveur
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useQuery({
    queryKey: ['vehicles-validation', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      console.log('🚗 [VALIDATIONS] Début du chargement des véhicules...');
      
      // Récupérer tous les véhicules une seule fois
      const allVehicles = await vehiculesService.getAll();
      console.log(`🚗 [VALIDATIONS] ${allVehicles.length} véhicules récupérés:`, allVehicles.slice(0, 3));

      // Préparer la liste des IDs
      const vehiculeIds = allVehicles.map((v: Vehicule) => v.id);

      // Récupérer tous les workflows existants
      const { data: allWorkflows } = await supabase
        .from('validation_workflows')
        .select('vehicule_id, statut_global')
        .in('vehicule_id', vehiculeIds);

      const workflowMap = new Map((allWorkflows || []).map(w => [w.vehicule_id, w.statut_global]));
      
      // Récupérer les véhicules avec missions actives (info contextuelle, mais ne pas exclure les véhicules en validation)
      const { data: missionsActives } = await supabase
        .from('missions')
        .select('vehicule_id')
        .in('statut', ['en_attente', 'en_cours']);
      
      const vehiculesAvecMissionsActives = new Set(missionsActives?.map(m => m.vehicule_id) || []);
      console.log(`🚗 [MISSIONS] ${vehiculesAvecMissionsActives.size} véhicules avec missions actives`);
      
      // Filtrage côté client
      const filtered = allVehicles.filter((vehicle: Vehicule) => {
        // 🔍 Déterminer si le véhicule nécessite validation
        const needsValidation = vehicle.validation_requise === true || vehicle.statut === 'validation_requise';
        const workflowStatusForExclusion = workflowMap.get(vehicle.id);
        const isInValidationProcess = needsValidation || workflowStatusForExclusion === 'en_validation';
        
        // ❌ EXCLUSION: Véhicules avec missions actives SAUF ceux en validation
        // Les véhicules en validation doivent toujours apparaître pour permettre leur traitement
        if (vehiculesAvecMissionsActives.has(vehicle.id) && !isInValidationProcess) {
          console.log(`🚗 [EXCLUSION] ${vehicle.numero} - Mission active en cours (pas en validation)`);
          return false;
        }
        
        // Recherche étendue
        const matchesSearch = !searchTerm || 
          vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (vehicle.immatriculation && vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.tracteur_immatriculation && vehicle.tracteur_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.remorque_immatriculation && vehicle.remorque_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.marque && vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.tracteur_marque && vehicle.tracteur_marque.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.modele && vehicle.modele.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.tracteur_modele && vehicle.tracteur_modele.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vehicle.base && vehicle.base.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Déterminer le statut du workflow (si existe)
        const workflowStatus = workflowMap.get(vehicle.id);
        
        // 🔍 DIAGNOSTIC: Logs de débogage pour TOUS les véhicules
        console.log(`🚗 [DIAGNOSTIC] Véhicule ${vehicle.numero}:`, {
          validation_requise: vehicle.validation_requise,
          statut: vehicle.statut,
          workflowStatus,
          needsValidation,
          isInValidationProcess,
          matchesSearch,
          statusFilter
        });
        
        // Un véhicule est considéré comme entièrement validé SEULEMENT si:
        // 1. Son workflow est 'valide' ET
        // 2. validation_requise = false ET  
        // 3. statut != 'validation_requise' ET
        // 4. statut = 'disponible'
        const isFullyValidated = workflowStatus === 'valide' 
          && vehicle.validation_requise === false 
          && vehicle.statut !== 'validation_requise' 
          && vehicle.statut === 'disponible';
        
        const isRejected = workflowStatus === 'rejete';
        const isInValidation = needsValidation && !isRejected && !isFullyValidated;
        
        const matchesStatus = 
          statusFilter === 'all' ? true : // Afficher tous les véhicules quand "Tous les statuts" est sélectionné
          statusFilter === 'en_validation' ? isInValidation :
          statusFilter === 'valide' ? isFullyValidated :
          statusFilter === 'rejete' ? isRejected :
          true;
        
        const finalMatch = matchesSearch && matchesStatus;
        console.log(`🚗 [FINAL] ${vehicle.numero} - Final match: ${finalMatch}`);
        return finalMatch;
      });

      console.log(`🚗 [FILTERED] ${filtered.length} véhicules après filtrage`);

      // Pagination côté client
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedVehicles = filtered.slice(start, end);
      
      console.log(`🚗 [PAGINATION] Page ${currentPage}, showing ${paginatedVehicles.length} véhicules`);
      
      return {
        vehicles: paginatedVehicles,
        totalCount: filtered.length,
        hasMore: end < filtered.length,
        hasPrevious: currentPage > 1
      };
    },
    staleTime: 30000, // Cache 30 secondes
    gcTime: 60000, // Keep in cache for 1 minute
  });

  // Récupération des statistiques avec cache plus long
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: validationService.getStatistiquesGlobales,
    staleTime: 60000, // Cache 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const handleRefresh = async () => {
    console.log('Actualisation manuelle des données');
    validationService.clearCache();
    await Promise.all([refetchVehicles(), refetchStats()]);
  };

  const handleNextPage = () => {
    if (vehiclesData?.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (vehiclesData?.hasPrevious) {
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement optimisé des workflows...</p>
          <p className="text-sm text-gray-500 mt-2">Page {currentPage}</p>
        </div>
      </div>
    );
  }

  if (vehiclesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p className="text-lg font-medium">Erreur lors du chargement</p>
          <p className="text-sm mt-2">{vehiclesError.message}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const vehicles = vehiclesData?.vehicles || [];
  const totalCount = vehiclesData?.totalCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows de Validation</h1>
          <p className="text-gray-600 mt-2">
            Gestion des processus de validation des véhicules (Page {currentPage} - {totalCount} véhicule(s))
          </p>
          <div className="mt-2 text-sm text-blue-600">
            <p>Connecté en tant que : <strong>{getUserRole()}</strong></p>
            <p>Rôles : {getUserRoles().join(', ')}</p>
          </div>
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
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Rechercher par numéro, immatriculation, marque..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={handleSearch} variant="default">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
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
              disabled={!vehiclesData?.hasPrevious}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} - {vehicles.length} véhicule(s) sur {totalCount}
            </span>
            <Button 
              onClick={handleNextPage} 
              disabled={!vehiclesData?.hasMore}
              variant="outline"
              size="sm"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Liste des workflows */}
          <div className="space-y-4">
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <ValidationWorkflowCard
                  key={vehicle.id}
                  vehiculeId={vehicle.id}
                  vehiculeNumero={`${vehicle.numero} (${vehicle.immatriculation || vehicle.tracteur_immatriculation || 'N/A'})`}
                  userRole={getUserRole()}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun véhicule trouvé pour les critères sélectionnés.</p>
                <Button onClick={() => {
                  setSearchInput('');
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
