import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText } from 'lucide-react';
import { BLParJour } from '@/services/managementDashboardService';

interface BLParJourChartProps {
  data: BLParJour[];
}

export const BLParJourChart: React.FC<BLParJourChartProps> = ({ data }) => {
  const totalAujourdhui = data.length > 0 ? data[data.length - 1].count : 0;
  const totalSemaine = data.slice(-7).reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            BL saisis par jour
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Aujourd'hui</p>
              <p className="font-bold text-lg text-primary">{totalAujourdhui}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">7 derniers jours</p>
              <p className="font-bold text-lg text-blue-600">{totalSemaine}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(-14)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${value} BL`, 'Nombre']}
                labelFormatter={(label: string) => `Date: ${label}`}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
