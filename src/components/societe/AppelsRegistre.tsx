import React, { useEffect, useMemo, useState } from 'react';
import { appelsService, AppelRegistre, AppelRegistreInsert } from '@/services/appelsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Phone, Plus, Pencil, Trash2, Search, Loader2, PhoneIncoming, Wrench, CheckCircle2 } from 'lucide-react';

const GRAVITES = [
  { value: 'G1', label: 'G1 — Mineur' },
  { value: 'G2', label: 'G2 — Modéré' },
  { value: 'G3', label: 'G3 — Grave' },
];

const STATUTS = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'clos', label: 'Clôturé' },
];

type FormState = {
  date_appel: string;
  heure_reception: string;
  recepteur_appel: string;
  appelant_nom: string;
  qualite_appelant: string;
  contact_telephonique: string;
  numero_tracteur: string;
  numero_citerne: string;
  produit_transporte: string;
  quantite_chargee: string;
  localisation: string;
  motif_appel: string;
  niveau_gravite: string;
  description_faits: string;
  nombre_blesses: string;
  deversement: boolean;
  volume_deverse: string;
  heure_alerte_hierarchie: string;
  heure_depart_equipe: string;
  heure_arrivee_lieu: string;
  heure_fin_intervention: string;
  activation_plan_urgence: boolean;
  secours_externes: string;
  mesures_urgence: string;
  mesures_correctives: string;
  recommandations: string;
  statut: string;
};

const emptyForm: FormState = {
  date_appel: new Date().toISOString().slice(0, 10),
  heure_reception: '',
  recepteur_appel: '',
  appelant_nom: '',
  qualite_appelant: '',
  contact_telephonique: '',
  numero_tracteur: '',
  numero_citerne: '',
  produit_transporte: '',
  quantite_chargee: '',
  localisation: '',
  motif_appel: '',
  niveau_gravite: 'G1',
  description_faits: '',
  nombre_blesses: '0',
  deversement: false,
  volume_deverse: '',
  heure_alerte_hierarchie: '',
  heure_depart_equipe: '',
  heure_arrivee_lieu: '',
  heure_fin_intervention: '',
  activation_plan_urgence: false,
  secours_externes: '',
  mesures_urgence: '',
  mesures_correctives: '',
  recommandations: '',
  statut: 'nouveau',
};

const graviteBadge = (g: string) => {
  if (g === 'G3') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (g === 'G2') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  return 'bg-success/10 text-success border-success/20';
};

const statutBadge = (s: string) => {
  if (s === 'clos') return 'bg-success/10 text-success border-success/20';
  if (s === 'en_cours') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  return 'bg-muted text-muted-foreground border-border';
};

