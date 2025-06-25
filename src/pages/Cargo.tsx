
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChargementsStats } from '@/components/cargo/ChargementsStats';
import { ChargementsTable } from '@/components/cargo/ChargementsTable';
import { ChargementForm } from '@/components/cargo/ChargementForm';
import { CargoDebug } from '@/components/cargo/CargoDebug';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { chargementsService } from '@/services/chargements';

const Cargo = () => {
  const { hasPermission, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedChargement, setSelectedChargement] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  console.log('Cargo page loaded - User:', user);
  console.log('Has cargo_read permission:', hasPermission('cargo_read'));

  const { data: chargements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['chargements'],
    queryFn: chargementsService.getAll,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['chargements-stats'],
    queryFn: chargementsService.getStats,
    refetchInterval: 60000,
  });

  console.log('Chargements data:', chargements);
  console.log('Stats data:', stats);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  const handleCreateChargement = () => {
    setSelectedChargement(null);
    setShowForm(true);
  };

  const handleEditChargement = (chargement: any) => {
    setSelectedChargement(chargement);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedChargement(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedChargement(null);
  };

  if (!hasPermission('cargo_read')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à ce module.</p>
          <Button 
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            className="mt-4"
          >
            {showDebug ? 'Masquer' : 'Afficher'} les informations de debug
          </Button>
          {showDebug && (
            <div className="mt-4">
              <CargoDebug />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur de chargement</h1>
          <p className="text-gray-600 mt-2">Une erreur s'est produite lors du chargement des données.</p>
          <Button 
            onClick={() => refetch()}
            className="mt-4 bg-orange-500 hover:bg-orange-600"
          >
            Réessayer
          </Button>
          <Button 
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            className="mt-4 ml-2"
          >
            {showDebug ? 'Masquer' : 'Afficher'} les détails de l'erreur
          </Button>
          {showDebug && (
            <div className="mt-4">
              <CargoDebug />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ChargementForm
        chargement={selectedChargement}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suivi des chargements</h1>
          <p className="text-gray-600 mt-1">
            Gestion et traçabilité des chargements effectués
          </p>
        </div>
        <div className="flex space-x-2">
          {hasPermission('cargo_write') && (
            <Button 
              onClick={handleCreateChargement}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau chargement
            </Button>
          )}
          <Button 
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            size="sm"
          >
            Debug
          </Button>
        </div>
      </div>

      {showDebug && (
        <CargoDebug />
      )}

      {stats && <ChargementsStats {...stats} />}

      <ChargementsTable
        chargements={chargements}
        onEdit={handleEditChargement}
        hasWritePermission={hasPermission('cargo_write')}
        onRefresh={refetch}
      />
    </div>
  );
};

export default Cargo;
