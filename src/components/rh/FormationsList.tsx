import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GraduationCap, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';
import { useNavigate } from 'react-router-dom';

export const FormationsList = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['formations-stats'],
    queryFn: formationsService.getStats,
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes-formation'],
    queryFn: formationsService.getThemes,
  });

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
          <Button onClick={() => navigate('/formations')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Module complet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Formations valides</h4>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats?.valides ?? 0}</p>
              <p className="text-sm text-muted-foreground">Certifications à jour</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">À renouveler</h4>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats?.aRenouveler ?? 0}</p>
              <p className="text-sm text-muted-foreground">Expire sous 30 jours</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Expirées</h4>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats?.expirees ?? 0}</p>
              <p className="text-sm text-muted-foreground">Action requise</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Thèmes de formations</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map(theme => (
                <div key={theme.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="text-sm">{theme.nom}</span>
                  {theme.obligatoire && <Badge variant="outline">Obligatoire</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
