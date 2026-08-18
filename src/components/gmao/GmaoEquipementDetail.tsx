import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { gmaoService, GmaoEquipement } from '@/services/gmao';
import { GmaoEquipementHistorique } from './GmaoEquipementHistorique';
import { GmaoPhotoUpload } from './GmaoPhotoUpload';
import { useToast } from '@/hooks/use-toast';

interface Props {
  equipement: GmaoEquipement | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

const fmtMontant = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} GNF`;

export const GmaoEquipementDetail: React.FC<Props> = ({ equipement, onOpenChange, onUpdated }) => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(equipement?.photo_url ?? null);
  }, [equipement]);

  const enregistrerPhoto = async (url: string | null) => {
    if (!equipement) return;
    setPhotoUrl(url);
    try {
      await gmaoService.updateEquipement(equipement.id, { photo_url: url });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!equipement) { setData(null); return; }
    let annule = false;
    setLoading(true);
    gmaoService
      .getHistoriqueEquipement(equipement.id)
      .then((d) => { if (!annule) setData(d); })
      .catch((e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }))
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [equipement, toast]);

  const prochaineEcheance: string | null =
    (data?.plans || [])
      .map((p: any) => p.prochaine_echeance)
      .filter(Boolean)
      .sort()[0] || null;

  return (
    <Dialog open={!!equipement} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {equipement && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 flex-wrap">
                <span>{equipement.immatriculation || equipement.code}</span>
                <BadgeTypeEquipement type={equipement.type_equipement} />
                <BadgeStatutEquipement statut={equipement.statut} />
                <Button size="sm" className="ml-auto" onClick={() => setNouvelle(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle intervention
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Interventions" valeur={stats?.interventions ?? data?.ots?.length ?? 0} icon={Wrench} />
              <KpiCard label="Coût cumulé" valeur={fmtMontant(stats?.coutTotal ?? data?.coutTotal ?? 0)} icon={Coins} ton="alerte" />
              <KpiCard label="Immobilisation" valeur={`${Math.round(stats?.immobilisationHeures || 0)} h`} icon={Timer} ton="info" />
              <KpiCard
                label="Prochaine maintenance"
                valeur={fmtDate(stats?.prochaineEcheance || prochaineEcheance)}
                icon={CalendarClock}
                ton="succes"
                detail={stats?.prochainKm ? `ou ${stats.prochainKm.toLocaleString('fr-FR')} km` : undefined}
              />
            </div>

            <GmaoInterventionForm
              open={nouvelle}
              onOpenChange={setNouvelle}
              equipementId={equipement.id}
              onSaved={() => { onUpdated?.(); }}
            />


            <Tabs defaultValue="carnet">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="carnet">Historique des interventions</TabsTrigger>
                <TabsTrigger value="infos">Informations</TabsTrigger>
                <TabsTrigger value="ot">Interventions</TabsTrigger>
                <TabsTrigger value="demandes">Pannes / demandes</TabsTrigger>
                <TabsTrigger value="pieces">Pièces remplacées</TabsTrigger>
                <TabsTrigger value="preventif">Échéances</TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="carnet" className="mt-4">
                <GmaoEquipementHistorique equipement={equipement} prochaineEcheance={prochaineEcheance} />
              </TabsContent>

              <TabsContent value="infos" className="mt-4 space-y-4">
                <GmaoPhotoUpload
                  value={photoUrl}
                  onChange={enregistrerPhoto}
                  reference={equipement.immatriculation || equipement.code}
                  id="gmao-photo-detail-equipement"
                />
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Code : </span>{equipement.code}</div>
                  <div><span className="text-muted-foreground">Immatriculation : </span>{equipement.immatriculation || '—'}</div>
                  <div><span className="text-muted-foreground">Désignation : </span>{equipement.designation}</div>
                  <div><span className="text-muted-foreground">Marque / modèle : </span>{[equipement.marque, equipement.modele].filter(Boolean).join(' ') || '—'}</div>
                  <div><span className="text-muted-foreground">N° châssis : </span>{equipement.numero_chassis || '—'}</div>
                  <div><span className="text-muted-foreground">Configuration : </span>{equipement.configuration || '—'}</div>
                  <div><span className="text-muted-foreground">Volume : </span>{equipement.volume_litres ? `${equipement.volume_litres} L` : '—'}</div>
                  <div><span className="text-muted-foreground">Mise en circulation : </span>{fmtDate(equipement.date_mise_circulation)}</div>
                  <div><span className="text-muted-foreground">Compteur km : </span>{equipement.compteur_km ?? 0}</div>
                  <div><span className="text-muted-foreground">Compteur heures : </span>{equipement.compteur_heures ?? 0}</div>
                  <div><span className="text-muted-foreground">Statut : </span>{equipement.statut}</div>
                  <div><span className="text-muted-foreground">Criticité : </span>{equipement.criticite}</div>
                </div>
                <Card className="mt-4">
                  <CardContent className="p-4 flex flex-wrap gap-6 text-sm">
                    <div><div className="text-muted-foreground">Interventions</div><div className="text-xl font-semibold">{data?.ots?.length ?? 0}</div></div>
                    <div><div className="text-muted-foreground">Coût cumulé</div><div className="text-xl font-semibold">{fmtMontant(data?.coutTotal || 0)}</div></div>
                    <div><div className="text-muted-foreground">Pièces remplacées</div><div className="text-xl font-semibold">{data?.pieces?.length ?? 0}</div></div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ot" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead>Coût</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loading && <TableRow><TableCell colSpan={6}>Chargement…</TableCell></TableRow>}
                    {!loading && !data?.ots?.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">Aucune intervention</TableCell></TableRow>}
                    {data?.ots?.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.numero}</TableCell>
                        <TableCell>{o.titre}</TableCell>
                        <TableCell>{o.type_maintenance}</TableCell>
                        <TableCell>{o.statut}</TableCell>
                        <TableCell>{fmtDate(o.date_planifiee || o.date_debut)}</TableCell>
                        <TableCell>{fmtMontant(o.cout_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="demandes" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!data?.demandes?.length && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Aucune demande</TableCell></TableRow>}
                    {data?.demandes?.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.numero}</TableCell>
                        <TableCell>{d.titre}</TableCell>
                        <TableCell>{d.priorite}</TableCell>
                        <TableCell>{d.statut}</TableCell>
                        <TableCell>{fmtDate(d.date_demande)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="pieces" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Référence</TableHead><TableHead>Désignation</TableHead>
                    <TableHead>Quantité</TableHead><TableHead>Montant</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!data?.pieces?.length && <TableRow><TableCell colSpan={4} className="text-muted-foreground">Aucune pièce consommée</TableCell></TableRow>}
                    {data?.pieces?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.gmao_pieces?.reference || '—'}</TableCell>
                        <TableCell>{p.gmao_pieces?.designation || '—'}</TableCell>
                        <TableCell>{p.quantite}</TableCell>
                        <TableCell>{fmtMontant(p.montant)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="preventif" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Plan</TableHead><TableHead>Déclencheur</TableHead>
                    <TableHead>Prochaine échéance</TableHead><TableHead>Prochain km</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!data?.plans?.length && <TableRow><TableCell colSpan={4} className="text-muted-foreground">Aucun plan préventif</TableCell></TableRow>}
                    {data?.plans?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.libelle}</TableCell>
                        <TableCell>{p.type_declencheur}</TableCell>
                        <TableCell>{fmtDate(p.prochaine_echeance)}</TableCell>
                        <TableCell>{p.prochain_km ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="historique" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Événement</TableHead><TableHead>Description</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!data?.historique?.length && <TableRow><TableCell colSpan={3} className="text-muted-foreground">Aucun historique</TableCell></TableRow>}
                    {data?.historique?.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell>{fmtDate(h.created_at)}</TableCell>
                        <TableCell>{h.type_evenement}</TableCell>
                        <TableCell>{h.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
