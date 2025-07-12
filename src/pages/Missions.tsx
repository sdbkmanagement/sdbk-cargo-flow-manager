
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MissionsTable } from '@/components/missions/MissionsTable';
import { MissionForm } from '@/components/missions/MissionForm';
import { MissionsStats } from '@/components/missions/MissionsStats';

const Missions = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('liste');

  // Vérifier les permissions d'écriture
  const hasWritePermission = hasRole('transport') || hasRole('admin') || hasRole('direction');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Missions</h1>
          <p className="text-gray-600 mt-2">
            Planification et suivi des missions de transport
          </p>
        </div>
      </div>

      <MissionsStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="liste">Liste des missions</TabsTrigger>
          {hasWritePermission && (
            <TabsTrigger value="nouvelle">Nouvelle mission</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="liste" className="space-y-6">
          <MissionsTable />
        </TabsContent>

        {hasWritePermission && (
          <TabsContent value="nouvelle" className="space-y-6">
            <MissionForm onSuccess={() => setActiveTab('liste')} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Missions;
