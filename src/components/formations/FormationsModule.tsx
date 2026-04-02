import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormationsDashboard } from './FormationsDashboard';
import { FormationsListView } from './FormationsListView';
import { ThemesManagement } from './ThemesManagement';
import { FormationsAlerts } from './FormationsAlerts';
import { MatriceFormation } from './MatriceFormation';

export const FormationsModule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Formations & Recyclage</h1>
        <p className="text-muted-foreground mt-1">
          Suivi des formations obligatoires et certifications des chauffeurs et du personnel
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="matrice">Matrice</TabsTrigger>
          <TabsTrigger value="formations">Chauffeurs</TabsTrigger>
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FormationsDashboard />
        </TabsContent>
        <TabsContent value="matrice">
          <MatriceFormation />
        </TabsContent>
        <TabsContent value="formations">
          <FormationsListView />
        </TabsContent>
        <TabsContent value="themes">
          <ThemesManagement />
        </TabsContent>
        <TabsContent value="alertes">
          <FormationsAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
};
