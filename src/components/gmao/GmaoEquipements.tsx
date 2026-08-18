import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { gmaoService, GmaoEquipement } from '@/services/gmao';
import { GmaoEquipementDetail } from './GmaoEquipementDetail';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Image as ImageIcon } from 'lucide-react';
import { GmaoPhotoUpload } from './GmaoPhotoUpload';

const STATUTS = [
  { value: 'operationnel', label: 'Opérationnel' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'reforme', label: 'Réformé' },
];

const CRITICITES = [
  { value: 'faible', label: 'Faible' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
];

const TYPES = [
  { value: 'tracteur', label: 'Tracteur' },
  { value: 'remorque', label: 'Remorque' },
  { value: 'autre', label: 'Autre équipement' },
];

const labelType = (v: string) => TYPES.find((t) => t.value === v)?.label || 'Autre';

const typeClassName = (type?: string | null) => {
  switch (type) {
    case 'tracteur':
      return 'border-primary bg-primary text-primary-foreground';
    case 'remorque':
      return 'border-border bg-secondary text-secondary-foreground';
    default:
      return 'border-border bg-muted text-foreground';
  }
};

const statutClassName = (statut?: string | null) => {
  switch (statut) {
    case 'operationnel':
      return 'border-primary bg-primary text-primary-foreground';
    case 'en_maintenance':
      return 'border-border bg-secondary text-secondary-foreground';
    case 'hors_service':
      return 'border-destructive bg-destructive text-destructive-foreground';
    case 'reforme':
      return 'border-border bg-muted text-foreground';
    default:
      return 'border-border bg-background text-foreground';
  }
};

const formInitial = {
  type_equipement: 'tracteur',
  immatriculation: '',
  code: '',
  designation: '',
  marque: '',
  modele: '',
  numero_chassis: '',
  numero_serie: '',
  volume_litres: '',
  configuration: '',
  date_mise_circulation: '',
  site: '',
  departement: '',
  statut: 'operationnel',
  criticite: 'normale',
  compteur_km: 0,
  observations: '',
  photo_url: null as string | null,
};

export const GmaoEquipements: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoEquipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('tous');
  const [selection, setSelection] = useState<GmaoEquipement | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...formInitial });

  const charger = async () => {
    try {
      setItems(await gmaoService.getEquipements());
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    const immat = (form.immatriculation || '').trim().toUpperCase();
    const estRoulant = form.type_equipement !== 'autre';

    if (estRoulant && !immat) {
      toast({ title: 'Immatriculation requise', description: "Chaque tracteur ou remorque est identifié par son immatriculation", variant: 'destructive' });
      return;
    }
    if (!estRoulant && !form.code) {
      toast({ title: 'Code requis', description: 'Le code est obligatoire pour un équipement non roulant', variant: 'destructive' });
      return;
    }

    const prefixe = form.type_equipement === 'tracteur' ? 'TR-' : 'RM-';
    const payload: Record<string, any> = {
      type_equipement: form.type_equipement,
      immatriculation: estRoulant ? immat : null,
      code: estRoulant ? (form.code || `${prefixe}${immat}`) : form.code,
      designation: form.designation || (estRoulant ? `${labelType(form.type_equipement)} ${immat}` : form.code),
      marque: form.marque || null,
      modele: form.modele || null,
      numero_chassis: form.numero_chassis || null,
      numero_serie: form.numero_serie || null,
      volume_litres: form.volume_litres ? Number(form.volume_litres) : null,
      configuration: form.configuration || null,
      date_mise_circulation: form.date_mise_circulation || null,
      site: form.site || null,
      departement: form.departement || null,
      statut: form.statut,
      criticite: form.criticite,
      compteur_km: Number(form.compteur_km) || 0,
      observations: form.observations || null,
      photo_url: form.photo_url || null,
    };

    try {
      await gmaoService.createEquipement(payload);
      toast({ title: 'Équipement créé' });
      setOpen(false);
      setForm({ ...formInitial });
      charger();
    } catch (e: any) {
      const message = String(e.message || '').includes('uniq')
        ? 'Cette immatriculation est déjà enregistrée comme équipement'
        : e.message;
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    }
  };

  const importer = async () => {
    try {
      const n = await gmaoService.importerVehicules();
      toast({ title: 'Import terminé', description: `${n} immatriculation(s) ajoutée(s) au parc GMAO` });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const filtres = items
    .filter((e) => filtreType === 'tous' || e.type_equipement === filtreType)
    .filter((e) =>
      `${e.immatriculation || ''} ${e.code} ${e.designation} ${e.marque || ''} ${e.site || ''}`
        .toLowerCase()
        .includes(recherche.toLowerCase())
    );

  const nb = (t: string) => items.filter((e) => e.type_equipement === t).length;
  const estRoulant = form.type_equipement !== 'autre';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Parc d'équipements</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Une fiche par immatriculation — {nb('tracteur')} tracteur(s), {nb('remorque')} remorque(s), {nb('autre')} autre(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={importer}>
              <Download className="w-4 h-4 mr-2" /> Importer les immatriculations
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Nouvel équipement</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nouvel équipement</DialogTitle></DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Type d'équipement *</Label>
                    <Select value={form.type_equipement} onValueChange={(v) => setForm({ ...form, type_equipement: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {estRoulant ? (
                    <div>
                      <Label>Immatriculation *</Label>
                      <Input value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value.toUpperCase() })} placeholder="Ex : RC-1234-A" />
                    </div>
                  ) : (
                    <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                  )}
                  <div><Label>Désignation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                  <div><Label>Marque</Label><Input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} /></div>
                  <div><Label>Modèle</Label><Input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} /></div>
                  <div><Label>N° de châssis</Label><Input value={form.numero_chassis} onChange={(e) => setForm({ ...form, numero_chassis: e.target.value })} /></div>
                  {form.type_equipement === 'remorque' && (
                    <div><Label>Volume (litres)</Label><Input type="number" value={form.volume_litres} onChange={(e) => setForm({ ...form, volume_litres: e.target.value })} /></div>
                  )}
                  <div><Label>Configuration</Label><Input value={form.configuration} onChange={(e) => setForm({ ...form, configuration: e.target.value })} /></div>
                  <div><Label>Date de mise en circulation</Label><Input type="date" value={form.date_mise_circulation} onChange={(e) => setForm({ ...form, date_mise_circulation: e.target.value })} /></div>
                  <div><Label>Compteur km</Label><Input type="number" value={form.compteur_km} onChange={(e) => setForm({ ...form, compteur_km: e.target.value })} /></div>
                  <div><Label>Site</Label><Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} /></div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Criticité</Label>
                    <Select value={form.criticite} onValueChange={(v) => setForm({ ...form, criticite: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CRITICITES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <GmaoPhotoUpload
                      value={form.photo_url}
                      onChange={(url) => setForm({ ...form, photo_url: url })}
                      reference={form.immatriculation || form.code}
                      id="gmao-photo-nouvel-equipement"
                    />
                  </div>
                  <div className="md:col-span-2"><Label>Observations</Label><Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button onClick={enregistrer}>Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Rechercher par immatriculation, code, marque…" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="max-w-sm" />
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>Immatriculation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Marque / modèle</TableHead>
                  <TableHead>Compteur km</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7}>Chargement…</TableCell></TableRow>}
                {!loading && filtres.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-muted-foreground">Aucun équipement. Importez les immatriculations ou créez-en un.</TableCell></TableRow>
                )}
                {filtres.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelection(e)}>
                    <TableCell>
                      {e.photo_url ? (
                        <img
                          src={e.photo_url}
                          alt={`Photo ${e.immatriculation || e.code}`}
                          className="h-10 w-14 rounded object-cover border border-border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{e.immatriculation || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`whitespace-nowrap ${typeClassName(e.type_equipement)}`}
                      >
                        {labelType(e.type_equipement)}
                      </Badge>
                    </TableCell>
                    <TableCell>{e.code}</TableCell>
                    <TableCell>{[e.marque, e.modele].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell>{e.compteur_km ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`whitespace-nowrap ${statutClassName(e.statut)}`}
                      >
                        {STATUTS.find((s) => s.value === e.statut)?.label || e.statut || 'Non défini'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <GmaoEquipementDetail equipement={selection} onOpenChange={(o) => { if (!o) setSelection(null); }} onUpdated={charger} />
    </>
  );
};
