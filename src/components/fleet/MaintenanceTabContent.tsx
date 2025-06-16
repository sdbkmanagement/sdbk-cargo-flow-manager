
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const MaintenanceTabContent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planification maintenance</CardTitle>
        <CardDescription>
          Gérez les maintenances préventives et correctives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Module de maintenance en développement...</p>
      </CardContent>
    </Card>
  );
};
