
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Users } from 'lucide-react';

interface Alerte {
  type_alerte: string;
  employe_id: string;
  nom_complet: string;
  poste: string;
  service: string;
  message: string;
  date_echeance: string;
  priorite: string;
}

interface AlertesRHProps {
  alertes: Alerte[];
}

export const AlertesRH = ({ alertes }: AlertesRHProps) => {
  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'bg-red-500';
      case 'important': return 'bg-orange-500';
      default: return 'bg-yellow-500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fin_contrat': return Clock;
      case 'formation_expire': return Users;
      case 'absence_longue': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Alertes RH ({alertes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertes.slice(0, 5).map((alerte, index) => {
          const Icon = getAlertIcon(alerte.type_alerte);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">{alerte.nom_complet}</p>
                  <p className="text-xs text-muted-foreground">
                    {alerte.poste} - {alerte.service}
                  </p>
                  <p className="text-sm text-orange-700">{alerte.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getPriorityColor(alerte.priorite)} text-white`}>
                  {alerte.priorite}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(alerte.date_echeance).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          );
        })}
        {alertes.length > 5 && (
          <p className="text-center text-sm text-muted-foreground">
            ... et {alertes.length - 5} autres alertes
          </p>
        )}
      </CardContent>
    </Card>
  );
};
