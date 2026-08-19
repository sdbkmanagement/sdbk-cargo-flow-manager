import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload } from 'lucide-react';
import { controlesAnnuelsService } from '@/services/controlesAnnuels';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGmao } from '../GmaoContext';
import { normaliserImmat } from '../socotac/socotacUtils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImported?: () => void;
}

type Ligne = {
  immatriculation_tracteur: string;
  immatriculation_remorque: string;
  conducteur_nom: string;
  conducteur_contact: string;
  date_controle: string;
  observations: string;
  resultat: 'accepte' | 'rejete';
};

const versDate = (v: any): string | null => {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30));
    d.setUTCDate(d.getUTCDate() + Math.round(v));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const fr = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const contient = (v: any, mot: string) => String(v ?? '').toLowerCase().includes(mot);

export const ControleAnnuelImport: React.FC<Props> = ({ open, onOpenChange, onImported }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipements } = useGmao();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chargement, setChargement] = useState(false);

  const analyser = async (file?: File) => {
    if (!file) return;
    setChargement(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames.find((n) => n.toLowerCase().includes('annuel')) || wb.SheetNames[0]];
      const grille: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null });

      const idxEntete = grille.findIndex((r) => r?.some((c) => contient(c, 'immatriculation tracteur')));
      if (idxEntete < 0) throw new Error("Colonne « Immatriculation Tracteur » introuvable dans le fichier.");
      const entete = grille[idxEntete];
      const col = (mot: string) => entete.findIndex((c) => contient(c, mot));

      const cTr = col('immatriculation tracteur');
      const cRm = col('immatriculation remorque');
      const cCond = col('opérateur') >= 0 ? col('opérateur') : col('conducteur');
      const cTel = col('contact');
      const cDate = col('date de contrôle');
      const cObs = col('observation');
      const cRej = col('repecher') >= 0 ? col('repecher') : col('rejeter');

      const out: Ligne[] = [];
      for (let i = idxEntete + 1; i < grille.length; i++) {
        const r = grille[i] || [];
        const tr = normaliserImmat(r[cTr]);
        const date = versDate(r[cDate]);
        if (!tr || !date) continue;
        const rejete = cRej >= 0 && !!String(r[cRej] ?? '').trim();
        out.push({
          immatriculation_tracteur: tr,
          immatriculation_remorque: cRm >= 0 ? normaliserImmat(r[cRm]) : '',
          conducteur_nom: cCond >= 0 ? String(r[cCond] ?? '').trim() : '',
          conducteur_contact: cTel >= 0 ? String(r[cTel] ?? '').trim() : '',
          date_controle: date,
          observations: cObs >= 0 ? String(r[cObs] ?? '').trim() : '',
          resultat: rejete ? 'rejete' : 'accepte',
        });
      }
      if (!out.length) throw new Error('Aucune ligne exploitable détectée.');
      setLignes(out);
      toast({ title: `${out.length} contrôle(s) annuel(s) détecté(s)`, description: 'Vérifiez puis lancez l’importation.' });
    } catch (e: any) {
      toast({ title: 'Fichier illisible', description: e.message, variant: 'destructive' });
    } finally {
      setChargement(false);
    }
  };

  const importer = async () => {
    setChargement(true);
    try {
      const nom = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : null;
      const payload = lignes.map((l) => ({
        immatriculation_tracteur: l.immatriculation_tracteur,
        immatriculation_remorque: l.immatriculation_remorque || null,
        equipement_id: equipements.find((e) => normaliserImmat(e.immatriculation) === l.immatriculation_tracteur)?.id || null,
        equipement_remorque_id: l.immatriculation_remorque
          ? equipements.find((e) => normaliserImmat(e.immatriculation) === l.immatriculation_remorque)?.id || null
          : null,
        conducteur_nom: l.conducteur_nom || null,
        conducteur_contact: l.conducteur_contact || null,
        date_controle: l.date_controle,
        resultat: l.resultat,
        observations: l.observations || null,
        created_by: user?.id || null,
        created_by_nom: nom,
      }));
      const n = await controlesAnnuelsService.createMany(payload);
      toast({ title: 'Importation terminée', description: `${n} contrôle(s) annuel(s) importé(s). Échéances à +12 mois calculées.` });
      setLignes([]);
      onImported?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erreur d’importation', description: e.message, variant: 'destructive' });
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer le fichier Contrôle annuel</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Les colonnes Immatriculation tracteur/remorque, opérateur, contacts, date de contrôle technique et observation sont reprises.
          La prochaine échéance est recalculée automatiquement à +12 mois.
        </p>

        <Input type="file" accept=".xlsx,.xls" onChange={(e) => analyser(e.target.files?.[0])} disabled={chargement} />

        {lignes.length > 0 && (
          <div className="max-h-80 overflow-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead><TableHead>Opérateur</TableHead>
                  <TableHead>Date contrôle</TableHead><TableHead>Résultat</TableHead><TableHead>Observation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{l.immatriculation_tracteur}</TableCell>
                    <TableCell>{l.immatriculation_remorque || '—'}</TableCell>
                    <TableCell>{l.conducteur_nom || '—'}</TableCell>
                    <TableCell>{new Date(`${l.date_controle}T00:00:00`).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{l.resultat === 'rejete' ? 'Rejeté' : 'Accepté'}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{l.observations || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={importer} disabled={!lignes.length || chargement}>
            {chargement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importer {lignes.length ? `(${lignes.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
