import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wrench, ShieldAlert, FileWarning, AlertOctagon } from 'lucide-react';
import { AlerteManagement } from '@/services/managementDashboardService';

interface AlertesManagementBlockProps {
  alertes: AlerteManagement[];
}

const iconMap = {
  panne: Wrench,
  non_conformite: ShieldAlert,
  document: FileWarning,
  maintenance: Wrench,
};

const severiteConfig = {
  critique: { color: 'bg-red-100 text-red-700 border-red-200', border: 'border-l-red-500', badge: 'destructive' as const },
  haute: { color: 'bg-orange-100 text-orange-700 border-orange-200', border: 'border-l-orange-500', badge: 'secondary' as const },
  moyenne: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', border: 'border-l-yellow-500', badge: 'secondary' as const },
};

export const AlertesManagementBlock: React.FC<AlertesManagementBlockProps> = ({ alertes }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-500" />
          Alertes Management
          {alertes.length > 0 && (
            <Badge variant="destructive" className="text-xs ml-auto">
              {alertes.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Problèmes nécessitant une attention immédiate</p>
      </CardHeader>
      <CardContent>
        {alertes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600">Aucune alerte</p>
            <p className="text-xs">Tout est sous contrôle</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {alertes.map((alerte, index) => {
              const config = severiteConfig[alerte.severite];
              const Icon = iconMap[alerte.type];
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${config.border} bg-muted/50`}
                >
                  <div className={`p-1.5 rounded-md ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alerte.titre}</p>
                    <p className="text-xs text-muted-foreground truncate">{alerte.description}</p>
                  </div>
                  <Badge variant={config.badge} className="text-[10px] uppercase shrink-0">
                    {alerte.severite}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
