import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, FileCheck, Shield, Radio, Truck } from 'lucide-react';
import { PipelineData } from '@/services/managementDashboardService';

interface PipelineFunnelProps {
  data: PipelineData;
}

const steps = [
  { key: 'maintenance' as const, label: 'Maintenance', icon: Wrench, color: 'bg-orange-500' },
  { key: 'administratif' as const, label: 'Administratif', icon: FileCheck, color: 'bg-blue-500' },
  { key: 'hsecq' as const, label: 'HSECQ', icon: Shield, color: 'bg-yellow-500' },
  { key: 'obc' as const, label: 'OBC', icon: Radio, color: 'bg-purple-500' },
  { key: 'disponibles' as const, label: 'Disponible', icon: Truck, color: 'bg-emerald-500' },
];

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ data }) => {
  const maxValue = Math.max(...Object.values(data), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Pipeline Opérationnel
        </CardTitle>
        <p className="text-xs text-muted-foreground">Véhicules en attente de validation par étape</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const value = data[step.key];
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const StepIcon = step.icon;
            
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${step.color} text-white`}>
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium w-28 truncate">{step.label}</span>
                <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {value}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <span className="text-muted-foreground text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
