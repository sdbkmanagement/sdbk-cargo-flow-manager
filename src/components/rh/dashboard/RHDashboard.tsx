import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  Users, UserCheck, UserX, CalendarOff, CalendarCheck, FileWarning,
  Stethoscope, Wallet, Cake, Clock, Briefcase, AlertTriangle,
} from 'lucide-react';
import { sirhService } from '@/services/sirhService';
import { rhService } from '@/services/rh';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Kpi = ({ icon: Icon, label, value, hint, tone = 'default' }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        <Icon className="h-5 w-5 text-primary/70" />
      </div>
    </CardContent>
  </Card>
);

export const RHDashboard = () => {
  const [filterService, setFilterService] = useState('tous');
  const [filterDepartement, setFilterDepartement] = useState('tous');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['rh-dashboard-stats'],
    queryFn: () => sirhService.getDashboardStats(),
    refetchInterval: 60000,
  });

  const { data: alertes } = useQuery({
    queryKey: ['rh-alertes'],
    queryFn: () => sirhService.getAlertes(),
    refetchInterval: 60000,
  });

  const { data: employes } = useQuery({
    queryKey: ['employes'],
    queryFn: () => rhService.getEmployes(),
  });

  const filtered = useMemo(() => {
    let list = (employes || []) as any[];
    if (filterService !== 'tous') list = list.filter((e) => e.service === filterService);
    if (filterDepartement !== 'tous') list = list.filter((e) => (e.departement || e.service) === filterDepartement);
    return list;
  }, [employes, filterService, filterDepartement]);

  const services = useMemo(
    () => Array.from(new Set(((employes || []) as any[]).map((e) => e.service).filter(Boolean))).sort(),
    [employes]
  );
  const departements = useMemo(
    () => Array.from(new Set(((employes || []) as any[]).map((e) => e.departement || e.service).filter(Boolean))).sort(),
    [employes]
  );

  const isFiltered = filterService !== 'tous' || filterDepartement !== 'tous';
  const effectifTotal = isFiltered ? filtered.length : stats?.effectif_total ?? 0;
  const effectifActif = isFiltered ? filtered.filter((e) => e.statut === 'actif').length : stats?.effectif_actif ?? 0;

  const genreData = [
    { name: 'Hommes', value: stats?.hommes ?? 0 },
    { name: 'Femmes', value: stats?.femmes ?? 0 },
  ].filter((d) => d.value > 0);

  const alertesCritiques = (alertes || []).filter((a) => a.priorite === 'critique').length;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement du tableau de bord RH...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Tableau de bord RH</h2>
          <p className="text-sm text-muted-foreground">Vision consolidée des effectifs, absences et échéances</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterDepartement} onValueChange={setFilterDepartement}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Département" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les départements</SelectItem>
              {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les services</SelectItem>
              {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Effectif total" value={effectifTotal} />
        <Kpi icon={UserCheck} label="Effectif actif" value={effectifActif} />
        <Kpi icon={UserX} label="Inactifs" value={isFiltered ? filtered.length - effectifActif : stats?.effectif_inactif ?? 0} />
        <Kpi icon={Wallet} label="Masse salariale" value={`${(stats?.masse_salariale ?? 0).toLocaleString('fr-FR')} GNF`} hint="Salaires de base actifs" />
        <Kpi icon={Cake} label="Moyenne d'âge" value={stats?.age_moyen ? `${stats.age_moyen} ans` : '—'} />
        <Kpi icon={Clock} label="Ancienneté moyenne" value={stats?.anciennete_moyenne ? `${stats.anciennete_moyenne} ans` : '—'} />
        <Kpi icon={CalendarOff} label="Absences en cours" value={stats?.absences_en_cours ?? 0} />
        <Kpi icon={CalendarCheck} label="Congés en cours" value={stats?.conges_en_cours ?? 0} />
        <Kpi icon={FileWarning} label="Contrats à échéance" value={stats?.contrats_echeance ?? 0} tone="warn" hint="< 60 jours" />
        <Kpi icon={FileWarning} label="Documents expirants" value={stats?.documents_expirants ?? 0} tone="warn" hint="< 30 jours" />
        <Kpi icon={Stethoscope} label="Visites médicales" value={stats?.visites_medicales ?? 0} tone="warn" hint="À renouveler" />
        <Kpi icon={Briefcase} label="Départs retraite" value={stats?.departs_retraite ?? 0} hint="59 ans et +" />
      </div>

      {alertesCritiques > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm">
              <span className="font-semibold text-destructive">{alertesCritiques} alerte(s) critique(s)</span> nécessitent une action immédiate — voir la section « Alertes RH ».
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par département</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.par_departement || []} layout="vertical" margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Effectif" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {(stats?.par_departement || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pyramide des âges</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.pyramide_ages || []} layout="vertical" margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hommes" name="Hommes" stackId="a" fill="#3b82f6" maxBarSize={24} />
                <Bar dataKey="femmes" name="Femmes" stackId="a" fill="#ec4899" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par contrat</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(stats?.par_contrat || []).map((c, i) => {
              const pct = stats?.effectif_total ? (c.value / stats.effectif_total) * 100 : 0;
              return (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1">{c.name}</span>
                  <Badge variant="secondary" className="text-xs">{c.value} ({pct.toFixed(0)}%)</Badge>
                </div>
              );
            })}
            {genreData.length > 0 && (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={genreData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par fonction</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.par_fonction || []} layout="vertical" margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Effectif" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {(stats?.par_fonction || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
