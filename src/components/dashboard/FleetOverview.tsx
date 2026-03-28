import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, CheckCircle, Clock, Wrench, AlertTriangle } from 'lucide-react';

interface FleetOverviewProps {
  total: number;
  disponibles: number;
  enMission: number;
  maintenance: number;
  validation: number;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  total,
  disponibles,
  enMission,
  maintenance,
  validation,
}) => {
  const segments = [
    { label: 'Disponibles', value: disponibles, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { label: 'En mission', value: enMission, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Maintenance', value: maintenance, color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Validation', value: validation, color: 'bg-amber-500', textColor: 'text-amber-600' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Répartition Flotte
          <span className="text-sm font-normal text-muted-foreground ml-auto">{total} véhicules</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="w-full h-6 rounded-full overflow-hidden flex bg-muted mb-4">
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={i}
                className={`${seg.color} transition-all duration-700`}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${seg.value}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${seg.color}`} />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
              <span className={`text-sm font-bold ml-auto ${seg.textColor}`}>{seg.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
