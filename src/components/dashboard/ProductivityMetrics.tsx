import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Clock, TrendingUp, Percent } from 'lucide-react';

interface ProductivityMetricsProps {
  totalVehicules: number;
  vehiculesEnMission: number;
  vehiculesMaintenance: number;
  missionsTerminees: number;
  missionsTotal: number;
  blTotal: number;
}

export const ProductivityMetrics: React.FC<ProductivityMetricsProps> = ({
  totalVehicules,
  vehiculesEnMission,
  vehiculesMaintenance,
  missionsTerminees,
  missionsTotal,
  blTotal,
}) => {
  const tauxUtilisation = totalVehicules > 0 ? (vehiculesEnMission / totalVehicules) * 100 : 0;
  const tauxImmobilisation = totalVehicules > 0 ? (vehiculesMaintenance / totalVehicules) * 100 : 0;
  const tauxCompletionMissions = missionsTotal > 0 ? (missionsTerminees / missionsTotal) * 100 : 0;
  const blParVehicule = totalVehicules > 0 ? (blTotal / totalVehicules).toFixed(1) : '0';

  const metrics = [
    {
      label: 'Taux d\'utilisation',
      value: `${tauxUtilisation.toFixed(1)}%`,
      icon: Gauge,
      color: tauxUtilisation > 60 ? 'text-emerald-600' : tauxUtilisation > 30 ? 'text-amber-600' : 'text-red-600',
      bgColor: tauxUtilisation > 60 ? 'bg-emerald-100' : tauxUtilisation > 30 ? 'bg-amber-100' : 'bg-red-100',
      progress: tauxUtilisation,
      progressColor: tauxUtilisation > 60 ? 'bg-emerald-500' : tauxUtilisation > 30 ? 'bg-amber-500' : 'bg-red-500',
    },
    {
      label: 'Taux d\'immobilisation',
      value: `${tauxImmobilisation.toFixed(1)}%`,
      icon: Clock,
      color: tauxImmobilisation < 15 ? 'text-emerald-600' : tauxImmobilisation < 30 ? 'text-amber-600' : 'text-red-600',
      bgColor: tauxImmobilisation < 15 ? 'bg-emerald-100' : tauxImmobilisation < 30 ? 'bg-amber-100' : 'bg-red-100',
      progress: tauxImmobilisation,
      progressColor: tauxImmobilisation < 15 ? 'bg-emerald-500' : tauxImmobilisation < 30 ? 'bg-amber-500' : 'bg-red-500',
    },
    {
      label: 'Complétion missions',
      value: `${tauxCompletionMissions.toFixed(1)}%`,
      icon: TrendingUp,
      color: tauxCompletionMissions > 80 ? 'text-emerald-600' : tauxCompletionMissions > 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: tauxCompletionMissions > 80 ? 'bg-emerald-100' : tauxCompletionMissions > 50 ? 'bg-amber-100' : 'bg-red-100',
      progress: tauxCompletionMissions,
      progressColor: tauxCompletionMissions > 80 ? 'bg-emerald-500' : tauxCompletionMissions > 50 ? 'bg-amber-500' : 'bg-red-500',
    },
    {
      label: 'BL moyen / véhicule',
      value: blParVehicule,
      icon: Percent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progress: null,
      progressColor: '',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Productivité & Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${m.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                {m.progress !== null && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.progressColor} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(m.progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
