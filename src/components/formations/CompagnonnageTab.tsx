import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, Trash2, Edit, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compagnonnageService, FicheCompagnonnage } from '@/services/compagnonnageService';
import { chauffeursService } from '@/services/chauffeurs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const statutConfig = {
  valide: { label: 'Valide', icon: CheckCircle, className: 'bg-green-500 text-white' },
  a_renouveler: { label: 'À renouveler', icon: AlertTriangle, className: 'bg-orange-500 text-white' },
  expire: { label: 'Expiré', icon: XCircle, className: 'bg-red-500 text-white' },
};

export const CompagnonnageTab = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFiche, setEditingFiche] = useState<FicheCompagnonnage | null>(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    chauffeur_id: '',
    date_formation: '',
    date_echeance: '',
    formateur_nom: '',
    theme: 'Compagnonnage',
    commentaire: '',
  });

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches-compagnonnage'],
    queryFn: compagnonnageService.getAll,
  });

  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: () => chauffeursService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: compagnonnageService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] });
      toast.success('Fiche de compagnonnage ajoutée');
      resetForm();
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FicheCompagnonnage> }) =>
      compagnonnageService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] });
      toast.success('Fiche mise à jour');
      resetForm();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: compagnonnageService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-compagnonnage'] });
      toast.success('Fiche supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const resetForm = () => {
    setFormData({ chauffeur_id: '', date_formation: '', date_echeance: '', formateur_nom: '', theme: 'Compagnonnage', commentaire: '' });
    setEditingFiche(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!formData.chauffeur_id || !formData.date_formation) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    if (editingFiche) {
      updateMutation.mutate({ id: editingFiche.id, data: formData as any });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleEdit = (fiche: FicheCompagnonnage) => {
    setEditingFiche(fiche);
    setFormData({
      chauffeur_id: fiche.chauffeur_id,
      date_formation: fiche.date_formation,
      date_echeance: fiche.date_echeance || '',
      formateur_nom: fiche.formateur_nom || '',
      theme: fiche.theme || 'Compagnonnage',
      commentaire: fiche.commentaire || '',
    });
    setShowForm(true);
  };

  const handleExport = () => {
    const exportData = filteredFiches.map(f => ({
      'Matricule': f.chauffeurs?.matricule || '',
      'Nom': f.chauffeurs?.nom || '',
      'Prénom': f.chauffeurs?.prenom || '',
      'Thème': f.theme,
      'Date Formation': f.date_formation ? new Date(f.date_formation).toLocaleDateString('fr-FR') : '',
      'Date Échéance': f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '',
      'Formateur': f.formateur_nom || '',
      'Statut': statutConfig[f.statut as keyof typeof statutConfig]?.label || f.statut,
      'Commentaire': f.commentaire || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compagnonnage');
    ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    XLSX.writeFile(wb, `Fiches_Compagnonnage_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Export téléchargé');
  };

  const filteredFiches = fiches.filter(f => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      f.chauffeurs?.nom?.toLowerCase().includes(s) ||
      f.chauffeurs?.prenom?.toLowerCase().includes(s) ||
      f.chauffeurs?.matricule?.toLowerCase().includes(s) ||
      f.formateur_nom?.toLowerCase().includes(s) ||
      f.theme?.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: fiches.length,
    valides: fiches.filter(f => f.statut === 'valide').length,
    aRenouveler: fiches.filter(f => f.statut === 'a_renouveler').length,
    expires: fiches.filter(f => f.statut === 'expire').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total fiches</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.valides}</p>
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
      </div>

      {/* Header */}
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
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredFiches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune fiche de compagnonnage</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Thème</TableHead>
                    <TableHead>Date Formation</TableHead>
                    <TableHead>Date Échéance</TableHead>
                    <TableHead>Formateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiches.map(fiche => {
                    const config = statutConfig[fiche.statut as keyof typeof statutConfig];
                    const Icon = config?.icon;
                    return (
                      <TableRow key={fiche.id}>
                        <TableCell className="font-mono text-sm">{fiche.chauffeurs?.matricule || '-'}</TableCell>
                        <TableCell className="font-medium">{fiche.chauffeurs?.nom} {fiche.chauffeurs?.prenom}</TableCell>
                        <TableCell>{fiche.theme}</TableCell>
                        <TableCell>{new Date(fiche.date_formation).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{fiche.date_echeance ? new Date(fiche.date_echeance).toLocaleDateString('fr-FR') : '-'}</TableCell>
                        <TableCell>{fiche.formateur_nom || '-'}</TableCell>
                        <TableCell>
                          <Badge className={config?.className}>
                            {Icon && <Icon className="w-3 h-3 mr-1" />}
                            {config?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(fiche)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(fiche.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); else setShowForm(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFiche ? 'Modifier' : 'Nouvelle'} Fiche de Compagnonnage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chauffeur *</Label>
              <Select value={formData.chauffeur_id} onValueChange={v => setFormData(p => ({ ...p, chauffeur_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un chauffeur" /></SelectTrigger>
                <SelectContent>
                  {chauffeurs.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.matricule ? `[${c.matricule}] ` : ''}{c.nom} {c.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thème</Label>
              <Input value={formData.theme} onChange={e => setFormData(p => ({ ...p, theme: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de formation *</Label>
                <Input type="date" value={formData.date_formation} onChange={e => setFormData(p => ({ ...p, date_formation: e.target.value }))} />
              </div>
              <div>
                <Label>Date d'échéance</Label>
                <Input type="date" value={formData.date_echeance} onChange={e => setFormData(p => ({ ...p, date_echeance: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Formateur</Label>
              <Input value={formData.formateur_nom} onChange={e => setFormData(p => ({ ...p, formateur_nom: e.target.value }))} />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea value={formData.commentaire} onChange={e => setFormData(p => ({ ...p, commentaire: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingFiche ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
