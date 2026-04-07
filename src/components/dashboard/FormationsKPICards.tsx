import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, CheckCircle, AlertTriangle, XCircle, Users, TrendingUp } from 'lucide-react';
import { FormationsKPIs } from '@/services/managementDashboardService';

interface FormationsKPICardsProps {
  data: FormationsKPIs;
}

export const FormationsKPICards: React.FC<FormationsKPICardsProps> = ({ data }) => {
  const kpis = [
    {
      label: 'Formations valides',
      value: data.valides,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: 'À renouveler',
      value: data.aRenouveler,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Expirées',
      value: data.expirees,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Taux conformité',
      value: `${data.tauxConformite}%`,
      icon: TrendingUp,
      color: data.tauxConformite >= 80 ? 'text-emerald-600' : data.tauxConformite >= 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: data.tauxConformite >= 80 ? 'bg-emerald-100' : data.tauxConformite >= 50 ? 'bg-amber-100' : 'bg-red-100',
    },
    {
      label: 'Compagnonnages à jour',
      value: data.compagnonnagesAJour,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Compagnonnages expirés',
      value: data.compagnonnagesExpires,
      icon: XCircle,
      color: data.compagnonnagesExpires > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: data.compagnonnagesExpires > 0 ? 'bg-red-100' : 'bg-emerald-100',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Formations & Compagnonnage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${kpi.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
