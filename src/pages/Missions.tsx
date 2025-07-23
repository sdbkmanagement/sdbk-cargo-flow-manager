
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MissionsStats } from '@/components/missions/MissionsStats';
import { MissionsTable } from '@/components/missions/MissionsTable';
import { MissionForm } from '@/components/missions/MissionForm';
import { RefreshButton } from '@/components/common/RefreshButton';
import { missionsService } from '@/services/missions';
import { useQueryClient } from '@tanstack/react-query';

const Missions = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: missionsService.getAll,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['available-vehicules'] });
    queryClient.invalidateQueries({ queryKey: ['available-chauffeurs'] });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Missions</h1>
          <p className="text-muted-foreground">Planification et suivi des missions</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Mission
          </Button>
        </div>
      </div>

      <MissionsStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="list">Liste des missions</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <MissionsTable missions={missions} />
        </TabsContent>
      </Tabs>

      {showForm && (
        <MissionForm
          onSuccess={() => {
            setShowForm(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default Missions;
