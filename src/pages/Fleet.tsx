
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { FleetHeader } from '@/components/fleet/FleetHeader';
import { FleetStats } from '@/components/fleet/FleetStats';
import { SearchInput } from '@/components/fleet/SearchInput';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { DocumentsTab } from '@/components/fleet/DocumentsTab';

import { vehiculesService } from '@/services/vehicules';
import { chauffeursService } from '@/services/chauffeurs';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicule | null>(null);

  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll
  });

  // Fetch drivers
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll
  });

  // Fetch fleet stats
  const { data: fleetStats } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: vehiculesService.getFleetStats
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: vehiculesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Véhicule supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du véhicule');
    }
  });

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewVehicle = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicule) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      deleteVehicleMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
    handleFormClose();
  };

  if (vehiclesLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <FleetHeader onNewVehicle={handleNewVehicle} />
      
      {fleetStats && (
        <FleetStats
          total={fleetStats.total}
          disponibles={fleetStats.disponibles}
          en_mission={fleetStats.en_mission}
          maintenance={fleetStats.maintenance}
          hydrocarbures={fleetStats.hydrocarbures}
          bauxite={fleetStats.bauxite}
          maintenance_urgente={fleetStats.maintenance_urgente}
        />
      )}

      <div className="flex gap-4 items-center">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher un véhicule..."
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <VehicleListTab
            vehicles={filteredVehicles}
            onEdit={handleEditVehicle}
            onDelete={handleDeleteVehicle}
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTab vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab vehicles={vehicles} />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            vehicule={editingVehicle}
            chauffeurs={chauffeurs}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
