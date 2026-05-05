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

export default OBC;
