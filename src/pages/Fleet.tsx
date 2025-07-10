import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Download } from 'lucide-react';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { ValidationTab } from '@/components/fleet/ValidationTab';
import { SearchInput } from '@/components/fleet/SearchInput';
import { VehicleFilters } from '@/components/fleet/VehicleFilters';
import { DocumentUploadSection } from '@/components/fleet/form/DocumentUploadSection';
import { VehicleMaintenanceHistory } from '@/components/fleet/VehicleMaintenanceHistory';
import { PostMissionWorkflow } from '@/components/fleet/PostMissionWorkflow';
import { vehiculesService } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

const Fleet = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeVehiculeFilter, setTypeVehiculeFilter] = useState<string>('all');
  const [categorieFilter, setCategorieFilter] = useState<string>('all');
  const [baseFilter, setBaseFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicule | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showPostMissionWorkflow, setShowPostMissionWorkflow] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des véhicules
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll,
  });

  // Récupération des statistiques et bases
  const { data: stats } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: vehiculesService.getFleetStats,
  });

  const { data: bases = [] } = useQuery({
    queryKey: ['vehicle-bases'],
    queryFn: vehiculesService.getBases,
  });

  // Mutation pour supprimer un véhicule
  const deleteMutation = useMutation({
    mutationFn: vehiculesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast({
        title: 'Véhicule supprimé',
        description: 'Le véhicule a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      console.error('Erreur de suppression:', error);
      toast({
        title: 'Erreur de suppression',
        description: error.message || 'Impossible de supprimer le véhicule.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (vehicle: Vehicule) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // L'erreur sera gérée par onError de la mutation
      throw error;
    }
  };

  const handleViewDocuments = (vehicle: Vehicule) => {
    console.log('Affichage des documents pour:', vehicle.numero);
    setSelectedVehicle(vehicle);
    setShowDocuments(true);
  };

  const handleViewMaintenance = (vehicle: Vehicule) => {
    console.log('Affichage de la maintenance pour:', vehicle.numero);
    setSelectedVehicle(vehicle);
    setShowMaintenance(true);
  };

  const handleViewPostMissionWorkflow = (vehicle: Vehicule) => {
    console.log('Affichage du workflow post-mission pour:', vehicle.numero);
    setSelectedVehicle(vehicle);
    setShowPostMissionWorkflow(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
    handleFormClose();
  };

  const handleCloseDocuments = () => {
    setShowDocuments(false);
    setSelectedVehicle(null);
  };

  const handleCloseMaintenance = () => {
    setShowMaintenance(false);
    setSelectedVehicle(null);
  };

  const handleClosePostMissionWorkflow = () => {
    setShowPostMissionWorkflow(false);
    setSelectedVehicle(null);
  };

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.immatriculation && vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.tracteur_immatriculation && vehicle.tracteur_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.remorque_immatriculation && vehicle.remorque_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.marque && vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.modele && vehicle.modele.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || vehicle.statut === statusFilter;
    const matchesType = typeVehiculeFilter === 'all' || vehicle.type_vehicule === typeVehiculeFilter;
    const matchesCategorie = categorieFilter === 'all' || vehicle.type_transport === categorieFilter;
    const matchesBase = baseFilter === 'all' || vehicle.base === baseFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategorie && matchesBase;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des véhicules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur lors du chargement des véhicules</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FleetHeader 
        onAddVehicle={() => setShowForm(true)}
        vehicleCount={vehicles.length}
      />

      {stats && <FleetStats stats={stats} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion de la flotte</CardTitle>
            <CardDescription>
              Gérez vos véhicules, maintenances, validations et documents
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <SearchInput 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher un véhicule (immatriculation, marque...)"
            />
            
            <VehicleFilters
              typeVehiculeFilter={typeVehiculeFilter}
              setTypeVehiculeFilter={setTypeVehiculeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categorieFilter={categorieFilter}
              setCategorieFilter={setCategorieFilter}
              baseFilter={baseFilter}
              setBaseFilter={setBaseFilter}
              bases={bases}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Liste des véhicules</TabsTrigger>
              <TabsTrigger value="validation">Workflows de validation</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenances</TabsTrigger>
              <TabsTrigger value="post-mission">Post-mission</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <VehicleListTab 
                vehicles={filteredVehicles}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDocuments={handleViewDocuments}
                onViewMaintenance={handleViewMaintenance}
                onViewPostMissionWorkflow={handleViewPostMissionWorkflow}
              />
            </TabsContent>
            
            <TabsContent value="validation">
              <ValidationTab vehicles={vehicles} />
            </TabsContent>
            
            <TabsContent value="maintenance">
              <MaintenanceTab vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="post-mission">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">Processus post-mission</h3>
                  <p className="text-muted-foreground mb-4">
                    Sélectionnez un véhicule dans la liste pour accéder au workflow post-mission complet
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDocuments && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Documents - {selectedVehicle.numero}</h2>
              <Button variant="outline" onClick={handleCloseDocuments}>
                Fermer
              </Button>
            </div>
            <DocumentUploadSection vehicleId={selectedVehicle.id} />
          </div>
        </div>
      )}

      {showMaintenance && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Maintenance - {selectedVehicle.numero}</h2>
              <Button variant="outline" onClick={handleCloseMaintenance}>
                Fermer
              </Button>
            </div>
            <VehicleMaintenanceHistory vehicle={selectedVehicle} />
          </div>
        </div>
      )}

      {showPostMissionWorkflow && selectedVehicle && (
        <PostMissionWorkflow
          vehicule={selectedVehicle}
          userRole="admin" // TODO: Récupérer le vrai rôle utilisateur
          userName="Utilisateur Test" // TODO: Récupérer le vrai nom utilisateur
          userId="test-user-id" // TODO: Récupérer le vrai ID utilisateur
          onClose={handleClosePostMissionWorkflow}
        />
      )}
    </div>
  );
};

export default Fleet;
