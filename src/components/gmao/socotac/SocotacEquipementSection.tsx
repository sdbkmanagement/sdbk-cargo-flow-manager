import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Paperclip, Plus, ShieldCheck } from 'lucide-react';
import { socotacService, SocotacControle } from '@/services/socotac';
import type { GmaoEquipement } from '@/services/gmao';
import { fmtDate } from '../gmaoUi';
import { SocotacForm } from './SocotacForm';
import { CLASSE_STATUT, LIBELLE_STATUT, joursRestants, normaliserImmat, statutDepuisJours } from './socotacUtils';

interface Props {
  equipement: GmaoEquipement;
}

export const SocotacEquipementSection: React.FC<Props> = ({ equipement }) => {
  const [controles, setControles] = useState<SocotacControle[]>([]);
  const [form, setForm] = useState(false);

  const charger = React.useCallback(async () => {
    const tous = await socotacService.getAll();
    const immat = normaliserImmat(equipement.immatriculation);
    setControles(
      tous
        .filter(
          (c) =>
            c.equipement_id === equipement.id ||
            c.equipement_remorque_id === equipement.id ||
            (immat && (normaliserImmat(c.immatriculation_tracteur) === immat || normaliserImmat(c.immatriculation_remorque) === immat))
        )
        .sort((a, b) => (a.date_controle < b.date_controle ? 1 : -1))
    );
  }, [equipement]);

  useEffect(() => { charger(); }, [charger]);

  const dernier = controles[0];
  const j = joursRestants(dernier?.date_prochain_controle);
  const statut = statutDepuisJours(j);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Contrôles réglementaires — SOCOTAC
        </h3>
        <Button size="sm" variant="outline" onClick={() => setForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau contrôle
        </Button>
      </div>

      {dernier ? (
        <Card className="border-border/60">
          <CardContent className="grid gap-3 p-4 text-sm md:grid-cols-3">
            <div><span className="text-muted-foreground">Dernier contrôle : </span>{fmtDate(dernier.date_controle)}</div>
            <div>
              <span className="text-muted-foreground">Résultat : </span>
              <Badge className={dernier.resultat === 'rejete' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}>
                {dernier.resultat === 'rejete' ? 'Rejeté' : 'Accepté'}
              </Badge>
            </div>
            <div><span className="text-muted-foreground">Prochaine échéance : </span>{fmtDate(dernier.date_prochain_controle)}</div>
            <div><span className="text-muted-foreground">Jours restants : </span>{j ?? '—'}</div>
            <div><span className="text-muted-foreground">Statut : </span><Badge className={CLASSE_STATUT[statut]}>{LIBELLE_STATUT[statut]}</Badge></div>
            <div><span className="text-muted-foreground">Motif de rejet : </span>{dernier.motif_rejet || '—'}</div>
            <div className="md:col-span-3">
              <span className="text-muted-foreground">Dernier certificat : </span>
              {dernier.documents?.length ? (
                <a href={dernier.documents[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />{dernier.documents[0].nom}
                </a>
              ) : '—'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun contrôle SOCOTAC enregistré pour cet équipement.</p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date contrôle</TableHead><TableHead>Prochaine échéance</TableHead>
            <TableHead>Résultat</TableHead><TableHead>Motif / observations</TableHead><TableHead>Document</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {!controles.length && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Aucun historique</TableCell></TableRow>}
            {controles.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{fmtDate(c.date_controle)}</TableCell>
                <TableCell>{fmtDate(c.date_prochain_controle)}</TableCell>
                <TableCell>{c.resultat === 'rejete' ? 'Rejeté' : 'Accepté'}</TableCell>
                <TableCell className="max-w-[240px] truncate">{c.motif_rejet || c.observations || '—'}</TableCell>
                <TableCell>
                  {c.documents?.length
                    ? <a href={c.documents[0].url} target="_blank" rel="noreferrer" className="text-primary hover:underline">PDF</a>
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SocotacForm
        open={form}
        onOpenChange={setForm}
        immatTracteurInitial={equipement.type_equipement === 'tracteur' ? equipement.immatriculation : ''}
        onSaved={charger}
      />
    </div>
  );
};
