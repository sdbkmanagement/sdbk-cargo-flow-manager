import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3, TrendingUp, Truck, Users, AlertTriangle, Wrench,
  ShieldCheck, DollarSign, FileDown, Activity, FileText, Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { rapportsService, MonthlyReportData } from '@/services/rapportsService';
import { RapportPdfExport } from './RapportPdfExport';
import { toast } from 'sonner';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatCurrency = (n: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);
const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

export const RapportDashboard: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const report = await rapportsService.getMonthlyReport(month, year);
      setData(report);
    } catch (err) {
      toast.error('Erreur lors du chargement du rapport');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [month, year]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const pieData = data ? [
    { name: 'Hydrocarbures', value: data.operations.breakdown_hydrocarbures },
    { name: 'Bauxite', value: data.operations.breakdown_bauxite },
    { name: 'Autres', value: data.operations.breakdown_autres },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 items-center">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {data && <RapportPdfExport data={data} />}
      </div>

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={DollarSign} label="Chiffre d'affaires" value={formatCurrency(data.executive.total_revenue)} color="text-green-600" />
            <KPICard icon={FileText} label="Bons de livraison" value={String(data.executive.total_bl)} color="text-blue-600" />
            <KPICard icon={Truck} label="Taux utilisation" value={`${data.executive.fleet_utilization_rate.toFixed(0)}%`} color="text-purple-600" />
            <KPICard icon={Activity} label="Missions" value={String(data.executive.total_missions)} color="text-orange-600" />
            <KPICard icon={Users} label="Chauffeurs actifs" value={String(data.executive.total_drivers)} color="text-cyan-600" />
            <KPICard icon={Wrench} label="Coût maintenance" value={formatCurrency(data.executive.total_maintenance_cost)} color="text-red-600" />
            <KPICard icon={AlertTriangle} label="Incidents" value={String(data.executive.total_incidents)} color="text-amber-600" />
            <KPICard icon={ShieldCheck} label="Contrôles HSE" value={String(data.hse.total_controls)} color="text-emerald-600" />
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5 text-amber-500" /> Alertes & Recommandations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.map((alert, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.type === 'danger' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
                  }`}>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">💡 {alert.recommendation}</p>
                    </div>
                    <Badge variant={alert.type === 'danger' ? 'destructive' : 'secondary'}>
                      {alert.type === 'danger' ? 'Critique' : alert.type === 'warning' ? 'Attention' : 'Info'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Évolution CA (6 mois)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.financial.revenue_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* BL par jour */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5" /> BL saisis par jour</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.operations.bl_par_jour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} tickFormatter={d => d.split('-').slice(1).join('/')} />
                    <YAxis fontSize={11} />
                    <Tooltip labelFormatter={d => `Date: ${d}`} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="BL" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Répartition activité</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Maintenance by type */}
            {data.maintenance.by_type.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="w-5 h-5" /> Maintenance par type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.maintenance.by_type} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="type" type="category" fontSize={11} width={120} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} name="Coût" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Vehicles */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Top 5 Véhicules</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="text-right">Missions/BL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.fleet.top5_vehicles.map((v, i) => (
                      <TableRow key={v.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{v.numero}</TableCell>
                        <TableCell className="text-right">{v.missions}</TableCell>
                      </TableRow>
                    ))}
                    {data.fleet.top5_vehicles.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Aucune donnée</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top 5 Drivers */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Top 5 Chauffeurs</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead className="text-right">Missions</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.drivers.top5.map((d, i) => (
                      <TableRow key={d.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{d.nom} {d.prenom}</TableCell>
                        <TableCell className="text-right">{d.missions}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.score >= 0 ? 'default' : 'destructive'}>{d.score}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.drivers.top5.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucune donnée</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Flop 5 Vehicles */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-red-500" /> Flop 5 Véhicules</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="text-right">Missions/BL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.fleet.flop5_vehicles.map((v, i) => (
                      <TableRow key={v.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{v.numero}</TableCell>
                        <TableCell className="text-right">{v.missions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* HSE Summary */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Bilan HSE</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{data.hse.conformes}</div>
                    <div className="text-xs text-muted-foreground">Conformes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                    <div className="text-2xl font-bold text-red-600">{data.hse.non_conformes}</div>
                    <div className="text-xs text-muted-foreground">Non conformes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.hse.total_controls}</div>
                    <div className="text-xs text-muted-foreground">Total contrôles</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
                    <div className="text-2xl font-bold text-amber-600">{data.hse.non_conformites}</div>
                    <div className="text-xs text-muted-foreground">Non-conformités</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /> Résumé Financier</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Revenus</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(data.financial.revenue)}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Coûts maintenance</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(data.financial.maintenance_cost)}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Profit estimé</div>
                    <div className={`text-xl font-bold ${data.financial.estimated_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(data.financial.estimated_profit)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

const KPICard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-muted`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);
