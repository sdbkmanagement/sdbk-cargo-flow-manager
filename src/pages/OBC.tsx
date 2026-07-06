import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obcService, OBC_VIOLATION_LABELS, ObcViolationType } from '@/services/obcService';
import { chauffeursService } from '@/services/chauffeurs';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { AlertTriangle, Plus, Trash2, Activity, Clock, ShieldAlert, Settings as SettingsIcon, Trophy, Medal, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { bonsLivraisonService } from '@/services/bonsLivraison';
import { ChauffeurCombobox } from '@/components/obc/ChauffeurCombobox';

const OBC: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: chauffeurs = [] } = useQuery({ queryKey: ['chauffeurs'], queryFn: () => chauffeursService.getAll() });
  const { data: violations = [] } = useQuery({ queryKey: ['obc-violations'], queryFn: () => obcService.listViolations() });
  const { data: points = [] } = useQuery({ queryKey: ['obc-points'], queryFn: () => obcService.listPoints() });
  const { data: temps = [] } = useQuery({ queryKey: ['obc-temps'], queryFn: () => obcService.listTemps() });
  const { data: alertes = [] } = useQuery({ queryKey: ['obc-alertes'], queryFn: () => obcService.listAlertes() });
  const { data: config = [] } = useQuery({ queryKey: ['obc-config'], queryFn: () => obcService.getConfig() });
  const { data: bls = [] } = useQuery({ queryKey: ['bons-livraison-obc'], queryFn: () => bonsLivraisonService.getAll() });

  const chauffeurMap = useMemo(() => {
    const m = new Map<string, string>();
    chauffeurs.forEach((c: any) => m.set(c.id, `${c.prenom} ${c.nom}`));
    return m;
  }, [chauffeurs]);

  const pointsMap = useMemo(() => {
    const m = new Map<string, number>();
    points.forEach(p => m.set(p.chauffeur_id, p.points_actuels));
    return m;
  }, [points]);

  // Filtres
  const [fChauffeur, setFChauffeur] = useState<string>('all');
  const [fType, setFType] = useState<string>('all');
  const [fDate, setFDate] = useState<string>('');

  const filteredViolations = violations.filter(v =>
    (fChauffeur === 'all' || v.chauffeur_id === fChauffeur) &&
    (fType === 'all' || v.type_violation === fType) &&
    (!fDate || v.date_violation.startsWith(fDate))
  );

  // Stats
  const stats = useMemo(() => {
    const parType: Record<string, number> = {};
    violations.forEach(v => { parType[v.type_violation] = (parType[v.type_violation] || 0) + 1; });
    const chauffeursRisque = [...pointsMap.entries()]
      .filter(([_, p]) => p <= 6)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10);
    return {
      totalViolations: violations.length,
      alertesActives: alertes.filter(a => !a.lu).length,
      chauffeursBloqes: [...pointsMap.values()].filter(p => p === 0).length,
      parType,
      chauffeursRisque,
    };
  }, [violations, alertes, pointsMap]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Violations totales" value={stats.totalViolations} icon={<ShieldAlert className="h-5 w-5" />} />
        <KpiCard title="Alertes actives" value={stats.alertesActives} icon={<AlertTriangle className="h-5 w-5" />} variant="warning" />
        <KpiCard title="Chauffeurs bloqués" value={stats.chauffeursBloqes} icon={<Activity className="h-5 w-5" />} variant="danger" />
        <KpiCard title="Chauffeurs à risque" value={stats.chauffeursRisque.length} icon={<Clock className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="violations" className="w-full">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="temps">Temps de conduite</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="config"><SettingsIcon className="h-4 w-4" /></TabsTrigger>
        </TabsList>

        {/* VIOLATIONS */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Violations</CardTitle>
              <ViolationDialog chauffeurs={chauffeurs} userId={user?.id} onCreated={() => {
                qc.invalidateQueries({ queryKey: ['obc-violations'] });
                qc.invalidateQueries({ queryKey: ['obc-points'] });
                qc.invalidateQueries({ queryKey: ['obc-alertes'] });
              }} />
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="matrice" className="w-full">
                <TabsList>
                  <TabsTrigger value="matrice">Matrice</TabsTrigger>
                  <TabsTrigger value="liste">Liste</TabsTrigger>
                </TabsList>
                <TabsContent value="matrice" className="pt-4">
                  <ViolationsMatrix
                    chauffeurs={chauffeurs}
                    violations={violations}
                    userId={user?.id}
                    onChange={() => {
                      qc.invalidateQueries({ queryKey: ['obc-violations'] });
                      qc.invalidateQueries({ queryKey: ['obc-points'] });
                      qc.invalidateQueries({ queryKey: ['obc-alertes'] });
                    }}
                  />
                </TabsContent>
                <TabsContent value="liste" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Select value={fChauffeur} onValueChange={setFChauffeur}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Chauffeur" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous chauffeurs</SelectItem>
                    {chauffeurs.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={fType} onValueChange={setFType}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    {Object.entries(OBC_VIOLATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="w-[180px]" />
                {(fChauffeur !== 'all' || fType !== 'all' || fDate) && (
                  <Button variant="ghost" onClick={() => { setFChauffeur('all'); setFType('all'); setFDate(''); }}>Réinitialiser</Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Commentaire</TableHead>
                      <TableHead>Mesures</TableHead>
                      <TableHead>Preuve</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(v.date_violation), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{chauffeurMap.get(v.chauffeur_id) || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={v.auto_generee ? 'secondary' : 'default'}>
                            {OBC_VIOLATION_LABELS[v.type_violation]}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="destructive">-{v.points_retires}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{v.commentaire || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{v.mesures_prises || '—'}</TableCell>
                        <TableCell>{v.preuve_url ? <a href={v.preuve_url} target="_blank" rel="noreferrer" className="text-primary underline">Voir</a> : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            if (confirm('Supprimer cette violation ?')) {
                              await obcService.deleteViolation(v.id);
                              toast.success('Supprimée');
                              qc.invalidateQueries({ queryKey: ['obc-violations'] });
                            }
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredViolations.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune violation</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POINTS */}
        <TabsContent value="points">
          <Card>
            <CardHeader><CardTitle>Matrice des points par chauffeur</CardTitle></CardHeader>
            <CardContent>
              <PointsMatrix
                chauffeurs={chauffeurs}
                violations={violations}
                pointsMap={pointsMap}
                userId={user?.id}
                onChange={() => {
                  qc.invalidateQueries({ queryKey: ['obc-violations'] });
                  qc.invalidateQueries({ queryKey: ['obc-points'] });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPS */}
        <TabsContent value="temps" className="space-y-4">
          <TempsConduiteMatrix
            chauffeurs={chauffeurs}
            chauffeurMap={chauffeurMap}
            temps={temps}
            userId={user?.id}
            onChange={() => {
              qc.invalidateQueries({ queryKey: ['obc-temps'] });
              qc.invalidateQueries({ queryKey: ['obc-violations'] });
              qc.invalidateQueries({ queryKey: ['obc-alertes'] });
            }}
          />
          <TempsConduiteTab
            chauffeurs={chauffeurs}
            chauffeurMap={chauffeurMap}
            temps={temps}
            userId={user?.id}
            onChange={() => {
              qc.invalidateQueries({ queryKey: ['obc-temps'] });
              qc.invalidateQueries({ queryKey: ['obc-violations'] });
              qc.invalidateQueries({ queryKey: ['obc-alertes'] });
            }}
          />
        </TabsContent>

        {/* RANKING */}
        <TabsContent value="ranking">
          <RankingConducteurs chauffeurs={chauffeurs} chauffeurMap={chauffeurMap} violations={violations} bls={bls} temps={temps} />
        </TabsContent>

        {/* ALERTES */}
        <TabsContent value="alertes">
          <Card>
            <CardHeader><CardTitle>Alertes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alertes.length === 0 && <p className="text-muted-foreground">Aucune alerte</p>}
              {alertes.map(a => (
                <div key={a.id} className={`flex items-start justify-between p-3 rounded-lg border ${a.lu ? 'opacity-60' : ''} ${a.niveau === 'critique' ? 'border-destructive/50 bg-destructive/5' : a.niveau === 'warning' ? 'border-orange-500/50 bg-orange-500/5' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.niveau === 'critique' ? 'destructive' : 'secondary'}>{a.niveau}</Badge>
                      <span className="text-sm text-muted-foreground">{a.chauffeur_id ? chauffeurMap.get(a.chauffeur_id) : 'Système'}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <p className="mt-1">{a.message}</p>
                  </div>
                  {!a.lu && (
                    <Button variant="ghost" size="sm" onClick={async () => {
                      await obcService.marquerLu(a.id);
                      qc.invalidateQueries({ queryKey: ['obc-alertes'] });
                    }}>Marquer lu</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIG */}
        <TabsContent value="config">
          <Card>
            <CardHeader><CardTitle>Seuils OBC</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-w-md">
              {config.map((c: any) => (
                <div key={c.cle} className="flex items-center justify-between gap-3">
                  <Label className="flex-1">{c.description || c.cle}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    defaultValue={c.valeur}
                    className="w-32"
                    onBlur={async (e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val !== Number(c.valeur)) {
                        await obcService.updateConfig(c.cle, val);
                        toast.success('Seuil mis à jour');
                        qc.invalidateQueries({ queryKey: ['obc-config'] });
                      }
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

type RankingPeriod = 'jour' | 'semaine' | 'mois' | 'trimestre' | 'semestre' | 'annuelle';

const RankingConducteurs: React.FC<{
  chauffeurs: any[];
  chauffeurMap: Map<string, string>;
  violations: any[];
  bls: any[];
  temps: any[];
}> = ({ chauffeurs, violations, bls, temps }) => {
  const [period, setPeriod] = useState<RankingPeriod>('mois');
  const [refDate, setRefDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const range = useMemo(() => {
    const ref = new Date(refDate);
    const start = new Date(ref);
    const end = new Date(ref);
    switch (period) {
      case 'jour':
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); break;
      case 'semaine': {
        const day = (ref.getDay() + 6) % 7;
        start.setDate(ref.getDate() - day); start.setHours(0, 0, 0, 0);
        end.setTime(start.getTime()); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
        break;
      }
      case 'mois':
        start.setDate(1); start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999); break;
      case 'trimestre': {
        const q = Math.floor(ref.getMonth() / 3);
        start.setMonth(q * 3, 1); start.setHours(0, 0, 0, 0);
        end.setMonth(q * 3 + 3, 0); end.setHours(23, 59, 59, 999); break;
      }
      case 'semestre': {
        const s = ref.getMonth() < 6 ? 0 : 6;
        start.setMonth(s, 1); start.setHours(0, 0, 0, 0);
        end.setMonth(s + 6, 0); end.setHours(23, 59, 59, 999); break;
      }
      case 'annuelle':
        start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31); end.setHours(23, 59, 59, 999); break;
    }
    return { start, end };
  }, [period, refDate]);

  const inRange = (d: string | Date) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  };

  const rows = useMemo(() => {
    return chauffeurs.map((c: any) => {
      const cid = c.id;
      const name = `${c.prenom || ''} ${c.nom || ''}`.trim();
      const blsC = bls.filter((b: any) => b.chauffeur_id === cid && b.date_chargement_reelle && inRange(b.date_chargement_reelle));
      const manquantTotal = blsC.reduce((s: number, b: any) => s + (Number(b.manquant_total) || 0), 0);
      const violC = violations.filter((v: any) => v.chauffeur_id === cid && inRange(v.date_violation)).length;
      const distance = temps
        .filter((t: any) => t.chauffeur_id === cid && t.date_jour && inRange(t.date_jour))
        .reduce((s: number, t: any) => s + (Number(t.distance_km) || 0), 0);
      return { cid, name, manquantTotal, violC, distance, nbBL: blsC.length };
    }).filter(r => r.name);
  }, [chauffeurs, bls, violations, temps, range]);

  const rankZeroManquant = useMemo(() =>
    [...rows].filter(r => r.manquantTotal === 0 && r.nbBL > 0).sort((a, b) => b.nbBL - a.nbBL),
    [rows]);
  const rankZeroViolation = useMemo(() =>
    [...rows].filter(r => r.violC === 0 && r.nbBL > 0).sort((a, b) => b.nbBL - a.nbBL),
    [rows]);
  const rankDistance = useMemo(() =>
    [...rows].sort((a, b) => b.distance - a.distance || b.nbBL - a.nbBL),
    [rows]);

  // Classement combiné (3 critères) - TOUS les chauffeurs (même sans activité sur la période)
  const rankCombined = useMemo(() => {
    const maxDist = Math.max(1, ...rows.map(r => r.distance));
    return rows
      .map(r => {
        // 3 critères uniquement : 0 manquant (40), 0 violation (40), distance max (20)
        const sManquant = r.manquantTotal === 0 ? 40 : Math.max(0, 40 - r.manquantTotal * 2);
        const sViolation = r.violC === 0 ? 40 : Math.max(0, 40 - r.violC * 5);
        const sDistance = (r.distance / maxDist) * 20;
        const score = sManquant + sViolation + sDistance;
        return { ...r, score: Math.round(score * 10) / 10 };
      })
      .sort((a, b) => b.score - a.score);
  }, [rows]);

  const periodLabelShort: Record<RankingPeriod, string> = {
    jour: 'Jour', semaine: 'Semaine', mois: 'Mois', trimestre: 'Trimestre', semestre: 'Semestre', annuelle: 'Année',
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const headerInfo = `${periodLabelShort[period]} : ${format(range.start, 'dd/MM/yyyy')} → ${format(range.end, 'dd/MM/yyyy')}`;
    const combined = rankCombined.map((r, i) => ({
      Rang: i + 1, Chauffeur: r.name, 'Nb BL': r.nbBL, 'Manquant total': r.manquantTotal,
      Violations: r.violC, 'Distance (km)': r.distance, 'Score / 100': r.score,
    }));
    const ws1 = XLSX.utils.json_to_sheet(combined);
    XLSX.utils.sheet_add_aoa(ws1, [[`Classement combiné — ${headerInfo}`]], { origin: 'A1' });
    XLSX.utils.sheet_add_json(ws1, combined, { origin: 'A3' });
    XLSX.utils.book_append_sheet(wb, ws1, 'Classement combiné');

    const mkSheet = (data: any[], titre: string) => {
      const rowsX = data.map((r, i) => ({
        Rang: i + 1, Chauffeur: r.name, 'Nb BL': r.nbBL, 'Manquant total': r.manquantTotal,
        Violations: r.violC, 'Distance (km)': r.distance,
      }));
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.sheet_add_aoa(ws, [[`${titre} — ${headerInfo}`]], { origin: 'A1' });
      XLSX.utils.sheet_add_json(ws, rowsX, { origin: 'A3' });
      return ws;
    };
    XLSX.utils.book_append_sheet(wb, mkSheet(rankZeroManquant, 'Manquant citerne = 0'), 'Manquant=0');
    XLSX.utils.book_append_sheet(wb, mkSheet(rankZeroViolation, 'Violation = 0'), 'Violation=0');
    XLSX.utils.book_append_sheet(wb, mkSheet(rankDistance, 'Distance parcourue'), 'Distance');
    XLSX.writeFile(wb, `ranking_chauffeurs_${period}_${format(range.start, 'yyyyMMdd')}.xlsx`);
    toast.success('Export Excel généré');
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF('p', 'mm', 'a4');
    const headerInfo = `${periodLabelShort[period]} : ${format(range.start, 'dd/MM/yyyy')} → ${format(range.end, 'dd/MM/yyyy')}`;
    doc.setFontSize(14);
    doc.text('Ranking Conducteurs', 14, 15);
    doc.setFontSize(10);
    doc.text(headerInfo, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Chauffeur', 'Nb BL', 'Manquant', 'Viol.', 'Distance (km)', 'Score/100']],
      body: rankCombined.map((r, i) => [i + 1, r.name, r.nbBL, r.manquantTotal, r.violC, r.distance.toLocaleString('fr-FR'), r.score]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text('Classement combiné (3 critères)', 14, 28 - 2);
      },
    });

    const addSection = (titre: string, data: any[], metricLabel: string, metricFn: (r: any) => any) => {
      doc.addPage();
      doc.setFontSize(14); doc.text(titre, 14, 15);
      doc.setFontSize(10); doc.text(headerInfo, 14, 22);
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Chauffeur', 'Nb BL', metricLabel]],
        body: data.map((r, i) => [i + 1, r.name, r.nbBL, metricFn(r)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    };
    addSection('Manquant citerne = 0', rankZeroManquant, 'Manquant', (r) => r.manquantTotal);
    addSection('Violation = 0', rankZeroViolation, 'Violations', (r) => r.violC);
    addSection('Plus grande distance parcourue', rankDistance, 'Distance (km)', (r) => r.distance.toLocaleString('fr-FR'));

    doc.save(`ranking_chauffeurs_${period}_${format(range.start, 'yyyyMMdd')}.pdf`);
    toast.success('Export PDF généré');
  };

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

  const periodLabel: Record<RankingPeriod, string> = {
    jour: 'Jour', semaine: 'Semaine', mois: 'Mois', trimestre: 'Trimestre', semestre: 'Semestre', annuelle: 'Année',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Ranking Conducteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Période</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as RankingPeriod)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="annuelle">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date de référence</Label>
              <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className="w-44" />
            </div>
            <div className="text-sm text-muted-foreground">
              {periodLabel[period]} : {format(range.start, 'dd/MM/yyyy')} → {format(range.end, 'dd/MM/yyyy')}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankingColumn
          title="Manquant citerne = 0"
          subtitle="Chauffeurs sans manquant (triés par nb de BL)"
          rows={rankZeroManquant}
          metric={(r) => `${r.nbBL} BL`}
          medalColors={medalColors}
        />
        <RankingColumn
          title="Violation = 0"
          subtitle="Chauffeurs sans violation (triés par nb de BL)"
          rows={rankZeroViolation}
          metric={(r) => `${r.nbBL} BL`}
          medalColors={medalColors}
        />
        <RankingColumn
          title="Plus grande distance"
          subtitle="Cumul km parcourus sur la période"
          rows={rankDistance}
          metric={(r) => `${r.distance.toLocaleString('fr-FR')} km`}
          medalColors={medalColors}
        />
      </div>

      <Card className="border-yellow-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Classement combiné (3 critères)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Score sur 100 — Manquant=0 (35 pts) · Violation=0 (35 pts) · Distance (20 pts) · Activité BL (10 pts)
          </p>
        </CardHeader>
        <CardContent>
          {rankCombined.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {rankCombined.map((r, i) => (
              <div key={r.cid} className="flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-muted/30 transition">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold">
                  {i < 3 ? <Medal className={`h-4 w-4 ${medalColors[i]}`} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.nbBL} BL · Manq: {r.manquantTotal} · Viol: {r.violC} · {r.distance.toLocaleString('fr-FR')} km
                  </p>
                </div>
                <Badge className="font-bold whitespace-nowrap bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/30">
                  {r.score} / 100
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


const RankingColumn: React.FC<{
  title: string;
  subtitle: string;
  rows: { cid: string; name: string; manquantTotal: number; violC: number; distance: number; nbBL: number }[];
  metric: (r: any) => string;
  medalColors: string[];
}> = ({ title, subtitle, rows, metric, medalColors }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardHeader>
    <CardContent>
      {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={r.cid} className="flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-muted/30 transition">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold shrink-0">
              {i < 3 ? <Medal className={`h-4 w-4 ${medalColors[i]}`} /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
            </div>
            <Badge variant="secondary" className="font-semibold whitespace-nowrap">{metric(r)}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const KpiCard: React.FC<{ title: string; value: number; icon: React.ReactNode; variant?: 'warning' | 'danger' }> = ({ title, value, icon, variant }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold ${variant === 'danger' ? 'text-destructive' : variant === 'warning' ? 'text-orange-500' : ''}`}>{value}</p>
      </div>
      <div className="text-muted-foreground">{icon}</div>
    </CardContent>
  </Card>
);

const ViolationDialog: React.FC<{ chauffeurs: any[]; userId?: string; onCreated: () => void }> = ({ chauffeurs, userId, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    chauffeur_id: '',
    date_violation: new Date().toISOString().slice(0, 16),
    type_violation: 'survitesse' as ObcViolationType,
    commentaire: '',
    mesures_prises: '',
    points_retires: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.chauffeur_id) { toast.error('Sélectionnez un chauffeur'); return; }
    setLoading(true);
    try {
      let preuve_url: string | undefined;
      if (file) preuve_url = await obcService.uploadPreuve(file, form.chauffeur_id);
      await obcService.createViolation({
        ...form,
        date_violation: new Date(form.date_violation).toISOString(),
        preuve_url,
        created_by: userId,
      } as any);
      toast.success('Violation enregistrée');
      setOpen(false);
      setForm({ ...form, chauffeur_id: '', commentaire: '', mesures_prises: '' });
      setFile(null);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouvelle violation</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Saisie violation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Chauffeur *</Label>
            <Select value={form.chauffeur_id} onValueChange={v => setForm({ ...form, chauffeur_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {chauffeurs.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date / heure *</Label>
            <Input type="datetime-local" value={form.date_violation} onChange={e => setForm({ ...form, date_violation: e.target.value })} />
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={form.type_violation} onValueChange={v => setForm({ ...form, type_violation: v as ObcViolationType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OBC_VIOLATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Points retirés</Label>
            <Input type="number" min={0} max={12} value={form.points_retires} onChange={e => setForm({ ...form, points_retires: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>Commentaire</Label>
            <Textarea value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
          </div>
          <div>
            <Label>Mesures prises</Label>
            <Textarea value={form.mesures_prises} onChange={e => setForm({ ...form, mesures_prises: e.target.value })} />
          </div>
          <div>
            <Label>Preuve (optionnel)</Label>
            <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TempsDialog: React.FC<{
  chauffeurs: any[];
  userId?: string;
  onSaved: () => void;
  preselectedChauffeurId?: string;
  triggerLabel?: string;
}> = ({ chauffeurs, userId, onSaved, preselectedChauffeurId, triggerLabel }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    chauffeur_id: preselectedChauffeurId || '',
    date_jour: new Date().toISOString().slice(0, 10),
    distance_km: 0,
    temps_conduite_h: 0,
    temps_continu_max_h: 0,
    commentaire: '',
  });
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    if (preselectedChauffeurId) setForm(f => ({ ...f, chauffeur_id: preselectedChauffeurId }));
  }, [preselectedChauffeurId]);

  const submit = async () => {
    if (!form.chauffeur_id) { toast.error('Sélectionnez un chauffeur'); return; }
    setLoading(true);
    try {
      await obcService.insertTemps({ ...form, created_by: userId } as any);
      toast.success('Saisie enregistrée');
      setOpen(false);
      setForm({ ...form, distance_km: 0, temps_conduite_h: 0, temps_continu_max_h: 0, commentaire: '' });
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{triggerLabel || 'Nouvelle saisie'}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Temps de conduite journalier</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Chauffeur *</Label>
            <Select value={form.chauffeur_id} onValueChange={v => setForm({ ...form, chauffeur_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {chauffeurs.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <Input type="date" value={form.date_jour} onChange={e => setForm({ ...form, date_jour: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Distance (km)</Label>
              <Input type="number" min={0} value={form.distance_km} onChange={e => setForm({ ...form, distance_km: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Temps total (h)</Label>
              <Input type="number" step="0.1" min={0} value={form.temps_conduite_h} onChange={e => setForm({ ...form, temps_conduite_h: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Continu max (h)</Label>
              <Input type="number" step="0.1" min={0} value={form.temps_continu_max_h} onChange={e => setForm({ ...form, temps_continu_max_h: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <Label>Commentaire</Label>
            <Textarea rows={2} value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">Plusieurs saisies par jour autorisées. Les dépassements (10h, 2h30, 56h sur 7j) génèrent automatiquement violations et alertes.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MOIS_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const TempsConduiteTab: React.FC<{
  chauffeurs: any[];
  chauffeurMap: Map<string, string>;
  temps: any[];
  userId?: string;
  onChange: () => void;
}> = ({ chauffeurs, chauffeurMap, temps, userId, onChange }) => {
  const [selectedChauffeur, setSelectedChauffeur] = useState<string>('');
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());

  const sorted = useMemo(() => [...chauffeurs].sort((a: any, b: any) =>
    `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)), [chauffeurs]);

  const tempsChauffeur = useMemo(() => {
    if (!selectedChauffeur) return [];
    return temps
      .filter(t => t.chauffeur_id === selectedChauffeur && new Date(t.date_jour).getFullYear() === annee)
      .sort((a, b) => a.date_jour.localeCompare(b.date_jour));
  }, [temps, selectedChauffeur, annee]);

  const synthese = useMemo(() => {
    const mois = Array.from({ length: 12 }, () => ({ distance: 0, temps: 0, saisies: 0 }));
    tempsChauffeur.forEach(t => {
      const m = new Date(t.date_jour).getMonth();
      mois[m].distance += Number(t.distance_km || 0);
      mois[m].temps += Number(t.temps_conduite_h || 0);
      mois[m].saisies += 1;
    });
    const cumulD = mois.reduce((s, m) => s + m.distance, 0);
    const cumulT = mois.reduce((s, m) => s + m.temps, 0);
    const cumulS = mois.reduce((s, m) => s + m.saisies, 0);
    return { mois, cumulD, cumulT, cumulS };
  }, [tempsChauffeur]);

  const anneesDispo = useMemo(() => {
    const ys = new Set<number>([new Date().getFullYear()]);
    temps.forEach(t => ys.add(new Date(t.date_jour).getFullYear()));
    return [...ys].sort((a, b) => b - a);
  }, [temps]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Suivi temps de travail – Sélection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[260px]">
            <Label>Chauffeur *</Label>
            <Select value={selectedChauffeur} onValueChange={setSelectedChauffeur}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un chauffeur..." /></SelectTrigger>
              <SelectContent>
                {sorted.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom} {c.prenom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Année</Label>
            <Select value={String(annee)} onValueChange={v => setAnnee(parseInt(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anneesDispo.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedChauffeur && (
            <TempsDialog
              chauffeurs={chauffeurs}
              userId={userId}
              onSaved={onChange}
              preselectedChauffeurId={selectedChauffeur}
              triggerLabel="Nouvelle saisie"
            />
          )}
        </CardContent>
      </Card>

      {!selectedChauffeur ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Sélectionnez un chauffeur pour afficher la synthèse mensuelle et le cumul annuel.
        </CardContent></Card>
      ) : (
        <>
          {/* SYNTHESE MENSUELLE + CUMUL ANNUEL */}
          <Card>
            <CardHeader>
              <CardTitle>Synthèse {annee} – {chauffeurMap.get(selectedChauffeur)}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-right">Distance (km)</TableHead>
                    <TableHead className="text-right">Temps travail (h)</TableHead>
                    <TableHead className="text-right">Saisies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {synthese.mois.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{MOIS_LABELS[i]}</TableCell>
                      <TableCell className="text-right">{m.distance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{m.temps.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{m.saisies}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Cumul annuel {annee}</TableCell>
                    <TableCell className="text-right">{synthese.cumulD.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{synthese.cumulT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{synthese.cumulS}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* DETAIL DES SAISIES */}
          <Card>
            <CardHeader>
              <CardTitle>Détail des saisies ({tempsChauffeur.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Distance (km)</TableHead>
                    <TableHead className="text-right">Temps (h)</TableHead>
                    <TableHead className="text-right">Continu max (h)</TableHead>
                    <TableHead>Commentaire</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tempsChauffeur.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(t.date_jour), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">{Number(t.distance_km).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{Number(t.temps_conduite_h).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{Number(t.temps_continu_max_h ?? 0).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{t.commentaire || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          if (confirm('Supprimer cette saisie ?')) {
                            await obcService.deleteTemps(t.id);
                            toast.success('Supprimée');
                            onChange();
                          }
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tempsChauffeur.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune saisie pour {annee}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// =============================================================
// MATRICE DE SAISIE: chauffeurs en lignes, jours du mois en colonnes
// =============================================================
const TempsConduiteMatrix: React.FC<{
  chauffeurs: any[];
  chauffeurMap: Map<string, string>;
  temps: any[];
  userId?: string;
  onChange: () => void;
}> = ({ chauffeurs, temps, userId, onChange }) => {
  const today = new Date();
  const [annee, setAnnee] = useState<number>(today.getFullYear());
  const [mois, setMois] = useState<number>(today.getMonth()); // 0-11
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ chauffeurId: string; date: string } | null>(null);
  const [editValues, setEditValues] = useState({ distance_km: 0, temps_conduite_h: 0, commentaire: '' });
  const [saving, setSaving] = useState(false);

  const sortedChauffeurs = useMemo(() => {
    const list = [...chauffeurs].sort((a: any, b: any) =>
      `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c: any) => `${c.nom} ${c.prenom} ${c.matricule || ''}`.toLowerCase().includes(q));
  }, [chauffeurs, search]);

  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const jours = Array.from({ length: nbJours }, (_, i) => i + 1);

  // Index: chauffeur_id -> date_jour (YYYY-MM-DD) -> { h, km, n }
  const grid = useMemo(() => {
    const m = new Map<string, Map<string, { h: number; km: number; n: number }>>();
    temps.forEach(t => {
      const d = new Date(t.date_jour);
      if (d.getFullYear() !== annee || d.getMonth() !== mois) return;
      const key = t.date_jour.slice(0, 10);
      if (!m.has(t.chauffeur_id)) m.set(t.chauffeur_id, new Map());
      const sub = m.get(t.chauffeur_id)!;
      const cur = sub.get(key) || { h: 0, km: 0, n: 0 };
      cur.h += Number(t.temps_conduite_h || 0);
      cur.km += Number(t.distance_km || 0);
      cur.n += 1;
      sub.set(key, cur);
    });
    return m;
  }, [temps, annee, mois]);

  const totauxChauffeurMois = (chauffeurId: string) => {
    const sub = grid.get(chauffeurId);
    if (!sub) return { h: 0, km: 0 };
    let h = 0, km = 0;
    sub.forEach(v => { h += v.h; km += v.km; });
    return { h, km };
  };

  const dateKey = (j: number) => `${annee}-${String(mois + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;

  const openCell = (chauffeurId: string, j: number) => {
    setEditing({ chauffeurId, date: dateKey(j) });
    setEditValues({ distance_km: 0, temps_conduite_h: 0, commentaire: '' });
  };

  const saveCell = async () => {
    if (!editing) return;
    if (editValues.temps_conduite_h <= 0 && editValues.distance_km <= 0) {
      toast.error('Saisir au moins distance ou temps');
      return;
    }
    setSaving(true);
    try {
      await obcService.insertTemps({
        chauffeur_id: editing.chauffeurId,
        date_jour: editing.date,
        distance_km: editValues.distance_km,
        temps_conduite_h: editValues.temps_conduite_h,
        temps_continu_max_h: 0,
        commentaire: editValues.commentaire,
        created_by: userId,
      } as any);
      toast.success('Saisie ajoutée');
      setEditing(null);
      onChange();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const moisLabels = MOIS_LABELS;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Matrice de saisie – {moisLabels[mois]} {annee}</CardTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={String(mois)} onValueChange={v => setMois(parseInt(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {moisLabels.map((label, i) => <SelectItem key={i} value={String(i)}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(annee)} onValueChange={v => setAnnee(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y =>
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Rechercher chauffeur…" value={search} onChange={e => setSearch(e.target.value)} className="w-[200px]" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">
          Cliquez une cellule pour saisir les heures et kilomètres du jour. Plusieurs saisies par jour autorisées (cumul automatique).
        </p>
        <div className="overflow-auto border rounded-lg max-h-[70vh]">
          <table className="text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r px-2 py-2 text-left min-w-[180px]">Chauffeur</th>
                {jours.map(j => {
                  const d = new Date(annee, mois, j);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={j} className={`border-b border-r px-1 py-2 text-center w-[42px] ${isWeekend ? 'bg-muted/40' : ''}`}>
                      {j}
                    </th>
                  );
                })}
                <th className="sticky right-0 z-20 bg-muted/60 border-b border-l px-2 py-2 text-right min-w-[80px]">Total h</th>
                <th className="sticky right-0 z-20 bg-muted/60 border-b border-l px-2 py-2 text-right min-w-[80px]">Total km</th>
              </tr>
            </thead>
            <tbody>
              {sortedChauffeurs.map((c: any) => {
                const sub = grid.get(c.id);
                const tot = totauxChauffeurMois(c.id);
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="sticky left-0 bg-background border-b border-r px-2 py-1 font-medium whitespace-nowrap">
                      {c.nom} {c.prenom}
                      {c.matricule && <span className="text-muted-foreground ml-1">({c.matricule})</span>}
                    </td>
                    {jours.map(j => {
                      const v = sub?.get(dateKey(j));
                      const d = new Date(annee, mois, j);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const danger = v && v.h > 10;
                      return (
                        <td
                          key={j}
                          onClick={() => openCell(c.id, j)}
                          title={v ? `${v.h}h / ${v.km}km (${v.n} saisie${v.n > 1 ? 's' : ''})` : 'Aucune saisie'}
                          className={`border-b border-r text-center cursor-pointer hover:bg-primary/10 ${isWeekend ? 'bg-muted/30' : ''} ${danger ? 'bg-destructive/20 text-destructive font-semibold' : v ? 'bg-primary/5 font-medium' : ''}`}
                        >
                          {v ? v.h.toFixed(1) : ''}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 bg-muted/60 border-b border-l px-2 py-1 text-right font-bold">{tot.h.toFixed(1)}</td>
                    <td className="sticky right-0 bg-muted/60 border-b border-l px-2 py-1 text-right font-bold">{tot.km.toFixed(0)}</td>
                  </tr>
                );
              })}
              {sortedChauffeurs.length === 0 && (
                <tr><td colSpan={jours.length + 3} className="text-center text-muted-foreground py-8">Aucun chauffeur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Dialog de saisie inline */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Saisie – {editing && format(new Date(editing.date), 'dd/MM/yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {editing && chauffeurs.find((c: any) => c.id === editing.chauffeurId)?.nom} {editing && chauffeurs.find((c: any) => c.id === editing.chauffeurId)?.prenom}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Temps (h)</Label>
                <Input type="number" step="0.1" min={0} value={editValues.temps_conduite_h}
                  onChange={e => setEditValues({ ...editValues, temps_conduite_h: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Distance (km)</Label>
                <Input type="number" min={0} value={editValues.distance_km}
                  onChange={e => setEditValues({ ...editValues, distance_km: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea rows={2} value={editValues.commentaire}
                onChange={e => setEditValues({ ...editValues, commentaire: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={saveCell} disabled={saving}>{saving ? 'Enregistrement…' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface PendingEntry {
  date: string;
  points_retires: number;
  commentaire: string;
  preuve_url?: string | null;
  preuveFile?: File | null;
}

const ViolationsMatrix: React.FC<{
  chauffeurs: any[];
  violations: any[];
  userId?: string;
  onChange: () => void;
}> = ({ chauffeurs, violations, userId, onChange }) => {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  // pending: chauffeur_id -> type -> entry
  const [pending, setPending] = useState<Record<string, Partial<Record<ObcViolationType, PendingEntry>>>>({});
  const [saving, setSaving] = useState(false);
  const [dialogCtx, setDialogCtx] = useState<{ chauffeurId: string; chauffeurLabel: string; type: ObcViolationType } | null>(null);
  const [form, setForm] = useState<PendingEntry>({ date, points_retires: 0, commentaire: '', preuveFile: null });

  const types = Object.keys(OBC_VIOLATION_LABELS) as ObcViolationType[];

  const existing = useMemo(() => {
    const m = new Map<string, Set<ObcViolationType>>();
    violations.forEach(v => {
      if (v.date_violation.slice(0, 10) === date) {
        if (!m.has(v.chauffeur_id)) m.set(v.chauffeur_id, new Set());
        m.get(v.chauffeur_id)!.add(v.type_violation);
      }
    });
    return m;
  }, [violations, date]);

  const filtered = chauffeurs.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || (c.matricule || '').toLowerCase().includes(s);
  });

  const openDialog = (c: any, type: ObcViolationType) => {
    const current = pending[c.id]?.[type];
    setForm(current || { date, points_retires: 0, commentaire: '', preuveFile: null });
    setDialogCtx({ chauffeurId: c.id, chauffeurLabel: `${c.prenom} ${c.nom}`, type });
  };

  const toggle = (c: any, type: ObcViolationType) => {
    if (pending[c.id]?.[type]) {
      setPending(prev => {
        const next = { ...prev };
        const sub = { ...(next[c.id] || {}) };
        delete sub[type];
        if (Object.keys(sub).length === 0) delete next[c.id]; else next[c.id] = sub;
        return next;
      });
    } else {
      openDialog(c, type);
    }
  };

  const confirmDialog = () => {
    if (!dialogCtx) return;
    setPending(prev => ({
      ...prev,
      [dialogCtx.chauffeurId]: { ...(prev[dialogCtx.chauffeurId] || {}), [dialogCtx.type]: { ...form } },
    }));
    setDialogCtx(null);
  };

  const isChecked = (chauffeurId: string, type: ObcViolationType) =>
    existing.get(chauffeurId)?.has(type) || !!pending[chauffeurId]?.[type];

  const totalPending = Object.values(pending).reduce((acc, sub) => acc + Object.keys(sub).length, 0);

  const save = async () => {
    if (totalPending === 0) { toast.info('Aucune sélection'); return; }
    setSaving(true);
    try {
      const ops: Promise<any>[] = [];
      Object.entries(pending).forEach(([chauffeurId, sub]) => {
        Object.entries(sub).forEach(([type, entry]) => {
          if (!entry) return;
          ops.push((async () => {
            let preuve_url: string | null = entry.preuve_url || null;
            if (entry.preuveFile) {
              try { preuve_url = await obcService.uploadPreuve(entry.preuveFile, chauffeurId); } catch {}
            }
            const dateIso = new Date(`${entry.date}T08:00:00`).toISOString();
            return obcService.createViolation({
              chauffeur_id: chauffeurId,
              date_violation: dateIso,
              type_violation: type as ObcViolationType,
              points_retires: Number(entry.points_retires) || 1,
              commentaire: entry.commentaire || null,
              mesures_prises: null,
              preuve_url,
              created_by: userId,
            } as any);
          })());
        });
      });
      await Promise.all(ops);
      toast.success(`${totalPending} violation(s) enregistrée(s)`);
      setPending({});
      onChange();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-[180px]" />
        <Input placeholder="Rechercher un chauffeur..." value={search} onChange={e => setSearch(e.target.value)} className="w-[260px]" />
        <div className="flex-1" />
        <Badge variant="secondary">{totalPending} sélection(s)</Badge>
        <Button onClick={save} disabled={saving || totalPending === 0}>
          {saving ? 'Enregistrement…' : 'Enregistrer la sélection'}
        </Button>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-2 font-medium sticky left-0 bg-muted/30 min-w-[200px]">Chauffeur</th>
              {types.map(t => (
                <th key={t} className="text-center p-2 font-medium min-w-[110px]">
                  <span className="text-[10px] leading-tight block">{OBC_VIOLATION_LABELS[t]}</span>
                </th>
              ))}
              <th className="text-center p-2 font-medium min-w-[60px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => {
              const total = (existing.get(c.id)?.size || 0) + Object.keys(pending[c.id] || {}).length;
              return (
                <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="p-2 sticky left-0 bg-background">
                    <p className="font-medium text-xs">{c.prenom} {c.nom}</p>
                    {c.matricule && <p className="text-[10px] text-muted-foreground">{c.matricule}</p>}
                  </td>
                  {types.map(t => {
                    const already = existing.get(c.id)?.has(t) || false;
                    const checked = isChecked(c.id, t);
                    return (
                      <td key={t} className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(c, t)}
                            className="h-4 w-4 cursor-pointer"
                            title={already ? 'Déjà enregistrée — cocher pour en ajouter une autre ce jour' : 'Cliquer pour saisir les détails'}
                          />
                          {already && <span className="text-[9px] text-muted-foreground" title="Déjà enregistrée ce jour">✓</span>}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    {total > 0 && <Badge variant={total >= 3 ? 'destructive' : 'secondary'}>{total}</Badge>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={types.length + 2} className="text-center text-muted-foreground py-8">Aucun chauffeur</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Cochez les violations constatées pour chaque chauffeur à la date sélectionnée, puis cliquez sur « Enregistrer la sélection ». Une coche ✓ indique qu'une violation du même type existe déjà ce jour — vous pouvez en ajouter une autre.
      </p>

      <Dialog open={!!dialogCtx} onOpenChange={(o) => !o && setDialogCtx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogCtx ? `${OBC_VIOLATION_LABELS[dialogCtx.type]} – ${dialogCtx.chauffeurLabel}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Points retirés</Label>
              <Input type="number" min={0} value={form.points_retires}
                onChange={e => setForm(f => ({ ...f, points_retires: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} />
            </div>
            <div>
              <Label>Preuve (optionnel)</Label>
              <Input type="file" accept="image/*,application/pdf"
                onChange={e => setForm(f => ({ ...f, preuveFile: e.target.files?.[0] || null }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCtx(null)}>Annuler</Button>
            <Button onClick={confirmDialog}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PointsMatrix: React.FC<{
  chauffeurs: any[];
  violations: any[];
  pointsMap: Map<string, number>;
  userId?: string;
  onChange: () => void;
}> = ({ chauffeurs, violations, pointsMap, userId, onChange }) => {
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; label: string } | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'survitesse' as ObcViolationType,
    points_retires: 0,
    commentaire: '',
  });

  // Cumul des points retirés à partir des violations enregistrées
  const retiresMap = useMemo(() => {
    const m = new Map<string, number>();
    violations.forEach(v => {
      m.set(v.chauffeur_id, (m.get(v.chauffeur_id) || 0) + Number(v.points_retires || 0));
    });
    return m;
  }, [violations]);

  const filtered = chauffeurs.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || (c.matricule || '').toLowerCase().includes(s);
  });

  const openFor = (c: any) => {
    setTarget({ id: c.id, label: `${c.prenom} ${c.nom}` });
    setForm({
      date: new Date().toISOString().slice(0, 10),
      type: 'survitesse',
      points_retires: 0,
      commentaire: '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await obcService.createViolation({
        chauffeur_id: target.id,
        date_violation: new Date(`${form.date}T08:00:00`).toISOString(),
        type_violation: form.type,
        points_retires: Number(form.points_retires) || 0,
        commentaire: form.commentaire || null,
        mesures_prises: null,
        preuve_url: null,
        created_by: userId,
      } as any);
      toast.success('Points enregistrés');
      setOpen(false);
      onChange();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Rechercher un chauffeur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[260px]"
        />
        <div className="flex-1" />
        <p className="text-xs text-muted-foreground">Capital initial : 12 points</p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-2 font-medium min-w-[200px]">Chauffeur</th>
              <th className="text-center p-2 font-medium">Capital</th>
              <th className="text-center p-2 font-medium">Total retirés</th>
              <th className="text-center p-2 font-medium">Solde restant</th>
              <th className="text-center p-2 font-medium">Statut</th>
              <th className="text-center p-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => {
              const solde = pointsMap.get(c.id) ?? 12;
              const retires = retiresMap.get(c.id) || 0;
              const variant = solde === 0 ? 'destructive' : solde <= 3 ? 'destructive' : solde <= 6 ? 'secondary' : 'default';
              return (
                <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="p-2">
                    <p className="font-medium text-xs">{c.prenom} {c.nom}</p>
                    {c.matricule && <p className="text-[10px] text-muted-foreground">{c.matricule}</p>}
                  </td>
                  <td className="p-2 text-center font-semibold text-foreground">12</td>
                  <td className="p-2 text-center">
                    {retires > 0
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold text-xs">-{retires}</span>
                      : <span className="font-semibold text-foreground">0</span>}
                  </td>
                  <td className="p-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs ${
                      solde === 0 ? 'bg-destructive/15 text-destructive'
                      : solde <= 3 ? 'bg-destructive/10 text-destructive'
                      : solde <= 6 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    }`}>{solde} / 12</span>
                  </td>
                  <td className="p-2 text-center">
                    {solde === 0
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground font-semibold text-xs">BLOQUÉ</span>
                      : solde <= 3
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold text-xs">À risque</span>
                        : solde <= 6
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold text-xs">Vigilance</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">OK</span>}
                  </td>
                  <td className="p-2 text-center">
                    <Button size="sm" variant="outline" onClick={() => openFor(c)}>
                      <Plus className="h-3 w-3 mr-1" /> Retirer
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-8">Aucun chauffeur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer des points{target ? ` – ${target.label}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type de violation</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as ObcViolationType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(OBC_VIOLATION_LABELS) as ObcViolationType[]).map(k => (
                    <SelectItem key={k} value={k}>{OBC_VIOLATION_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Nombre de points retirés</Label>
              <Input type="number" min={0} max={12} value={form.points_retires}
                onChange={e => setForm(f => ({ ...f, points_retires: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OBC;

