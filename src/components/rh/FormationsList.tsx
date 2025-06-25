
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GraduationCap, AlertTriangle, CheckCircle } from 'lucide-react';

export const FormationsList = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Formations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Suivi des formations obligatoires et certifications
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Formation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistiques formations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Formations valides</h4>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">24</p>
              <p className="text-sm text-muted-foreground">Certifications à jour</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">À renouveler</h4>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">5</p>
              <p className="text-sm text-muted-foreground">Expire sous 30 jours</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Expirées</h4>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">2</p>
              <p className="text-sm text-muted-foreground">Action requise</p>
            </div>
          </div>

          {/* Types de formations */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Types de formations suivies</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Sécurité routière</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Matières dangereuses</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Premiers secours</span>
                <Badge variant="outline">15</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">CACES</span>
                <Badge variant="outline">6</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Qualité environnement</span>
                <Badge variant="outline">10</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Autres</span>
                <Badge variant="outline">4</Badge>
              </div>
            </div>
          </div>

          {/* Liste des formations récentes */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Formations récentes</h4>
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune formation récente</p>
              <p className="text-sm">Les formations apparaîtront ici une fois saisies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
