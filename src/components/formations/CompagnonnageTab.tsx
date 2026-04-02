import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Users, CheckCircle, AlertTriangle, XCircle, Save, Printer } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compagnonnageService, FicheCompagnonnage } from '@/services/compagnonnageService';
import { chauffeursService } from '@/services/chauffeurs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const DUREE_RECYCLAGE_MOIS = 12; // 1 an par défaut

const statutConfig = {
  valide: { label: 'Valide', icon: CheckCircle, className: 'bg-green-500 text-white' },
  a_renouveler: { label: 'À renouveler', icon: AlertTriangle, className: 'bg-orange-500 text-white' },
  expire: { label: 'Expiré', icon: XCircle, className: 'bg-red-500 text-white' },
  non_forme: { label: 'Non formé', icon: XCircle, className: 'bg-muted text-muted-foreground' },
};

function calculateEcheance(dateFormation: string): string {
  const d = new Date(dateFormation);
  d.setMonth(d.getMonth() + DUREE_RECYCLAGE_MOIS);
  return d.toISOString().slice(0, 10);
}

function calculateStatut(dateEcheance: string | null): 'valide' | 'a_renouveler' | 'expire' {
  if (!dateEcheance) return 'valide';
  const echeance = new Date(dateEcheance);
  const now = new Date();
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);
  if (echeance < now) return 'expire';
  if (echeance <= in30days) return 'a_renouveler';
  return 'valide';
}

interface ChauffeurRow {
  chauffeurId: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  statut: string | null;
  forme: boolean;
  dateFormation: string;
  dateEcheance: string;
  ficheId: string | null;
  formationStatut: 'valide' | 'a_renouveler' | 'expire' | 'non_forme';
  dirty: boolean;
}

