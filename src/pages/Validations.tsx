
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
  const [statusFilter, setStatusFilter] = useState<string>('en_validation');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
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
            Rôles requis : maintenance, administratif, hseq, obc
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
    queryKey: ['vehicles-validation', currentPage, searchTerm, statusFilter, departmentFilter],
    queryFn: async () => {
      console.log('🚗 [VALIDATIONS] Début du chargement des véhicules...');
      
      // Récupérer tous les véhicules une seule fois
      const allVehicles = await vehiculesService.getAll();
      console.log(`🚗 [VALIDATIONS] ${allVehicles.length} véhicules récupérés:`, allVehicles.slice(0, 3));

      // Préparer la liste des IDs
      const vehiculeIds = allVehicles.map((v: Vehicule) => v.id);

      // Récupérer tous les workflows existants avec leurs étapes
      const { data: allWorkflows } = await supabase
        .from('validation_workflows')
        .select('vehicule_id, statut_global')
        .in('vehicule_id', vehiculeIds);

      const workflowMap = new Map((allWorkflows || []).map(w => [w.vehicule_id, w.statut_global]));

      // Récupérer toutes les étapes de validation pour le filtre par département
      const { data: allEtapes } = await supabase
        .from('validation_etapes')
        .select('workflow_id, etape, statut')
        .in('workflow_id', (allWorkflows || []).map(w => w.vehicule_id).length > 0 
          ? await supabase
              .from('validation_workflows')
              .select('id, vehicule_id')
              .in('vehicule_id', vehiculeIds)
              .then(res => (res.data || []).map(w => w.id))
          : []);

      // Créer une map des étapes par véhicule
      const { data: workflowsWithIds } = await supabase
        .from('validation_workflows')
        .select('id, vehicule_id')
        .in('vehicule_id', vehiculeIds);
      
      const workflowIdToVehiculeId = new Map((workflowsWithIds || []).map(w => [w.id, w.vehicule_id]));
      
      // Map des étapes par véhicule: vehiculeId -> { maintenance: status, administratif: status, ... }
      const etapesParVehicule = new Map<string, Record<string, string>>();
      (allEtapes || []).forEach(etape => {
        const vehiculeId = workflowIdToVehiculeId.get(etape.workflow_id);
        if (vehiculeId) {
          if (!etapesParVehicule.has(vehiculeId)) {
            etapesParVehicule.set(vehiculeId, {});
          }
          etapesParVehicule.get(vehiculeId)![etape.etape] = etape.statut;
        }
      });
      
      // Récupérer les véhicules avec missions actives (à exclure)
      const { data: missionsActives } = await supabase
        .from('missions')
        .select('vehicule_id')
        .in('statut', ['en_attente', 'en_cours']);
      
      const vehiculesAvecMissionsActives = new Set(missionsActives?.map(m => m.vehicule_id) || []);
      console.log(`🚗 [MISSIONS] ${vehiculesAvecMissionsActives.size} véhicules avec missions actives exclus`);
      
      // Filtrage côté client
      const filtered = allVehicles.filter((vehicle: Vehicule) => {
        // ❌ EXCLUSION: Véhicules avec missions actives
        if (vehiculesAvecMissionsActives.has(vehicle.id)) {
          console.log(`🚗 [EXCLUSION] ${vehicle.numero} - Mission active en cours`);
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
        
        // 🔍 DIAGNOSTIC: Véhicule nécessite validation si les champs du véhicule l'indiquent
        const needsValidation = vehicle.validation_requise === true || vehicle.statut === 'validation_requise';
        
        // 🔍 DIAGNOSTIC: Logs de débogage pour TOUS les véhicules
        console.log(`🚗 [DIAGNOSTIC] Véhicule ${vehicle.numero}:`, {
          validation_requise: vehicle.validation_requise,
          statut: vehicle.statut,
          workflowStatus,
          needsValidation,
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
        
        // Filtre par département: afficher les véhicules où ce département n'est pas encore validé
        const vehicleEtapes = etapesParVehicule.get(vehicle.id) || {};
        const matchesDepartment = departmentFilter === 'all' ? true :
          vehicleEtapes[departmentFilter] === 'en_attente' || 
          vehicleEtapes[departmentFilter] === undefined;
        
        const finalMatch = matchesSearch && matchesStatus && matchesDepartment;
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

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Workflows de Validation</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Page {currentPage} - {totalCount} véhicule(s)
          </p>
          <div className="mt-1 text-xs sm:text-sm text-blue-600">
            <p>Connecté : <strong>{getUserRole() === 'hsecq' ? 'HSEQ' : getUserRole()}</strong> — Rôles : {getUserRoles().map(r => r === 'hsecq' ? 'HSEQ' : r).join(', ')}</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <ValidationStats />

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Validation des véhicules</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Suivez et gérez les workflows de validation
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* Filtres */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
              />
              <Button onClick={handleSearch} variant="default" size="sm">
                <Search className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Rechercher</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_validation">En validation</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les dép.</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="administratif">Administratif</SelectItem>
                  <SelectItem value="hsecq">HSEQ</SelectItem>
                  <SelectItem value="obc">OBC (Opérations)</SelectItem>
                </SelectContent>
              </Select>
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
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Précédent</span>
            </Button>
            <span className="text-xs sm:text-sm text-gray-500 text-center">
              {vehicles.length}/{totalCount}
            </span>
            <Button 
              onClick={handleNextPage} 
              disabled={!vehiclesData?.hasMore}
              variant="outline"
              size="sm"
            >
              <span className="hidden sm:inline mr-1">Suivant</span>
              <ChevronRight className="w-4 h-4" />
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
                <p className="text-gray-500 text-sm">Aucun véhicule trouvé.</p>
                <Button onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                  setCurrentPage(1);
                }} variant="outline" size="sm" className="mt-4">
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
