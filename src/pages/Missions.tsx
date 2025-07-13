
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { MissionsStats } from '@/components/missions/MissionsStats';
import { MissionsTable } from '@/components/missions/MissionsTable';
import { MissionForm } from '@/components/missions/MissionForm';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';

const Missions = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  const { data: missions = [], isLoading, error, isError } = useQuery({
    queryKey: ['missions'],
    queryFn: missionsService.getAll,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['missions-stats'],
    queryFn: missionsService.getStats,
    retry: 2,
    enabled: !isError,
  });

  const handleCreateMission = () => {
    setSelectedMission(null);
    setShowForm(true);
  };

  const handleEditMission = (mission: any) => {
    setSelectedMission(mission);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMission(null);
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['missions-stats'] });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMission(null);
  };

  if (!hasPermission('missions_read')) {
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
          <p className="text-lg font-medium">Chargement des missions...</p>
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
          <p className="text-gray-600 mb-4">Impossible de charger les données des missions</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
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
      <MissionForm
        mission={selectedMission}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planification des missions</h1>
          <p className="text-gray-600 mt-1">
            Gestion et planification des missions de transport
          </p>
        </div>
        {hasPermission('missions_write') && (
          <Button 
            onClick={handleCreateMission}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle mission
          </Button>
        )}
      </div>

      {stats && (
        <MissionsStats
          total={stats.total}
          en_attente={stats.en_attente}
          en_cours={stats.en_cours}
          terminees={stats.terminees}
          annulees={stats.annulees}
          ce_mois={stats.ce_mois || 0}
          hydrocarbures={stats.hydrocarbures}
          bauxite={stats.bauxite}
          volume_total={stats.volume_total || 0}
        />
      )}

      <MissionsTable
        missions={missions}
        onEdit={handleEditMission}
        hasWritePermission={hasPermission('missions_write')}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
      />
    </div>
  );
};

export default Missions;
