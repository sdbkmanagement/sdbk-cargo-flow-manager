import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CAMensuel } from '@/services/managementDashboardService';

interface CAEvolutionChartProps {
  data: CAMensuel[];
}

const formatGNF = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
  return value.toLocaleString('fr-FR');
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-sm text-emerald-600">{formatGNF(payload[0].value)} GNF</p>
      <p className="text-xs text-muted-foreground">{payload[0].payload.nbBL} BL</p>
    </div>
  );
};

export const CAEvolutionChart: React.FC<CAEvolutionChartProps> = ({ data }) => {
  const maxCA = Math.max(...data.map(d => d.ca), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Évolution du Chiffre d'Affaires
        </CardTitle>
        <p className="text-xs text-muted-foreground">CA mensuel basé sur les BL (12 derniers mois)</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => formatGNF(v)}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ca" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {data.map((entry, index) => {
                  const isLast = index === data.length - 1;
                  const prev = index > 0 ? data[index - 1].ca : entry.ca;
                  const trend = entry.ca >= prev;
                  return (
                    <Cell
                      key={entry.mois}
                      fill={isLast ? 'hsl(var(--primary))' : trend ? '#10b981' : '#f59e0b'}
                      opacity={isLast ? 1 : 0.75}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
