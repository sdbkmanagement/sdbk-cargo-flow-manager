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
import { AlertTriangle, Plus, Trash2, Activity, Clock, ShieldAlert, Settings as SettingsIcon } from 'lucide-react';
import { format } from 'date-fns';

const OBC: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: chauffeurs = [] } = useQuery({ queryKey: ['chauffeurs'], queryFn: () => chauffeursService.getAll() });
  const { data: violations = [] } = useQuery({ queryKey: ['obc-violations'], queryFn: () => obcService.listViolations() });
  const { data: points = [] } = useQuery({ queryKey: ['obc-points'], queryFn: () => obcService.listPoints() });
  const { data: temps = [] } = useQuery({ queryKey: ['obc-temps'], queryFn: () => obcService.listTemps() });
  const { data: alertes = [] } = useQuery({ queryKey: ['obc-alertes'], queryFn: () => obcService.listAlertes() });
  const { data: config = [] } = useQuery({ queryKey: ['obc-config'], queryFn: () => obcService.getConfig() });

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
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="temps">Temps de conduite</TabsTrigger>
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
            <CardHeader><CardTitle>Points par chauffeur</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chauffeurs.map((c: any) => {
                    const p = pointsMap.get(c.id) ?? 12;
                    const variant = p === 0 ? 'destructive' : p <= 3 ? 'destructive' : p <= 6 ? 'secondary' : 'default';
                    return (
                      <TableRow key={c.id}>
                        <TableCell>{c.prenom} {c.nom}</TableCell>
                        <TableCell><Badge variant={variant as any}>{p} / 12</Badge></TableCell>
                        <TableCell>{p === 0 ? <Badge variant="destructive">BLOQUÉ</Badge> : p <= 3 ? <Badge variant="secondary">À risque</Badge> : <Badge>OK</Badge>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
    points_retires: 1,
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

const ViolationsMatrix: React.FC<{
  chauffeurs: any[];
  violations: any[];
  userId?: string;
  onChange: () => void;
}> = ({ chauffeurs, violations, userId, onChange }) => {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState<Record<string, Set<ObcViolationType>>>({});
  const [saving, setSaving] = useState(false);

  const types = Object.keys(OBC_VIOLATION_LABELS) as ObcViolationType[];

  // Map des violations existantes pour la date sélectionnée: chauffeur_id -> Set<type>
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

  const toggle = (chauffeurId: string, type: ObcViolationType) => {
    if (existing.get(chauffeurId)?.has(type)) return; // déjà enregistré
    setPending(prev => {
      const next = { ...prev };
      const set = new Set(next[chauffeurId] || []);
      if (set.has(type)) set.delete(type); else set.add(type);
      next[chauffeurId] = set;
      return next;
    });
  };

  const isChecked = (chauffeurId: string, type: ObcViolationType) =>
    existing.get(chauffeurId)?.has(type) || pending[chauffeurId]?.has(type) || false;

  const totalPending = Object.values(pending).reduce((acc, s) => acc + s.size, 0);

  const save = async () => {
    if (totalPending === 0) { toast.info('Aucune sélection'); return; }
    setSaving(true);
    try {
      const dateIso = new Date(`${date}T08:00:00`).toISOString();
      const ops: Promise<any>[] = [];
      Object.entries(pending).forEach(([chauffeurId, set]) => {
        set.forEach(type => {
          ops.push(obcService.createViolation({
            chauffeur_id: chauffeurId,
            date_violation: dateIso,
            type_violation: type,
            points_retires: 1,
            commentaire: null,
            mesures_prises: null,
            preuve_url: null,
            created_by: userId,
          } as any));
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
              const total = (existing.get(c.id)?.size || 0) + (pending[c.id]?.size || 0);
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
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={already}
                          onChange={() => toggle(c.id, t)}
                          className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          title={already ? 'Déjà enregistrée' : ''}
                        />
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
        Cochez les violations constatées pour chaque chauffeur à la date sélectionnée, puis cliquez sur « Enregistrer la sélection ». Les cases grisées sont déjà enregistrées.
      </p>
    </div>
  );
};

export default OBC;

