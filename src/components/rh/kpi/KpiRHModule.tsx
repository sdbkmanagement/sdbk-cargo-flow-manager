import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { sirhService } from '@/services/sirhService';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

const KpiCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export const KpiRHModule = () => {
  const { data: stats } = useQuery({ queryKey: ['rh-dashboard-stats'], queryFn: () => sirhService.getDashboardStats() });

  const { data: absences } = useQuery({
    queryKey: ['kpi-absences'],
    queryFn: async () => {
      const { data, error } = await sb.from('absences').select('id, employe_id, date_debut, date_fin, type_absence');
      if (error) throw error;
      return data || [];
    },
  });

  const kpis = useMemo(() => {
    const effectif = stats?.effectif_actif || 0;
    const joursAbs = ((absences || []) as any[]).reduce((acc, a) => {
      if (!a.date_debut) return acc;
      const d1 = new Date(a.date_debut);
      const d2 = a.date_fin ? new Date(a.date_fin) : d1;
      return acc + Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
    }, 0);
    const joursTheoriques = effectif * 260;
    const tauxAbs = joursTheoriques > 0 ? (joursAbs / joursTheoriques) * 100 : 0;
    const coutMoyen = effectif > 0 ? (stats?.masse_salariale || 0) / effectif : 0;
    return { effectif, tauxAbs, coutMoyen, joursAbs };
  }, [stats, absences]);

  const exportExcel = () => {
    const rows = [
      { Indicateur: 'Effectif actif', Valeur: kpis.effectif },
      { Indicateur: 'Effectif total', Valeur: stats?.effectif_total || 0 },
      { Indicateur: 'Âge moyen', Valeur: stats?.age_moyen ?? '' },
      { Indicateur: 'Ancienneté moyenne (ans)', Valeur: stats?.anciennete_moyenne ?? '' },
      { Indicateur: 'Masse salariale (GNF)', Valeur: stats?.masse_salariale || 0 },
      { Indicateur: 'Coût moyen / collaborateur (GNF)', Valeur: Math.round(kpis.coutMoyen) },
      { Indicateur: "Taux d'absentéisme (%)", Valeur: kpis.tauxAbs.toFixed(2) },
      { Indicateur: 'Contrats à échéance', Valeur: stats?.contrats_echeance || 0 },
      { Indicateur: 'Documents expirants', Valeur: stats?.documents_expirants || 0 },
      { Indicateur: 'Visites médicales à prévoir', Valeur: stats?.visites_medicales || 0 },
      { Indicateur: 'Départs retraite (<2 ans)', Valeur: stats?.departs_retraite || 0 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'KPI RH');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((stats?.par_departement || []).map((d) => ({ Département: d.name, Effectif: d.value }))), 'Par département');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((stats?.par_contrat || []).map((d) => ({ Contrat: d.name, Effectif: d.value }))), 'Par contrat');
    XLSX.writeFile(wb, `KPI_RH_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">KPI RH & Reporting</h2>
          <p className="text-sm text-muted-foreground">Indicateurs consolidés et exports</p>
        </div>
        <Button variant="outline" onClick={exportExcel}><Download className="w-4 h-4 mr-2" />Exporter Excel</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Effectif actif" value={kpis.effectif} sub={`${stats?.effectif_total || 0} au total`} />
        <KpiCard label="Taux d'absentéisme" value={`${kpis.tauxAbs.toFixed(2)} %`} sub={`${kpis.joursAbs} jours d'absence`} />
        <KpiCard label="Masse salariale" value={`${(stats?.masse_salariale || 0).toLocaleString('fr-FR')} GNF`} />
        <KpiCard label="Coût moyen / collaborateur" value={`${Math.round(kpis.coutMoyen).toLocaleString('fr-FR')} GNF`} />
        <KpiCard label="Âge moyen" value={stats?.age_moyen ? `${stats.age_moyen} ans` : '—'} />
        <KpiCard label="Ancienneté moyenne" value={stats?.anciennete_moyenne ? `${stats.anciennete_moyenne} ans` : '—'} />
        <KpiCard label="Contrats à échéance" value={stats?.contrats_echeance || 0} />
        <KpiCard label="Départs retraite (<2 ans)" value={stats?.departs_retraite || 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Effectif par département</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.par_departement || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par type de contrat</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Contrat</TableHead><TableHead className="text-right">Effectif</TableHead><TableHead className="text-right">Part</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats?.par_contrat || []).map((c) => (
                  <TableRow key={c.name}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-right">{c.value}</TableCell>
                    <TableCell className="text-right">{stats?.effectif_total ? ((c.value / stats.effectif_total) * 100).toFixed(1) : 0} %</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
