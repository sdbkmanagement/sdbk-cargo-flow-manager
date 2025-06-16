
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Wrench } from 'lucide-react';

export const MaintenanceTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance des véhicules
              </CardTitle>
              <CardDescription>
                Planifiez et suivez les maintenances de votre flotte
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle maintenance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune maintenance programmée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter une maintenance pour vos véhicules.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertes de maintenance</CardTitle>
          <CardDescription>
            Véhicules nécessitant une attention particulière
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Maintenance préventive recommandée</p>
                <p className="text-sm text-gray-500">Basée sur le kilométrage et l'historique</p>
              </div>
              <Badge variant="secondary">À planifier</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
