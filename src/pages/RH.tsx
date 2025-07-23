
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RHStats } from '@/components/rh/RHStats';
import { EmployesList } from '@/components/rh/EmployesList';
import { FormationsList } from '@/components/rh/FormationsList';
import { AbsencesList } from '@/components/rh/AbsencesList';
import { AlertesRH } from '@/components/rh/AlertesRH';
import { RefreshButton } from '@/components/common/RefreshButton';
import { rhService } from '@/services/rh';
import { useQueryClient } from '@tanstack/react-query';

const RH = () => {
  const [activeTab, setActiveTab] = useState('employes');
  const queryClient = useQueryClient();

  const { data: employes = [], isLoading: employesLoading } = useQuery({
    queryKey: ['employes'],
    queryFn: () => rhService.getEmployes(),
  });

  const { data: alertes = [], isLoading: alertesLoading } = useQuery({
    queryKey: ['alertes-rh'],
    queryFn: rhService.getAlertesRH,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['employes'] });
    queryClient.invalidateQueries({ queryKey: ['alertes-rh'] });
  };

  const isLoading = employesLoading || alertesLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ressources Humaines</h1>
          <p className="text-muted-foreground">Gestion du personnel et des formations</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RHStats />
        </div>
        <div>
          <AlertesRH />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employes">Employés</TabsTrigger>
          <TabsTrigger value="formations">Formations</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
        </TabsList>

        <TabsContent value="employes" className="space-y-6">
          <EmployesList 
            employes={employes}
            isLoading={employesLoading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="formations" className="space-y-6">
          <FormationsList />
        </TabsContent>

        <TabsContent value="absences" className="space-y-6">
          <AbsencesList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RH;
