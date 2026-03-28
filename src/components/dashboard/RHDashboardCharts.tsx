import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Users, Briefcase, Heart, UserCheck } from 'lucide-react';
import { RHStats } from '@/services/managementDashboardService';

interface RHDashboardChartsProps {
  stats: RHStats;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{payload[0].name || payload[0].payload?.name}: {payload[0].value}</p>
    </div>
  );
};

export const RHDashboardCharts: React.FC<RHDashboardChartsProps> = ({ stats }) => {
  if (stats.totalEmployes === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Ressources Humaines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Aucun employé enregistré</p>
            <p className="text-xs">Ajoutez des employés dans le module RH pour voir les statistiques</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const genreData = [
    { name: 'Hommes', value: stats.hommes },
    { name: 'Femmes', value: stats.femmes },
  ].filter(d => d.value > 0);

  const contratData = stats.parContrat.map(c => ({
    name: c.type,
    value: c.count,
  }));

  const visiteMedData = [
    { name: 'À jour', value: stats.visiteMedicaleAJour, color: '#10b981' },
    { name: 'Expirée', value: stats.visiteMedicaleExpiree, color: '#ef4444' },
    { name: 'À faire', value: stats.visiteMedicaleAFaire, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <>
      {/* KPI RH Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Effectifs RH
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{stats.totalEmployes}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-2xl font-bold text-emerald-600">{stats.actifs}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-2xl font-bold text-red-600">{stats.inactifs}</p>
              <p className="text-xs text-muted-foreground">Inactifs</p>
            </div>
          </div>

          {/* Genre pie chart */}
          {genreData.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Répartition par genre</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Contrats */}
          {contratData.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Types de contrat</p>
              <div className="space-y-2">
                {contratData.map((c, i) => {
                  const pct = stats.totalEmployes > 0 ? (c.value / stats.totalEmployes) * 100 : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm flex-1">{c.name}</span>
                      <Badge variant="secondary" className="text-xs">{c.value} ({pct.toFixed(0)}%)</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Répartition par service + Visite médicale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Répartition par service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.parService.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.parService} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="service"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employés" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {stats.parService.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun service défini</p>
          )}

          {/* Visite médicale */}
          {visiteMedData.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> Visites médicales
              </p>
              <div className="flex gap-2">
                {visiteMedData.map(v => (
                  <div key={v.name} className="flex-1 text-center p-2 rounded-lg" style={{ backgroundColor: `${v.color}15` }}>
                    <p className="text-lg font-bold" style={{ color: v.color }}>{v.value}</p>
                    <p className="text-[10px] text-muted-foreground">{v.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
