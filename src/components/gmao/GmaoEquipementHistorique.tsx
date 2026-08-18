import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { FileDown, BookOpen, RotateCcw, ChevronDown, Paperclip } from 'lucide-react';
import {
  getInterventionsEquipement,
  filtrerInterventions,
  synthese,
  InterventionHistorique,
} from '@/services/gmaoHistorique';
import { exporterHistoriquePdf } from '@/utils/gmaoHistoriquePdf';
import { GmaoEquipement } from '@/services/gmao';

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};
const fmtMontant = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} GNF`;
const labelType = (t: string) => (t === 'preventif' ? 'Préventive' : t === 'correctif' ? 'Corrective' : t);

interface Props {
  equipement: GmaoEquipement;
  prochaineEcheance?: string | null;
}

export const GmaoEquipementHistorique: React.FC<Props> = ({ equipement, prochaineEcheance }) => {
  const { toast } = useToast();
  const [liste, setListe] = useState<InterventionHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [type, setType] = useState('tous');
  const [statut, setStatut] = useState('tous');
  const [technicien, setTechnicien] = useState('tous');
  const [fournisseur, setFournisseur] = useState('tous');
  const [nature, setNature] = useState('');

  useEffect(() => {
    let annule = false;
    setLoading(true);
    getInterventionsEquipement(equipement.id)
      .then((d) => { if (!annule) setListe(d); })
      .catch((e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }))
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [equipement.id, toast]);

  const filtrees = useMemo(
    () => filtrerInterventions(liste, { dateDebut, dateFin, type, statut, technicien, fournisseur, nature }),
    [liste, dateDebut, dateFin, type, statut, technicien, fournisseur, nature]
  );
  const s = useMemo(() => synthese(filtrees), [filtrees]);

  const techniciens = useMemo(
    () => Array.from(new Set(liste.flatMap((i) => i.techniciens))).sort(),
    [liste]
  );
  const fournisseurs = useMemo(
    () => Array.from(new Set(liste.map((i) => i.fournisseur).filter(Boolean) as string[])).sort(),
    [liste]
  );
  const statuts = useMemo(() => Array.from(new Set(liste.map((i) => i.statut))).sort(), [liste]);

  const entete = {
    immatriculation: equipement.immatriculation || equipement.code,
    type: equipement.type_equipement === 'tracteur' ? 'Tracteur' : equipement.type_equipement === 'remorque' ? 'Remorque' : 'Autre',
    designation: equipement.designation,
    marque: [equipement.marque, equipement.modele].filter(Boolean).join(' '),
    compteurKm: equipement.compteur_km,
    miseCirculation: equipement.date_mise_circulation,
    prochaineEcheance,
  };

  const exporter = async (complet: boolean) => {
    const donnees = complet ? liste : filtrees;
    if (!donnees.length) {
      toast({ title: 'Aucune intervention', description: 'Rien à exporter pour cette sélection', variant: 'destructive' });
      return;
    }
    try {
      await exporterHistoriquePdf(entete, donnees, { debut: dateDebut, fin: dateFin }, complet);
    } catch (e: any) {
      toast({ title: 'Erreur export', description: e.message, variant: 'destructive' });
    }
  };

  const reinitialiser = () => {
    setDateDebut(''); setDateFin(''); setType('tous'); setStatut('tous');
    setTechnicien('tous'); setFournisseur('tous'); setNature('');
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div><Label className="text-xs">Date de début</Label><Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></div>
          <div><Label className="text-xs">Date de fin</Label><Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} /></div>
          <div>
            <Label className="text-xs">Type de maintenance</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="preventif">Préventive</SelectItem>
                <SelectItem value="correctif">Corrective</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Statut</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {statuts.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Technicien</Label>
            <Select value={technicien} onValueChange={setTechnicien}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {techniciens.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prestataire</Label>
            <Select value={fournisseur} onValueChange={setFournisseur}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {fournisseurs.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Nature de l'intervention</Label><Input value={nature} onChange={(e) => setNature(e.target.value)} placeholder="Rechercher…" /></div>
          <div className="flex items-end gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={reinitialiser}><RotateCcw className="w-4 h-4 mr-1" /> Réinitialiser</Button>
            <Button size="sm" onClick={() => exporter(false)}><FileDown className="w-4 h-4 mr-1" /> Exporter PDF</Button>
            <Button size="sm" variant="secondary" onClick={() => exporter(true)}><BookOpen className="w-4 h-4 mr-1" /> Rapport complet</Button>
          </div>
        </CardContent>
      </Card>

      {/* Synthèse */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: 'Interventions', v: String(s.total) },
          { l: 'Préventives', v: String(s.preventif) },
          { l: 'Correctives', v: String(s.correctif) },
          { l: 'Coût pièces', v: fmtMontant(s.coutPieces) },
          { l: 'Coût main-d’œuvre', v: fmtMontant(s.coutMO) },
          { l: 'Coût total maintenance', v: fmtMontant(s.coutTotal) },
          { l: 'Immobilisation', v: `${s.immobilisation} h (${(s.immobilisation / 24).toFixed(1)} j)` },
          { l: 'Dernière intervention', v: fmtDate(s.derniere) },
          { l: 'Prochaine maintenance', v: fmtDate(prochaineEcheance) },
        ].map((k) => (
          <Card key={k.l}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">{k.l}</div>
              <div className="text-lg font-semibold">{k.v}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historique */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-8" />
            <TableHead>Date</TableHead><TableHead>N°</TableHead><TableHead>Type</TableHead>
            <TableHead>Intervention</TableHead><TableHead>Pièces</TableHead>
            <TableHead>Coût total</TableHead><TableHead>Immob.</TableHead>
            <TableHead>Responsable</TableHead><TableHead>Statut</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={10}>Chargement…</TableCell></TableRow>}
            {!loading && !filtrees.length && (
              <TableRow><TableCell colSpan={10} className="text-muted-foreground">Aucune intervention sur la période sélectionnée</TableCell></TableRow>
            )}
            {filtrees.map((i) => (
              <Collapsible key={i.id} asChild>
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronDown className="w-4 h-4" /></Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>{fmtDate(i.date_intervention)}</TableCell>
                    <TableCell className="font-medium">{i.numero || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={i.type_maintenance === 'preventif' ? 'secondary' : 'default'}>{labelType(i.type_maintenance)}</Badge>
                    </TableCell>
                    <TableCell>{i.titre}</TableCell>
                    <TableCell>{i.pieces.length || '—'}</TableCell>
                    <TableCell>{fmtMontant(i.cout_total)}</TableCell>
                    <TableCell>{i.duree_immobilisation_heures} h</TableCell>
                    <TableCell>{i.techniciens.join(', ') || i.fournisseur || '—'}</TableCell>
                    <TableCell>{i.statut}</TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={10} className="bg-muted/40">
                        <div className="grid gap-2 md:grid-cols-2 text-sm py-2">
                          <div><span className="text-muted-foreground">Panne / anomalie : </span>{i.panne || '—'}</div>
                          <div><span className="text-muted-foreground">Nature : </span>{i.titre}</div>
                          <div className="md:col-span-2"><span className="text-muted-foreground">Travaux réalisés : </span>{i.travaux_realises || i.description || '—'}</div>
                          <div><span className="text-muted-foreground">Coût pièces : </span>{fmtMontant(i.cout_pieces)}</div>
                          <div><span className="text-muted-foreground">Coût main-d’œuvre : </span>{fmtMontant(i.cout_main_oeuvre)}</div>
                          <div><span className="text-muted-foreground">Prestation : </span>{fmtMontant(i.cout_prestation)}</div>
                          <div><span className="text-muted-foreground">Prestataire : </span>{i.fournisseur || '—'}</div>
                          <div><span className="text-muted-foreground">Début / fin : </span>{fmtDate(i.date_debut)} → {fmtDate(i.date_fin)}</div>
                          <div><span className="text-muted-foreground">Compteur à l'intervention : </span>{equipement.compteur_km ?? 0} km</div>
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Pièces remplacées : </span>
                            {i.pieces.length
                              ? i.pieces.map((p) => `${p.reference} — ${p.designation} (x${p.quantite}, ${fmtMontant(p.montant)})`).join(' · ')
                              : '—'}
                          </div>
                          <div className="md:col-span-2 flex flex-wrap gap-3">
                            {i.documents.length ? i.documents.map((d) => (
                              <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                                <Paperclip className="w-3 h-3" /> {d.nom}
                              </a>
                            )) : <span className="text-muted-foreground">Aucun document associé</span>}
                          </div>
                          <div className="md:col-span-2 text-xs text-muted-foreground">
                            Créée le {fmtDate(i.created_at)} · Dernière modification le {fmtDate(i.updated_at)}
                            {i.cloture_par ? ` · Clôturée par ${i.cloture_par}` : ''}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
