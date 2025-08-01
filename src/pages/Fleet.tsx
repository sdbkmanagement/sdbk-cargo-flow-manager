
import React, { useState, useEffect, useCallback } from 'react';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleDetailDialog } from '@/components/fleet/VehicleDetailDialog';
import { useVehicles } from '@/hooks/useVehicles';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { VehicleSyncDiagnostic } from '@/components/fleet/VehicleSyncDiagnostic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Vehicule } from '@/services/vehicules';

const Fleet = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: vehicles = [], isLoading, error, refetch } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicule | null>(null);

  const handleEditVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedVehicleId(null);
    refetch();
  }, [refetch]);

  const handleViewDocuments = useCallback((vehicle: Vehicule) => {
    setSelectedVehicleForDetails(vehicle);
  }, []);

  // Calculer les statistiques à partir des véhicules
  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const disponibles = vehicles.filter(v => v.statut === 'disponible').length;
    const en_mission = vehicles.filter(v => v.statut === 'en_mission').length;
    const maintenance = vehicles.filter(v => v.statut === 'maintenance').length;
    const validation_requise = vehicles.filter(v => v.statut === 'validation_requise').length;
    const alertes = vehicles.filter(v => v.validation_requise === true).length;

    return {
      total,
      disponibles,
      en_mission,
      maintenance,
      validation_requise,
      alertes
    };
  }, [vehicles]);

  return (
    <div className="container mx-auto px-4 py-6">
      <FleetHeader 
        onNewVehicle={() => setIsFormOpen(true)}
        onRefresh={refetch}
      />
      
      {isLoading && <p>Chargement des véhicules...</p>}
      {error && <p className="text-red-500">Erreur: {error.message}</p>}

      <FleetStats stats={stats} />

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Liste des véhicules</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic de synchronisation</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <VehicleListTab
            vehicles={vehicles}
            onEdit={handleEditVehicle}
            onDelete={async (id: string) => {
              // Implémenter la logique de suppression ici
              console.log(`Suppression du véhicule avec l'ID: ${id}`);
              await refetch(); // Refresh vehicle list after deletion
            }}
            onViewDocuments={handleViewDocuments}
          />
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-4">
          <VehicleSyncDiagnostic />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicleId ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            vehicule={selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId) : undefined}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <VehicleDetailDialog
        vehicule={selectedVehicleForDetails}
        open={!!selectedVehicleForDetails}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVehicleForDetails(null);
          }
        }}
      />
    </div>
  );
};

export default Fleet;
