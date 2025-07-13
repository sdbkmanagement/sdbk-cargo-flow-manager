
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { ChargementsStats } from '@/components/cargo/ChargementsStats';
import { ChargementsTable } from '@/components/cargo/ChargementsTable';
import { ChargementsForm } from '@/components/cargo/ChargementsForm';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chargementsService } from '@/services/chargements';

const Cargo = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedChargement, setSelectedChargement] = useState(null);
  const [filters, setFilters] = useState({});

  const { data: chargements = [], isLoading, error, isError } = useQuery({
    queryKey: ['chargements', filters],
    queryFn: () => chargementsService.getChargements(filters),
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['chargements-stats'],
    queryFn: chargementsService.getStatistiques,
    retry: 2,
    enabled: !isError,
  });

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
    queryClient.invalidateQueries({ queryKey: ['chargements'] });
    queryClient.invalidateQueries({ queryKey: ['chargements-stats'] });
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
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement des chargements...</p>
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
          <p className="text-gray-600 mb-4">Impossible de charger les données des chargements</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['chargements'] })}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ChargementsForm
        initialData={selectedChargement}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des chargements</h1>
          <p className="text-gray-600 mt-1">
            Suivi et gestion des chargements de marchandises
          </p>
        </div>
        {hasPermission('cargo_write') && (
          <Button 
            onClick={handleCreateChargement}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau chargement
          </Button>
        )}
      </div>

      {stats && (
        <ChargementsStats
          totalChargements={stats.totalChargements}
          chargementsLivres={stats.chargementsLivres}
          chargementsEnCours={stats.chargementsEnCours}
          chargementsAnnules={stats.chargementsAnnules}
          hydrocarbures={stats.hydrocarbures}
          bauxite={stats.bauxite}
          volumeTotal={stats.volumeTotal}
        />
      )}

      <ChargementsTable
        data={chargements}
        onEdit={handleEditChargement}
        hasWritePermission={hasPermission('cargo_write')}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['chargements'] })}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export default Cargo;
