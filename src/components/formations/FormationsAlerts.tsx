import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';

export const FormationsAlerts = () => {
  const { data: formations = [] } = useQuery({
    queryKey: ['formations'],
    queryFn: formationsService.getAll,
  });

  // Alertes 7 jours
  const alertes7j = formations.filter(f => {
    if (!f.date_recyclage) return false;
    const diff = (new Date(f.date_recyclage).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  // Alertes 30 jours
  const alertes30j = formations.filter(f => {
    if (!f.date_recyclage) return false;
    const diff = (new Date(f.date_recyclage).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 7 && diff <= 30;
  });

  // Expirées
  const expirees = formations.filter(f => f.statut === 'expire');

  return (
    <div className="space-y-6">
      {/* Alertes critiques - 7 jours */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Alertes critiques – Expire sous 7 jours ({alertes7j.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertes7j.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune alerte critique</p>
          ) : (
            <div className="space-y-2">
              {alertes7j.map(f => {
                const jours = Math.ceil((new Date(f.date_recyclage!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">{(f as any).chauffeurs?.prenom} {(f as any).chauffeurs?.nom}</p>
                      <p className="text-sm text-muted-foreground">{(f as any).themes_formation?.nom}</p>
                    </div>
                    <Badge variant="destructive">{jours} jour{jours > 1 ? 's' : ''}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertes 30 jours */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            À renouveler – Expire sous 30 jours ({alertes30j.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertes30j.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune alerte</p>
          ) : (
            <div className="space-y-2">
              {alertes30j.map(f => {
                const jours = Math.ceil((new Date(f.date_recyclage!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">{(f as any).chauffeurs?.prenom} {(f as any).chauffeurs?.nom}</p>
                      <p className="text-sm text-muted-foreground">{(f as any).themes_formation?.nom}</p>
                    </div>
                    <Badge className="bg-orange-500">{jours} jours</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formations expirées */}
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Bell className="w-5 h-5" />
            Formations expirées ({expirees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expirees.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune formation expirée</p>
          ) : (
            <div className="space-y-2">
              {expirees.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-300">
                  <div>
                    <p className="font-medium">{(f as any).chauffeurs?.prenom} {(f as any).chauffeurs?.nom}</p>
                    <p className="text-sm text-muted-foreground">{(f as any).themes_formation?.nom}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Expiré</Badge>
                    {f.date_recyclage && (
                      <p className="text-xs text-muted-foreground">
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
    </div>
  );
};
