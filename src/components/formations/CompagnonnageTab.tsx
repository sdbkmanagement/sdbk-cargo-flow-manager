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
    const exportData = filteredRows.map(r => ({
      'Matricule': r.matricule || '',
      'Nom': r.nom,
      'Prénom': r.prenom,
      'Formé': r.forme ? 'Oui' : 'Non',
      'Date Formation': r.dateFormation ? new Date(r.dateFormation).toLocaleDateString('fr-FR') : '',
      'Date Recyclage': r.dateEcheance ? new Date(r.dateEcheance).toLocaleDateString('fr-FR') : '',
      'Statut': statutConfig[r.formationStatut]?.label || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compagnonnage');
    ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.writeFile(wb, `Compagnonnage_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Export téléchargé');
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
