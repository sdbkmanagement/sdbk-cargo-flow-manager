import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gmaoService } from '@/services/gmao';
import { useGmao } from './GmaoContext';
import { GmaoInterventionForm } from './GmaoInterventionForm';
import { GmaoDemandes } from './GmaoDemandes';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Search, RotateCcw, FileSpreadsheet, FileText, CheckCircle, Undo2,
} from 'lucide-react';
import {
  BadgePriorite, BadgeStatutOt, fmtDate, fmtMontant, libelle, STATUTS_OT, TYPES_MAINTENANCE,
} from './gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';
import { cn } from '@/lib/utils';

const RAPIDES = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'retard', label: 'En retard' },
  { value: 'urgentes', label: 'Urgentes' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminees', label: 'Terminées' },
];

export const GmaoInterventions: React.FC = () => {
  const { toast } = useToast();
  const { ots, chargement, rafraichir, equipementParId, consommerEquipementCible } = useGmao();
  const [rapide, setRapide] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [open, setOpen] = useState(false);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const maintenant = new Date();
    const finSemaine = new Date(maintenant);
    finSemaine.setDate(finSemaine.getDate() + 7);
    const jour = maintenant.toISOString().slice(0, 10);

    return ots.filter((o) => {
      const eq = equipementParId(o.equipement_id);
      if (q) {
        const texte = `${o.numero || ''} ${o.titre} ${eq?.immatriculation || ''} ${eq?.code || ''} ${o.diagnostic || ''} ${o.travaux_realises || ''}`.toLowerCase();
        if (!texte.includes(q)) return false;
      }
      if (filtreType !== 'tous' && o.type_maintenance !== filtreType) return false;
      if (filtreStatut !== 'tous' && (o.cloture ? 'cloture' : o.statut) !== filtreStatut) return false;

      switch (rapide) {
        case 'aujourdhui':
          return (o.date_planifiee || '').slice(0, 10) === jour;
        case 'semaine':
          return !!o.date_planifiee && new Date(o.date_planifiee) >= maintenant && new Date(o.date_planifiee) <= finSemaine;
        case 'retard':
          return !o.cloture && !!o.date_planifiee && new Date(o.date_planifiee) < maintenant && o.statut !== 'termine';
        case 'urgentes':
          return o.priorite === 'urgente' || o.priorite === 'haute';
        case 'en_cours':
          return !o.cloture && (o.statut === 'en_cours' || o.statut === 'attente_piece');
        case 'terminees':
          return o.cloture || o.statut === 'termine';
        default:
          return true;
      }
    });
  }, [ots, recherche, filtreType, filtreStatut, rapide, equipementParId]);

  const changerStatut = async (o: any, statut: string) => {
    try {
      const payload: Record<string, any> = { statut };
      if (statut === 'en_cours' && !o.date_debut) payload.date_debut = new Date().toISOString();
      if (statut === 'termine') payload.date_fin = new Date().toISOString();
      await gmaoService.updateOrdreTravail(o.id, payload);
      rafraichir();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const cloturer = async (o: any) => {
    try {
      await gmaoService.updateOrdreTravail(o.id, { statut: 'cloture', cloture: true, date_cloture: new Date().toISOString() });
      toast({ title: 'Intervention validée et clôturée' });
      rafraichir();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const lignesExport = () =>
    liste.map((o) => {
      const eq = equipementParId(o.equipement_id);
      return {
        'N°': o.numero || '—',
        Équipement: eq?.designation || '—',
        Immatriculation: eq?.immatriculation || eq?.code || '—',
        Type: libelle(TYPES_MAINTENANCE, o.type_maintenance),
        Priorité: o.priorite || '—',
        Date: fmtDate(o.date_planifiee || o.date_debut),
        'Durée (h)': Number(o.duree_immobilisation_heures || 0),
        'Coût (GNF)': Math.round(Number(o.cout_total || 0)),
        Statut: o.cloture ? 'Validée' : libelle(STATUTS_OT, o.statut),
      };
    });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="ot">
        <TabsList>
          <TabsTrigger value="ot">Ordres de travail</TabsTrigger>
          <TabsTrigger value="demandes">Déclarations de panne</TabsTrigger>
        </TabsList>

        <TabsContent value="ot" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Interventions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  À planifier → Planifiée → En cours → En attente pièce → Terminée → Validée
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => exporterExcel(lignesExport(), 'gmao-interventions', 'Interventions')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const l = lignesExport();
                    exporterPdf('Interventions de maintenance', Object.keys(l[0] || { 'N°': '' }), l.map((r) => Object.values(r) as any), 'gmao-interventions', `${liste.length} intervention(s)`);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button size="sm" onClick={() => { consommerEquipementCible(); setOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle intervention
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {RAPIDES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setRapide(f.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      rapide === f.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="N° intervention, immatriculation, mot-clé…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                </div>
                <Select value={filtreType} onValueChange={setFiltreType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les types</SelectItem>
                    {TYPES_MAINTENANCE.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    {STATUTS_OT.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="md:col-span-4">
                  <Button variant="ghost" size="sm" onClick={() => { setRecherche(''); setFiltreType('tous'); setFiltreStatut('tous'); setRapide('toutes'); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser les filtres
                  </Button>
                  <span className="ml-2 text-sm text-muted-foreground">{liste.length} résultat(s)</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Équipement</TableHead>
                      <TableHead>Immatriculation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargement && <TableRow><TableCell colSpan={10}>Chargement…</TableCell></TableRow>}
                    {!chargement && liste.length === 0 && (
                      <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Aucune intervention pour ces filtres.</TableCell></TableRow>
                    )}
                    {liste.map((o) => {
                      const eq = equipementParId(o.equipement_id);
                      return (
                        <TableRow key={o.id} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{o.numero || '—'}</TableCell>
                          <TableCell className="max-w-56 truncate text-sm">{o.titre}</TableCell>
                          <TableCell className="font-medium">{eq?.immatriculation || eq?.code || '—'}</TableCell>
                          <TableCell className="text-sm">{libelle(TYPES_MAINTENANCE, o.type_maintenance)}</TableCell>
                          <TableCell><BadgePriorite priorite={o.priorite} /></TableCell>
                          <TableCell className="text-sm">{fmtDate(o.date_planifiee || o.date_debut)}</TableCell>
                          <TableCell className="text-right tabular-nums">{Number(o.duree_immobilisation_heures || 0)} h</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{fmtMontant(o.cout_total)}</TableCell>
                          <TableCell><BadgeStatutOt statut={o.statut} cloture={o.cloture} /></TableCell>
                          <TableCell className="space-x-1 whitespace-nowrap text-right">
                            {!o.cloture && (o.statut === 'planifie' || o.statut === 'attente_piece') && (
                              <Button size="sm" variant="ghost" onClick={() => repasserEnDemande(o)}>
                                <Undo2 className="mr-1 h-4 w-4" /> Repasser en demande
                              </Button>
                            )}
                            {!o.cloture && o.statut === 'planifie' && (
                              <Button size="sm" variant="outline" onClick={() => changerStatut(o, 'en_cours')}>Démarrer</Button>
                            )}
                            {!o.cloture && (o.statut === 'en_cours' || o.statut === 'attente_piece') && (
                              <>
                                {o.statut === 'en_cours' && (
                                  <Button size="sm" variant="ghost" onClick={() => changerStatut(o, 'attente_piece')}>Attente pièce</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => changerStatut(o, 'termine')}>Terminer</Button>
                              </>
                            )}
                            {!o.cloture && o.statut === 'termine' && (
                              <Button size="sm" onClick={() => cloturer(o)}><CheckCircle className="mr-1 h-4 w-4" /> Valider</Button>
                            )}
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demandes" className="mt-4">
          <GmaoDemandes />
        </TabsContent>
      </Tabs>

      <GmaoInterventionForm open={open} onOpenChange={setOpen} />
    </div>
  );
};
