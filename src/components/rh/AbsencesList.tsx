
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Download } from 'lucide-react';

export const AbsencesList = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Absences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Suivi des congés, arrêts maladie et autres absences
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Absence
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Planning des absences */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Congés payés</h4>
                <Badge variant="secondary">3 en cours</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Personnel actuellement en congé
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Arrêts maladie</h4>
                <Badge variant="destructive">1 en cours</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Personnel en arrêt maladie
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Formations</h4>
                <Badge variant="outline">2 planifiées</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Formations à venir
              </p>
            </div>
          </div>

          {/* Tableau des absences récentes */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Absences récentes</h4>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune absence récente</p>
              <p className="text-sm">Les absences apparaîtront ici une fois saisies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
