import React, { useState, useEffect, useCallback } from 'react';
import { VehicleForm } from '@/components/fleet/form/VehicleForm';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { FleetStats } from '@/components/fleet/FleetStats';
import { useVehicles } from '@/hooks/useVehicles';
import { FleetHeader } from '@/components/fleet/FleetHeader';

const Fleet = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { vehicles, isLoading, error, refetch } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleEditVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setIsFormOpen(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <FleetHeader 
        onNewVehicle={() => setIsFormOpen(true)}
        onRefresh={refetch}
      />
      
      {isLoading && <p>Chargement des véhicules...</p>}
      {error && <p className="text-red-500">Erreur: {error.message}</p>}

      <FleetStats vehicles={vehicles} />

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

      {isFormOpen && (
        <VehicleForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedVehicleId(null);
            refetch(); // Refresh vehicle list after form close
          }}
          vehicleId={selectedVehicleId}
        />
      )}
    </div>
  );
};

export default Fleet;
