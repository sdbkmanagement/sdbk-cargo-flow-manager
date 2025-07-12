import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { tarifsHydrocarburesService, TarifHydrocarbure } from "@/services/tarifsHydrocarburesService";

export const TarifsHydrocarburesManagement = () => {
  const [tarifs, setTarifs] = useState<TarifHydrocarbure[]>([]);
  const [lieuxDepart, setLieuxDepart] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTarif, setEditingTarif] = useState<TarifHydrocarbure | null>(null);
  const [selectedLieuFilter, setSelectedLieuFilter] = useState<string>('');
  const [searchDestination, setSearchDestination] = useState('');

  const [formData, setFormData] = useState({
    numero_ordre: '',
    lieu_depart: '',
    destination: '',
    tarif_au_litre: '',
    observations: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tarifsData, lieuxData] = await Promise.all([
        tarifsHydrocarburesService.getTarifs(),
        tarifsHydrocarburesService.getLieuxDepart()
      ]);
      
      setTarifs(tarifsData);
      setLieuxDepart(lieuxData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lieu_depart || !formData.destination || !formData.tarif_au_litre) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const tarifData = {
      numero_ordre: parseInt(formData.numero_ordre) || 1,
      lieu_depart: formData.lieu_depart,
      destination: formData.destination,
      tarif_au_litre: parseFloat(formData.tarif_au_litre),
      observations: formData.observations || undefined
    };

    let success = false;
    if (editingTarif) {
      success = await tarifsHydrocarburesService.updateTarif(editingTarif.id, tarifData);
    } else {
      success = await tarifsHydrocarburesService.createTarif(tarifData);
    }

    if (success) {
      await loadData();
      resetForm();
      setShowDialog(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      const success = await tarifsHydrocarburesService.deleteTarif(id);
      if (success) {
        await loadData();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numero_ordre: '',
      lieu_depart: '',
      destination: '',
      tarif_au_litre: '',
      observations: ''
    });
    setEditingTarif(null);
  };

  const openEditDialog = (tarif: TarifHydrocarbure) => {
    setFormData({
      numero_ordre: tarif.numero_ordre.toString(),
      lieu_depart: tarif.lieu_depart,
      destination: tarif.destination,
      tarif_au_litre: tarif.tarif_au_litre.toString(),
      observations: tarif.observations || ''
    });
    setEditingTarif(tarif);
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  // Filtrer les tarifs
  const filteredTarifs = tarifs.filter(tarif => {
    const matchLieu = !selectedLieuFilter || tarif.lieu_depart === selectedLieuFilter;
    const matchDestination = !searchDestination || 
      tarif.destination.toLowerCase().includes(searchDestination.toLowerCase());
    return matchLieu && matchDestination;
  });

  // Grouper par lieu de départ
  const groupedTarifs = filteredTarifs.reduce((acc, tarif) => {
    if (!acc[tarif.lieu_depart]) {
      acc[tarif.lieu_depart] = [];
    }
    acc[tarif.lieu_depart].push(tarif);
    return acc;
  }, {} as Record<string, TarifHydrocarbure[]>);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Tarifs Hydrocarbures</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Tarif
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lieu-filter">Lieu de départ</Label>
              <Select value={selectedLieuFilter} onValueChange={setSelectedLieuFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les lieux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les lieux</SelectItem>
                  {lieuxDepart.map(lieu => (
                    <SelectItem key={lieu} value={lieu}>{lieu}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="destination-search">Rechercher une destination</Label>
              <Input
                id="destination-search"
                placeholder="Nom de la destination..."
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tarifs.length}</div>
            <p className="text-xs text-muted-foreground">Total tarifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lieuxDepart.length}</div>
            <p className="text-xs text-muted-foreground">Lieux de départ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredTarifs.length}</div>
            <p className="text-xs text-muted-foreground">Tarifs affichés</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des tarifs groupés */}
      <div className="space-y-6">
        {Object.entries(groupedTarifs).map(([lieuDepart, tarifsLieu]) => (
          <Card key={lieuDepart}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">{lieuDepart}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({tarifsLieu.length} destinations)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Ordre</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Tarif (GNF/L)</TableHead>
                    <TableHead>Observations</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarifsLieu.map((tarif) => (
                    <TableRow key={tarif.id}>
                      <TableCell>{tarif.numero_ordre}</TableCell>
                      <TableCell className="font-medium">{tarif.destination}</TableCell>
                      <TableCell className="font-mono">
                        {tarif.tarif_au_litre.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} GNF
                      </TableCell>
                      <TableCell>{tarif.observations || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(tarif)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tarif.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de création/modification */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTarif ? 'Modifier le tarif' : 'Nouveau tarif hydrocarbure'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="numero_ordre">Numéro d'ordre</Label>
              <Input
                id="numero_ordre"
                type="number"
                value={formData.numero_ordre}
                onChange={(e) => setFormData({...formData, numero_ordre: e.target.value})}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="lieu_depart">Lieu de départ *</Label>
              <Select value={formData.lieu_depart} onValueChange={(value) => setFormData({...formData, lieu_depart: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conakry">Conakry</SelectItem>
                  <SelectItem value="Kankan">Kankan</SelectItem>
                  <SelectItem value="N'Zerekore">N'Zerekore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                placeholder="Nom de la destination"
                required
              />
            </div>
            <div>
              <Label htmlFor="tarif_au_litre">Tarif au litre (GNF) *</Label>
              <Input
                id="tarif_au_litre"
                type="number"
                step="0.01"
                value={formData.tarif_au_litre}
                onChange={(e) => setFormData({...formData, tarif_au_litre: e.target.value})}
                placeholder="90.23"
                required
              />
            </div>
            <div>
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                placeholder="Observations optionnelles..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingTarif ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};