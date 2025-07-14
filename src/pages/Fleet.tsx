
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Download, Upload, AlertTriangle } from 'lucide-react';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { SearchInput } from '@/components/fleet/SearchInput';
import { VehicleFilters } from '@/components/fleet/VehicleFilters';
import vehiculesService from '@/services/vehicules';
import type { Vehicule, FleetStatsData } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';

const Fleet = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeVehiculeFilter, setTypeVehiculeFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [baseFilter, setBaseFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des véhicules avec gestion d'erreur améliorée
  const { data: vehicles = [], isLoading, error, isError } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Récupération des statistiques
  const { data: stats } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: vehiculesService.getFleetStats,
    retry: 2,
    enabled: !isError,
  });

  // Récupération des bases
  const { data: bases = [] } = useQuery({
    queryKey: ['vehicle-bases'],
    queryFn: vehiculesService.getBases,
    retry: 2,
    enabled: !isError,
  });

  const handleEdit = (vehicle: Vehicule) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
    handleFormClose();
    toast({
      title: 'Succès',
      description: 'Véhicule sauvegardé avec succès',
    });
  };

  // Filtrage des véhicules avec type guards
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = 
      vehicle.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marque?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <p className="text-lg font-medium">Chargement de la flotte...</p>
          <p className="text-sm text-gray-500 mt-2">Connexion à la base de données</p>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données de la flotte</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}
            variant="outline"
          >
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion de la flotte</h1>
          <p className="text-gray-600 mt-1">
            {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau véhicule
          </Button>
        </div>
      </div>

      {stats && <FleetStats stats={stats} />}

      <Card>
        <CardHeader>
          <CardTitle>Gestion de la flotte</CardTitle>
          <CardDescription>
            Gérez vos véhicules, maintenances et documents
          </CardDescription>
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
              <TabsTrigger value="maintenance">Maintenances</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <VehicleListTab 
                vehicles={filteredVehicles}
                onEdit={handleEdit}
                onDelete={async () => {}}
                onViewDocuments={() => {}}
                onViewMaintenance={() => {}}
                onViewPostMissionWorkflow={() => {}}
              />
            </TabsContent>
            
            <TabsContent value="maintenance">
              <MaintenanceTab vehicles={vehicles} />
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
    </div>
  );
};

export default Fleet;