export const AppelsRegistre: React.FC = () => {
  const { toast } = useToast();
  const [appels, setAppels] = useState<AppelRegistre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppelRegistre | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setAppels(await appelsService.getAll());
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Chargement impossible', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appels.filter((a) => {
      if (filtreStatut !== 'tous' && a.statut !== filtreStatut) return false;
      if (!q) return true;
      return [a.numero_fiche, a.appelant_nom, a.numero_tracteur, a.motif_appel, a.localisation, a.recepteur_appel]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [appels, search, filtreStatut]);

  const stats = useMemo(() => ({
    total: appels.length,
    nouveaux: appels.filter((a) => a.statut === 'nouveau').length,
    enCours: appels.filter((a) => a.statut === 'en_cours').length,
    clos: appels.filter((a) => a.statut === 'clos').length,
  }), [appels]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: AppelRegistre) => {
    setEditing(a);
    setForm({
      date_appel: a.date_appel,
      heure_reception: a.heure_reception ?? '',
      recepteur_appel: a.recepteur_appel,
      appelant_nom: a.appelant_nom,
      qualite_appelant: a.qualite_appelant ?? '',
      contact_telephonique: a.contact_telephonique ?? '',
      numero_tracteur: a.numero_tracteur,
      numero_citerne: a.numero_citerne ?? '',
      produit_transporte: a.produit_transporte ?? '',
      quantite_chargee: a.quantite_chargee != null ? String(a.quantite_chargee) : '',
      localisation: a.localisation,
      motif_appel: a.motif_appel,
      niveau_gravite: a.niveau_gravite,
      description_faits: a.description_faits,
      nombre_blesses: String(a.nombre_blesses ?? 0),
      deversement: !!a.deversement,
      volume_deverse: a.volume_deverse != null ? String(a.volume_deverse) : '',
      heure_alerte_hierarchie: a.heure_alerte_hierarchie ?? '',
      heure_depart_equipe: a.heure_depart_equipe ?? '',
      heure_arrivee_lieu: a.heure_arrivee_lieu ?? '',
      heure_fin_intervention: a.heure_fin_intervention ?? '',
      activation_plan_urgence: !!a.activation_plan_urgence,
      secours_externes: a.secours_externes ?? '',
      mesures_urgence: a.mesures_urgence ?? '',
      mesures_correctives: a.mesures_correctives ?? '',
      recommandations: a.recommandations ?? '',
      statut: a.statut,
    });
    setDialogOpen(true);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.date_appel || !form.heure_reception || !form.recepteur_appel || !form.appelant_nom ||
        !form.numero_tracteur || !form.localisation || !form.motif_appel || !form.description_faits) {
      toast({ title: 'Champs obligatoires', description: 'Renseignez tous les champs marqués *', variant: 'destructive' });
      return;
    }
    const payload: AppelRegistreInsert = {
      numero_fiche: editing?.numero_fiche ?? '',
      date_appel: form.date_appel,
      heure_reception: form.heure_reception,
      recepteur_appel: form.recepteur_appel,
      appelant_nom: form.appelant_nom,
      qualite_appelant: form.qualite_appelant || null,
      contact_telephonique: form.contact_telephonique || null,
      numero_tracteur: form.numero_tracteur,
      numero_citerne: form.numero_citerne || null,
      produit_transporte: form.produit_transporte || null,
      quantite_chargee: form.quantite_chargee ? Number(form.quantite_chargee) : null,
      localisation: form.localisation,
      motif_appel: form.motif_appel,
      niveau_gravite: form.niveau_gravite,
      description_faits: form.description_faits,
      nombre_blesses: form.nombre_blesses ? Number(form.nombre_blesses) : 0,
      deversement: form.deversement,
      volume_deverse: form.volume_deverse ? Number(form.volume_deverse) : null,
      heure_alerte_hierarchie: form.heure_alerte_hierarchie || null,
      heure_depart_equipe: form.heure_depart_equipe || null,
      heure_arrivee_lieu: form.heure_arrivee_lieu || null,
      heure_fin_intervention: form.heure_fin_intervention || null,
      activation_plan_urgence: form.activation_plan_urgence,
      secours_externes: form.secours_externes || null,
      mesures_urgence: form.mesures_urgence || null,
      mesures_correctives: form.mesures_correctives || null,
      recommandations: form.recommandations || null,
      statut: form.statut,
    };
    setSaving(true);
    try {
      if (editing) {
        await appelsService.update(editing.id, payload);
        toast({ title: 'Fiche mise à jour' });
      } else {
        await appelsService.create(payload);
        toast({ title: 'Appel enregistré' });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Enregistrement impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: AppelRegistre) => {
    if (!window.confirm(`Supprimer la fiche ${a.numero_fiche} ?`)) return;
    try {
      await appelsService.delete(a.id);
      toast({ title: 'Fiche supprimée' });
      await load();
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Suppression impossible', variant: 'destructive' });
    }
  };

  const handleStatut = async (a: AppelRegistre, statut: string) => {
    try {
      await appelsService.update(a.id, { statut });
      toast({ title: statut === 'clos' ? 'Appel clôturé' : 'Prise en charge enregistrée' });
      await load();
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Mise à jour impossible', variant: 'destructive' });
    }
  };

  const field = (label: string, key: keyof FormState, opts: { required?: boolean; type?: string; placeholder?: string } = {}) => (
    <div className="space-y-1.5" key={key}>
      <Label>{label}{opts.required && ' *'}</Label>
      <Input
        type={opts.type ?? 'text'}
        placeholder={opts.placeholder}
        value={String(form[key] ?? '')}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Phone className="h-8 w-8 text-primary" />
          <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Appels reçus</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <PhoneIncoming className="h-8 w-8 text-muted-foreground" />
          <div><div className="text-2xl font-bold">{stats.nouveaux}</div><div className="text-sm text-muted-foreground">Nouveaux</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-amber-500" />
          <div><div className="text-2xl font-bold">{stats.enCours}</div><div className="text-sm text-muted-foreground">En cours</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div><div className="text-2xl font-bold">{stats.clos}</div><div className="text-sm text-muted-foreground">Clôturés</div></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Registre des appels d'urgence
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 w-full sm:w-64" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nouvel appel</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Aucun appel enregistré</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiche</TableHead>
                    <TableHead>Date / Heure</TableHead>
                    <TableHead>Appelant</TableHead>
                    <TableHead>Tracteur</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Gravité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.numero_fiche}</TableCell>
                      <TableCell>{new Date(a.date_appel + 'T00:00:00').toLocaleDateString('fr-FR')} {a.heure_reception}</TableCell>
                      <TableCell>
                        <div>{a.appelant_nom}</div>
                        {a.qualite_appelant && <div className="text-xs text-muted-foreground">{a.qualite_appelant}</div>}
                      </TableCell>
                      <TableCell>{a.numero_tracteur}{a.numero_citerne ? ` / ${a.numero_citerne}` : ''}</TableCell>
                      <TableCell className="max-w-48 truncate" title={a.motif_appel}>{a.motif_appel}</TableCell>
                      <TableCell><Badge variant="outline" className={graviteBadge(a.niveau_gravite)}>{a.niveau_gravite}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statutBadge(a.statut)}>
                          {STATUTS.find((s) => s.value === a.statut)?.label ?? a.statut}
                        </Badge>
                        {a.delai_mobilisation_min != null && (
                          <div className="text-xs text-muted-foreground mt-1">Mobilisation : {a.delai_mobilisation_min} min</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {a.statut === 'nouveau' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatut(a, 'en_cours')}>Prendre en charge</Button>
                          )}
                          {a.statut === 'en_cours' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatut(a, 'clos')}>Clôturer</Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? `Fiche ${editing.numero_fiche}` : 'Nouvel appel'}</DialogTitle>
            <DialogDescription>Suivi de l'appel, de sa prise en charge jusqu'à sa clôture.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-6 pr-2">
            <div>
              <h4 className="font-semibold mb-3">Identification de l'appel</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {field("Date de l'appel", 'date_appel', { required: true, type: 'date' })}
                {field("Heure de réception", 'heure_reception', { required: true, type: 'time' })}
                {field("Récepteur de l'appel", 'recepteur_appel', { required: true })}
                {field('Appelant — Prénoms et Nom', 'appelant_nom', { required: true })}
                {field("Qualité de l'appelant", 'qualite_appelant', { placeholder: 'Conducteur, transitaire…' })}
                {field('Contact téléphonique', 'contact_telephonique')}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Moyen concerné & localisation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {field('N° Tracteur', 'numero_tracteur', { required: true })}
                {field('N° Citerne', 'numero_citerne')}
                {field('Produit transporté', 'produit_transporte')}
                {field('Quantité chargée (L)', 'quantite_chargee', { type: 'number' })}
                {field('Localisation — axe / PK / repère', 'localisation', { required: true })}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Caractérisation de l'événement</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {field("Motif de l'appel", 'motif_appel', { required: true })}
                <div className="space-y-1.5">
                  <Label>Niveau de gravité *</Label>
                  <Select value={form.niveau_gravite} onValueChange={(v) => set('niveau_gravite', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GRAVITES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {field('Nombre de blessés', 'nombre_blesses', { type: 'number' })}
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox id="deversement" checked={form.deversement} onCheckedChange={(v) => set('deversement', !!v)} />
                  <Label htmlFor="deversement">Déversement</Label>
                </div>
                {form.deversement && field('Volume déversé estimé (L)', 'volume_deverse', { type: 'number' })}
              </div>
              <div className="space-y-1.5 mt-4">
                <Label>Brève description des faits *</Label>
                <Textarea value={form.description_faits} onChange={(e) => set('description_faits', e.target.value)} rows={3} />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Chronologie et délais de réaction</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {field("Heure d'alerte de la hiérarchie", 'heure_alerte_hierarchie', { type: 'time' })}
                {field("Heure de départ de l'équipe", 'heure_depart_equipe', { type: 'time' })}
                {field("Heure d'arrivée sur le lieu", 'heure_arrivee_lieu', { type: 'time' })}
                {field("Heure de fin d'intervention", 'heure_fin_intervention', { type: 'time' })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Le délai de mobilisation est calculé automatiquement entre la réception et le départ.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Réponse opérationnelle</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="plan_urgence" checked={form.activation_plan_urgence} onCheckedChange={(v) => set('activation_plan_urgence', !!v)} />
                  <Label htmlFor="plan_urgence">Activation du plan d'urgence</Label>
                </div>
                {field('Secours externes sollicités', 'secours_externes', { placeholder: 'Sapeurs-pompiers, gendarmerie…' })}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Mesures d'urgence appliquées</Label>
                  <Textarea value={form.mesures_urgence} onChange={(e) => set('mesures_urgence', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Mesures correctives décidées</Label>
                  <Textarea value={form.mesures_correctives} onChange={(e) => set('mesures_correctives', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Recommandations</Label>
                  <Textarea value={form.recommandations} onChange={(e) => set('recommandations', e.target.value)} rows={2} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Statut de suivi</h4>
              <Select value={form.statut} onValueChange={(v) => set('statut', v)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
