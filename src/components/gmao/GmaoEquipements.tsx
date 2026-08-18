import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { gmaoService, GmaoEquipement } from '@/services/gmao';
import { GmaoEquipementDetail } from './GmaoEquipementDetail';
import { GmaoPhotoUpload } from './GmaoPhotoUpload';
import { GmaoInterventionForm } from './GmaoInterventionForm';
import { useGmao } from './GmaoContext';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Download, Search, RotateCcw, FileSpreadsheet, FileText, ChevronUp, ChevronDown, Wrench,
  Image as ImageIcon,
} from 'lucide-react';
import {
  BadgeStatutEquipement, BadgeTypeEquipement, fmtDate, fmtMontant, fmtNombre,
  libelle, STATUTS_EQUIPEMENT, TYPES_EQUIPEMENT,
} from './gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';

const CRITICITES = [
  { value: 'faible', label: 'Faible' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
];

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

type Tri = 'immatriculation' | 'type_equipement' | 'compteur_km' | 'statut' | 'cout' | 'derniere' | 'prochaine';
const PAR_PAGE = 25;

export const GmaoEquipements: React.FC = () => {
  const { toast } = useToast();
  const { equipements, statsParEquipement, chargement, rafraichir, consommerEquipementCible } = useGmao();

  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreMarque, setFiltreMarque] = useState('toutes');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [tri, setTri] = useState<Tri>('immatriculation');
  const [ordre, setOrdre] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<GmaoEquipement | null>(null);
  const [interventionPour, setInterventionPour] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...formInitial });

  // Ouverture automatique de la fiche depuis une alerte du dashboard
  useEffect(() => {
    const cible = consommerEquipementCible();
    if (cible) {
      const e = equipements.find((x) => x.id === cible);
      if (e) setSelection(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipements]);

  const marques = useMemo(
    () => Array.from(new Set(equipements.map((e) => e.marque).filter(Boolean))).sort() as string[],
    [equipements]
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let liste = equipements.filter((e) => {
      if (filtreType !== 'tous' && e.type_equipement !== filtreType) return false;
      if (filtreStatut !== 'tous' && e.statut !== filtreStatut) return false;
      if (filtreMarque !== 'toutes' && e.marque !== filtreMarque) return false;
      if (dateDebut || dateFin) {
        const s = statsParEquipement[e.id];
        const d = s?.derniereMaintenance ? new Date(s.derniereMaintenance) : null;
        if (!d) return false;
        if (dateDebut && d < new Date(`${dateDebut}T00:00:00`)) return false;
        if (dateFin && d > new Date(`${dateFin}T23:59:59`)) return false;
      }
      if (!q) return true;
      return `${e.immatriculation || ''} ${e.code} ${e.designation} ${e.marque || ''} ${e.modele || ''} ${e.site || ''}`
        .toLowerCase()
        .includes(q);
    });

    const val = (e: GmaoEquipement) => {
      const s = statsParEquipement[e.id];
      switch (tri) {
        case 'compteur_km': return Number(e.compteur_km || 0);
        case 'cout': return s?.coutTotal || 0;
        case 'derniere': return s?.derniereMaintenance ? new Date(s.derniereMaintenance).getTime() : 0;
        case 'prochaine': return s?.prochaineEcheance ? new Date(s.prochaineEcheance).getTime() : 0;
        case 'type_equipement': return e.type_equipement || '';
        case 'statut': return e.statut || '';
        default: return (e.immatriculation || e.code || '').toString();
      }
    };

    liste = [...liste].sort((a, b) => {
      const va = val(a); const vb = val(b);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'fr');
      return ordre === 'asc' ? cmp : -cmp;
    });

    return liste;
  }, [equipements, statsParEquipement, recherche, filtreType, filtreStatut, filtreMarque, dateDebut, dateFin, tri, ordre]);

  useEffect(() => { setPage(1); }, [recherche, filtreType, filtreStatut, filtreMarque, dateDebut, dateFin]);

  const pages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const affiches = filtres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const reinitialiser = () => {
    setRecherche(''); setFiltreType('tous'); setFiltreStatut('tous');
    setFiltreMarque('toutes'); setDateDebut(''); setDateFin('');
  };

  const trierPar = (t: Tri) => {
    if (tri === t) setOrdre(ordre === 'asc' ? 'desc' : 'asc');
    else { setTri(t); setOrdre('asc'); }
  };

  const EnTete: React.FC<{ t: Tri; children: React.ReactNode; className?: string }> = ({ t, children, className }) => (
    <TableHead className={className}>
      <button className="inline-flex items-center gap-1 font-medium hover:text-primary" onClick={() => trierPar(t)}>
        {children}
        {tri === t && (ordre === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  );

  const lignesExport = () =>
    filtres.map((e) => {
      const s = statsParEquipement[e.id];
      return {
        Immatriculation: e.immatriculation || '—',
        Type: libelle(TYPES_EQUIPEMENT, e.type_equipement),
        Code: e.code,
        'Marque / modèle': [e.marque, e.modele].filter(Boolean).join(' ') || '—',
        Kilométrage: Number(e.compteur_km || 0),
        Statut: libelle(STATUTS_EQUIPEMENT, e.statut),
        'Dernière maintenance': fmtDate(s?.derniereMaintenance),
        'Prochaine maintenance': s?.prochaineEcheance ? fmtDate(s.prochaineEcheance) : (s?.prochainKm ? `${fmtNombre(s.prochainKm)} km` : '—'),
        'Coût cumulé (GNF)': Math.round(s?.coutTotal || 0),
        Interventions: s?.interventions || 0,
      };
    });

  const exportExcel = () => exporterExcel(lignesExport(), 'gmao-equipements', 'Équipements');
  const exportPdf = () => {
    const l = lignesExport();
    exporterPdf(
      'Parc d\'équipements — GMAO',
      Object.keys(l[0] || { Immatriculation: '' }),
      l.map((r) => Object.values(r) as (string | number)[]),
      'gmao-equipements',
      `${filtres.length} équipement(s)`
    );
  };

  const estRoulant = form.type_equipement !== 'autre';

  const enregistrer = async () => {
    const immat = (form.immatriculation || '').trim().toUpperCase();
    if (estRoulant && !immat) {
      toast({ title: 'Immatriculation requise', description: 'Chaque tracteur ou remorque est identifié par son immatriculation', variant: 'destructive' });
      return;
    }
    if (!estRoulant && !form.code) {
      toast({ title: 'Code requis', description: 'Le code est obligatoire pour un équipement non roulant', variant: 'destructive' });
      return;
    }
    const prefixe = form.type_equipement === 'tracteur' ? 'TR-' : 'RM-';
    try {
      await gmaoService.createEquipement({
        type_equipement: form.type_equipement,
        immatriculation: estRoulant ? immat : null,
        code: estRoulant ? (form.code || `${prefixe}${immat}`) : form.code,
        designation: form.designation || (estRoulant ? `${libelle(TYPES_EQUIPEMENT, form.type_equipement)} ${immat}` : form.code),
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
      });
      toast({ title: 'Équipement créé' });
      setOpen(false);
      setForm({ ...formInitial });
      rafraichir();
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
      rafraichir();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const nb = (t: string) => equipements.filter((e) => e.type_equipement === t).length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Parc d'équipements</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Une fiche par immatriculation — {nb('tracteur')} tracteur(s), {nb('remorque')} remorque(s), {nb('autre')} autre(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={importer}><Download className="mr-2 h-4 w-4" /> Importer la flotte</Button>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Ajouter un équipement</Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Immatriculation, code, marque, site…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {TYPES_EQUIPEMENT.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS_EQUIPEMENT.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtreMarque} onValueChange={setFiltreMarque}>
              <SelectTrigger><SelectValue placeholder="Marque" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les marques</SelectItem>
                {marques.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} title="Dernière maintenance du" />
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} title="Dernière maintenance au" />
            </div>
            <div className="md:col-span-2 xl:col-span-6">
              <Button variant="ghost" size="sm" onClick={reinitialiser}>
                <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser les filtres
              </Button>
              <span className="ml-2 text-sm text-muted-foreground">{filtres.length} résultat(s)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
                  <EnTete t="immatriculation">Immatriculation</EnTete>
                  <EnTete t="type_equipement">Type</EnTete>
                  <TableHead>Marque / modèle</TableHead>
                  <EnTete t="compteur_km" className="text-right">Kilométrage</EnTete>
                  <EnTete t="statut">Statut</EnTete>
                  <EnTete t="derniere">Dernière maint.</EnTete>
                  <EnTete t="prochaine">Prochaine maint.</EnTete>
                  <EnTete t="cout" className="text-right">Coût cumulé</EnTete>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargement && <TableRow><TableCell colSpan={10}>Chargement…</TableCell></TableRow>}
                {!chargement && affiches.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    Aucun équipement ne correspond aux filtres.
                  </TableCell></TableRow>
                )}
                {affiches.map((e) => {
                  const s = statsParEquipement[e.id];
                  return (
                    <TableRow key={e.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelection(e)}>
                      <TableCell>
                        {e.photo_url ? (
                          <img src={e.photo_url} alt={`Photo ${e.immatriculation || e.code}`} className="h-10 w-14 rounded border border-border object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{e.immatriculation || e.code}</TableCell>
                      <TableCell><BadgeTypeEquipement type={e.type_equipement} /></TableCell>
                      <TableCell className="text-sm">{[e.marque, e.modele].filter(Boolean).join(' ') || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNombre(e.compteur_km)}</TableCell>
                      <TableCell><BadgeStatutEquipement statut={e.statut} /></TableCell>
                      <TableCell className="text-sm">{fmtDate(s?.derniereMaintenance)}</TableCell>
                      <TableCell className="text-sm">
                        {s?.prochaineEcheance ? fmtDate(s.prochaineEcheance) : s?.prochainKm ? `${fmtNombre(s.prochainKm)} km` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{fmtMontant(s?.coutTotal)}</TableCell>
                      <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setInterventionPour(e.id)} title="Créer une intervention">
                          <Wrench className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} / {pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Création d'équipement */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvel équipement</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Type d'équipement *</Label>
              <Select value={form.type_equipement} onValueChange={(v) => setForm({ ...form, type_equipement: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES_EQUIPEMENT.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
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
                <SelectContent>{STATUTS_EQUIPEMENT.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
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

      <GmaoInterventionForm
        open={!!interventionPour}
        onOpenChange={(o) => { if (!o) setInterventionPour(null); }}
        equipementId={interventionPour}
      />

      <GmaoEquipementDetail
        equipement={selection}
        onOpenChange={(o) => { if (!o) setSelection(null); }}
        onUpdated={rafraichir}
      />
    </>
  );
};