export const CompagnonnageTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [localEdits, setLocalEdits] = useState<Record<string, { forme?: boolean; dateFormation?: string }>>({});

  const { data: fiches = [], isLoading: loadingFiches } = useQuery({
    queryKey: ['fiches-compagnonnage'],
    queryFn: compagnonnageService.getAll,
  });

  const { data: chauffeurs = [], isLoading: loadingChauffeurs } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: () => chauffeursService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: compagnonnageService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FicheCompagnonnage> }) =>
      compagnonnageService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: compagnonnageService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] }),
  });

  // Build rows: one per chauffeur, merged with latest fiche
  const rows: ChauffeurRow[] = useMemo(() => {
    // Get latest fiche per chauffeur
    const ficheMap = new Map<string, FicheCompagnonnage>();
    for (const f of fiches) {
      const existing = ficheMap.get(f.chauffeur_id);
      if (!existing || f.date_formation > existing.date_formation) {
        ficheMap.set(f.chauffeur_id, f);
      }
    }

    return chauffeurs.map(c => {
      const fiche = ficheMap.get(c.id);
      const edit = localEdits[c.id];

      const hasFiche = !!fiche;
      const forme = edit?.forme !== undefined ? edit.forme : hasFiche;
      const dateFormation = edit?.dateFormation !== undefined
        ? edit.dateFormation
        : (fiche?.date_formation || '');
      const dateEcheance = dateFormation ? calculateEcheance(dateFormation) : '';

      let formationStatut: ChauffeurRow['formationStatut'] = 'non_forme';
      if (forme && dateFormation) {
        formationStatut = calculateStatut(dateEcheance);
      }

      const isDirty = edit !== undefined;

      return {
        chauffeurId: c.id,
        matricule: c.matricule,
        nom: c.nom,
        prenom: c.prenom,
        statut: c.statut,
        forme,
        dateFormation,
        dateEcheance,
        ficheId: fiche?.id || null,
        formationStatut,
        dirty: isDirty,
      };
    });
  }, [chauffeurs, fiches, localEdits]);

  const filteredRows = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.nom?.toLowerCase().includes(s) ||
      r.prenom?.toLowerCase().includes(s) ||
      r.matricule?.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: rows.length,
    formes: rows.filter(r => r.formationStatut === 'valide').length,
    aRenouveler: rows.filter(r => r.formationStatut === 'a_renouveler').length,
    expires: rows.filter(r => r.formationStatut === 'expire').length,
    nonFormes: rows.filter(r => r.formationStatut === 'non_forme').length,
  };

  const handleCheckChange = (chauffeurId: string, checked: boolean) => {
    setLocalEdits(prev => ({
      ...prev,
      [chauffeurId]: { ...prev[chauffeurId], forme: checked, ...(checked ? {} : { dateFormation: '' }) },
    }));
  };

  const handleDateChange = (chauffeurId: string, date: string) => {
    setLocalEdits(prev => ({
      ...prev,
      [chauffeurId]: { ...prev[chauffeurId], dateFormation: date, forme: !!date },
    }));
  };

  const handleSaveAll = async () => {
    const dirtyRows = rows.filter(r => r.dirty);
    if (dirtyRows.length === 0) {
      toast.info('Aucune modification à sauvegarder');
      return;
    }

    let saved = 0;
    let errors = 0;

    for (const row of dirtyRows) {
      try {
        if (row.forme && row.dateFormation) {
          const payload = {
            chauffeur_id: row.chauffeurId,
            date_formation: row.dateFormation,
            date_echeance: row.dateEcheance || null,
            formateur_nom: null,
            theme: 'Compagnonnage',
            commentaire: null,
            statut: calculateStatut(row.dateEcheance) as 'valide' | 'a_renouveler' | 'expire',
          };

          if (row.ficheId) {
            await compagnonnageService.update(row.ficheId, payload);
          } else {
            await compagnonnageService.create(payload);
          }
          saved++;
        } else if (!row.forme && row.ficheId) {
          await compagnonnageService.delete(row.ficheId);
          saved++;
        }
      } catch {
        errors++;
      }
    }

    setLocalEdits({});
    queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] });
    if (errors > 0) toast.error(`${errors} erreur(s) lors de la sauvegarde`);
    else toast.success(`${saved} fiche(s) sauvegardée(s)`);
  };

  const handleExport = () => {
    const year = new Date().getFullYear();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fiche de Compagnonnage ${year}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; }
          .header { text-align: center; margin-bottom: 10px; }
          .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .header h2 { font-size: 12px; color: #333; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 3px 5px; text-align: left; }
          th { background: #1a365d; color: white; font-size: 9px; text-align: center; }
          td { font-size: 8px; }
          tr:nth-child(even) { background: #f0f4f8; }
          .num-col { width: 35px; text-align: center; }
          .mat-col { width: 80px; text-align: center; }
          .nom-col { width: 180px; }
          .date-col { width: 100px; text-align: center; }
          .statut-col { width: 90px; text-align: center; }
          .obs-col { width: 120px; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; }
          .footer div { width: 45%; }
          .footer .title { font-weight: bold; font-size: 10px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 30px; }
          .company-name { font-size: 11px; font-weight: bold; color: #1a365d; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">SDBK TRANSPORT</div>
          <h1>Planning de Compagnonnage ${year}</h1>
        </div>
        <table>
          <thead>
            <tr>
              <th class="num-col">N°</th>
              <th class="mat-col">Matricule</th>
              <th class="nom-col">Nom / Prénoms</th>
              <th class="date-col">Date réalisation</th>
              <th class="date-col">Date recyclage</th>
              <th class="statut-col">Statut</th>
              <th class="obs-col">Obs</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows.map((r, i) => `
              <tr>
                <td class="num-col">${String(i + 1).padStart(2, '0')}</td>
                <td class="mat-col">${r.matricule || ''}</td>
                <td class="nom-col">${r.nom} ${r.prenom}</td>
                <td class="date-col">${r.dateFormation ? new Date(r.dateFormation).toLocaleDateString('fr-FR') : ''}</td>
                <td class="date-col">${r.dateEcheance ? new Date(r.dateEcheance).toLocaleDateString('fr-FR') : ''}</td>
                <td class="statut-col">${statutConfig[r.formationStatut]?.label || ''}</td>
                <td class="obs-col"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>
            <div class="title">SERVICE FORMATION</div>
          </div>
          <div>
            <div class="title">LA SOCIETE</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const hasDirty = Object.keys(localEdits).length > 0;
  const isLoading = loadingFiches || loadingChauffeurs;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total chauffeurs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.formes}</p>
          <p className="text-sm text-muted-foreground">Valides</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.aRenouveler}</p>
          <p className="text-sm text-muted-foreground">À renouveler</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.expires}</p>
          <p className="text-sm text-muted-foreground">Expirées</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{stats.nonFormes}</p>
          <p className="text-sm text-muted-foreground">Non formés</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Fiches de Compagnonnage
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-48"
              />
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              {hasDirty && (
                <Button size="sm" onClick={handleSaveAll} disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-1" />
                  Sauvegarder
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun chauffeur trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Formé</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Date Formation</TableHead>
                    <TableHead>Date Recyclage</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(row => {
                    const config = statutConfig[row.formationStatut];
                    const Icon = config?.icon;
                    return (
                      <TableRow key={row.chauffeurId} className={row.dirty ? 'bg-accent/30' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={row.forme}
                            onCheckedChange={(checked) => handleCheckChange(row.chauffeurId, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.matricule || '-'}</TableCell>
                        <TableCell className="font-medium">{row.nom} {row.prenom}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.dateFormation}
                            onChange={e => handleDateChange(row.chauffeurId, e.target.value)}
                            className="w-40"
                            disabled={!row.forme}
                          />
                        </TableCell>
                        <TableCell>
                          {row.dateEcheance ? (
                            <span className="text-sm">{new Date(row.dateEcheance).toLocaleDateString('fr-FR')}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={config?.className}>
                            {Icon && <Icon className="w-3 h-3 mr-1" />}
                            {config?.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
