import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Paperclip } from 'lucide-react';
import { controlesHistoriqueService, ControleHistorique, TypeControle } from '@/services/controlesHistorique';
import { useToast } from '@/hooks/use-toast';
import { fmtDate } from '../gmaoUi';

export type ControleCourant = {
  id: string;
  date_controle: string;
  date_prochain_controle?: string | null;
  resultat?: string | null;
  motif_rejet?: string | null;
  observations?: string | null;
  documents?: { nom: string; url: string }[] | null;
  immatriculation_tracteur?: string | null;
  immatriculation_remorque?: string | null;
  updated_by_nom?: string | null;
  created_by_nom?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: TypeControle;
  controle: ControleCourant | null;
}

export const ControleHistoriqueDialog: React.FC<Props> = ({ open, onOpenChange, type, controle }) => {
  const { toast } = useToast();
  const [lignes, setLignes] = useState<ControleHistorique[]>([]);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!open || !controle) return;
    let actif = true;
    setChargement(true);
    controlesHistoriqueService
      .getByControle(type, controle.id)
      .then((d) => { if (actif) setLignes(d); })
      .catch((e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }))
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [open, controle, type, toast]);

  const libelleResultat = (r?: string | null) => (r === 'rejete' ? 'Rejeté' : 'Accepté');
  const classeResultat = (r?: string | null) =>
    r === 'rejete' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Historique des contrôles — {controle?.immatriculation_tracteur || '—'}
            {controle?.immatriculation_remorque ? ` / ${controle.immatriculation_remorque}` : ''}
          </DialogTitle>
        </DialogHeader>

        {chargement ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date contrôle</TableHead>
                <TableHead>Prochaine échéance</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Motif / observations</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Saisi par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controle && (
                <TableRow className="bg-muted/40">
                  <TableCell className="font-medium">
                    {fmtDate(controle.date_controle)} <Badge variant="outline" className="ml-2">Actuel</Badge>
                  </TableCell>
                  <TableCell>{fmtDate(controle.date_prochain_controle)}</TableCell>
                  <TableCell><Badge className={classeResultat(controle.resultat)}>{libelleResultat(controle.resultat)}</Badge></TableCell>
                  <TableCell className="max-w-[220px] truncate">{controle.motif_rejet || controle.observations || '—'}</TableCell>
                  <TableCell>
                    {controle.documents?.length ? (
                      <a href={controle.documents[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Paperclip className="h-3.5 w-3.5" />PDF
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{controle.updated_by_nom || controle.created_by_nom || '—'}</TableCell>
                </TableRow>
              )}
              {!lignes.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    Aucun contrôle antérieur enregistré pour cet ensemble.
                  </TableCell>
                </TableRow>
              )}
              {lignes.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{fmtDate(l.date_controle)}</TableCell>
                  <TableCell>{fmtDate(l.date_prochain_controle)}</TableCell>
                  <TableCell><Badge className={classeResultat(l.resultat)}>{libelleResultat(l.resultat)}</Badge></TableCell>
                  <TableCell className="max-w-[220px] truncate">{l.motif_rejet || l.observations || '—'}</TableCell>
                  <TableCell>
                    {l.documents?.length ? (
                      <a href={l.documents[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Paperclip className="h-3.5 w-3.5" />PDF
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.enregistre_par || '—'}<br />{new Date(l.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
