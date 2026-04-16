
import React, { useState, useEffect, useCallback } from 'react';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleDetailDialog } from '@/components/fleet/VehicleDetailDialog';
import { VehicleDeactivateDialog } from '@/components/fleet/VehicleDeactivateDialog';
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
  const [filteredVehiclesForExport, setFilteredVehiclesForExport] = useState<Vehicule[]>([]);
  const [vehicleToDeactivate, setVehicleToDeactivate] = useState<Vehicule | null>(null);

  // Synchroniser les véhicules filtrés avec les véhicules initiaux
  useEffect(() => {
    setFilteredVehiclesForExport(vehicles);
  }, [vehicles]);

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

  // Calculer les statistiques à partir des véhicules actifs uniquement
  const activeVehicles = React.useMemo(() => vehicles.filter(v => v.actif !== false), [vehicles]);
  
  const stats = React.useMemo(() => {
    const total = activeVehicles.length;
    const disponibles = activeVehicles.filter(v => v.statut === 'disponible').length;
    const en_mission = activeVehicles.filter(v => v.statut === 'en_mission').length;
    const maintenance = activeVehicles.filter(v => v.statut === 'maintenance').length;
    const validation_requise = activeVehicles.filter(v => v.statut === 'validation_requise').length;
    const alertes = activeVehicles.filter(v => v.validation_requise === true).length;
    const inactifs = vehicles.filter(v => v.actif === false).length;

    return {
      total,
      disponibles,
      en_mission,
      maintenance,
      validation_requise,
      alertes,
      inactifs
    };
  }, [vehicles]);

  return (
    <div className="container mx-auto px-4 py-6">
      <FleetHeader 
        onNewVehicle={() => setIsFormOpen(true)}
        onRefresh={refetch}
        vehicles={filteredVehiclesForExport}
      />
      
      {isLoading && <p>Chargement des véhicules...</p>}
      {error && <p className="text-red-500">Erreur: {error.message}</p>}

      <FleetStats stats={stats} />

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">
            Flotte active ({activeVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Sortis de la flotte ({stats.inactifs})
          </TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <VehicleListTab
            vehicles={activeVehicles}
            onEdit={handleEditVehicle}
            onDelete={async (id: string) => {
              console.log(`Suppression du véhicule avec l'ID: ${id}`);
              await refetch();
            }}
            onViewDocuments={handleViewDocuments}
            onDeactivate={setVehicleToDeactivate}
            onFilteredVehiclesChange={setFilteredVehiclesForExport}
          />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <VehicleListTab
            vehicles={inactiveVehicles}
            onEdit={handleEditVehicle}
            onDelete={async (id: string) => {
              console.log(`Suppression du véhicule avec l'ID: ${id}`);
              await refetch();
            }}
            onViewDocuments={handleViewDocuments}
            onDeactivate={setVehicleToDeactivate}
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

      <VehicleDeactivateDialog
        vehicule={vehicleToDeactivate}
        open={!!vehicleToDeactivate}
        onOpenChange={(open) => { if (!open) setVehicleToDeactivate(null); }}
        onSuccess={() => { setVehicleToDeactivate(null); refetch(); }}
      />
    </div>
  );
};

export default Fleet;
