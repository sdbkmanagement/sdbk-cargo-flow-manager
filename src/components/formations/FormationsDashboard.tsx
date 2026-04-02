import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, GraduationCap, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';
import { chauffeursService } from '@/services/chauffeurs';

export const FormationsDashboard = () => {
  const { data: formations = [] } = useQuery({
    queryKey: ['formations'],
    queryFn: formationsService.getAll,
  });

  const { data: stats } = useQuery({
    queryKey: ['formations-stats'],
    queryFn: formationsService.getStats,
  });

  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  const valides = formations.filter(f => f.statut === 'valide');
  const aRenouveler = formations.filter(f => f.statut === 'a_renouveler');
  const expirees = formations.filter(f => f.statut === 'expire');

  // Chauffeurs non conformes
  const chauffeursActifs = chauffeurs.filter(c => c.statut === 'actif');

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Formations valides</p>
                <p className="text-3xl font-bold text-green-600">{valides.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À renouveler</p>
                <p className="text-3xl font-bold text-orange-600">{aRenouveler.length}</p>
                <p className="text-xs text-muted-foreground">≤ 30 jours</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirées</p>
                <p className="text-3xl font-bold text-red-600">{expirees.length}</p>
                <p className="text-xs text-muted-foreground">Action requise</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux conformité</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.tauxConformite ?? 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chauffeurs non conformes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Formations expirées par chauffeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expirees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>Tous les chauffeurs sont conformes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expirees.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div>
                    <p className="font-medium">
                      {(f as any).chauffeurs?.prenom} {(f as any).chauffeurs?.nom}
                      {(f as any).chauffeurs?.matricule && (
                        <span className="text-muted-foreground ml-2">({(f as any).chauffeurs.matricule})</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(f as any).themes_formation?.nom}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Expiré</Badge>
                    {f.date_recyclage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Depuis le {new Date(f.date_recyclage).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formations à renouveler */}
      {aRenouveler.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Formations à renouveler sous 30 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aRenouveler.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">
                      {(f as any).chauffeurs?.prenom} {(f as any).chauffeurs?.nom}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(f as any).themes_formation?.nom}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-500">À renouveler</Badge>
                    {f.date_recyclage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expire le {new Date(f.date_recyclage).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
