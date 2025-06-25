
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MissionsStats } from '@/components/missions/MissionsStats';
import { MissionsTable } from '@/components/missions/MissionsTable';
import { MissionForm } from '@/components/missions/MissionForm';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';

const Missions = () => {
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: ['missions'],
    queryFn: missionsService.getAll,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['missions-stats'],
    queryFn: missionsService.getStats,
    refetchInterval: 60000,
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
    refetch();
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
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des missions...</p>
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

      {stats && <MissionsStats {...stats} />}

      <MissionsTable
        missions={missions}
        onEdit={handleEditMission}
        hasWritePermission={hasPermission('missions_write')}
        onRefresh={refetch}
      />
    </div>
  );
};

export default Missions;
