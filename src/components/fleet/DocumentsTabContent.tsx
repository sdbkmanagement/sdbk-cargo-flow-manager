
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const DocumentsTabContent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents véhicules</CardTitle>
        <CardDescription>
          Suivi des assurances, contrôles techniques, etc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Module de gestion documentaire en développement...</p>
      </CardContent>
    </Card>
  );
};
