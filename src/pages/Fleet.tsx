
import React, { useState, useEffect, useCallback } from 'react';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { FleetStats } from '@/components/fleet/FleetStats';
import { useVehicles } from '@/hooks/useVehicles';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Fleet = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: vehicles = [], isLoading, error, refetch } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleEditVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedVehicleId(null);
    refetch();
  }, [refetch]);

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

      <VehicleListTab
        vehicles={vehicles}
        onEdit={handleEditVehicle}
        onDelete={async (id: string) => {
          // Implémenter la logique de suppression ici
          console.log(`Suppression du véhicule avec l'ID: ${id}`);
          await refetch(); // Refresh vehicle list after deletion
        }}
        onViewDocuments={(vehicle) => {
          // Implémenter la logique pour afficher les documents ici
          console.log(`Affichage des documents pour le véhicule: ${vehicle.numero}`);
        }}
      />

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
    </div>
  );
};

export default Fleet;
