
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { ValidationTab } from '@/components/fleet/ValidationTab';
import { RefreshButton } from '@/components/common/RefreshButton';
import { vehiculesService } from '@/services/vehicules';
import { useQueryClient } from '@tanstack/react-query';

const Fleet = () => {
  const [activeTab, setActiveTab] = useState('list');
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicules'],
    queryFn: vehiculesService.getVehicules,
  });

  const { data: fleetStats } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: vehiculesService.getFleetStats,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicules'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
    queryClient.invalidateQueries({ queryKey: ['available-vehicules'] });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Flotte</h1>
          <p className="text-muted-foreground">Suivi et gestion des véhicules</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      {fleetStats && <FleetStats stats={fleetStats} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Liste des véhicules</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <VehicleListTab vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceTab vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <ValidationTab vehicles={vehicles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fleet;
