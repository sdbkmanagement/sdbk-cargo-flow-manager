import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { processusSDBKService, type Associe, type AssocieInsert } from '@/services/processus-sdbk';
import { Users, Plus, Edit, BarChart3 } from 'lucide-react';

export const AssociesManagement = () => {
  const [associes, setAssocies] = useState<Associe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssocie, setEditingAssocie] = useState<Associe | null>(null);
  const [formData, setFormData] = useState<AssocieInsert>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    pourcentage_participation: 100,
    statut: 'actif'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAssocies();
  }, []);

  const loadAssocies = async () => {
    try {
      setLoading(true);
      const data = await processusSDBKService.getAssocies();
      setAssocies(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les associés',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingAssocie) {
        // TODO: Implement update
        toast({
          title: 'Information',
          description: 'Modification des associés à implémenter',
        });
      } else {
        await processusSDBKService.creerAssocie(formData);
        toast({
          title: 'Succès',
          description: 'Associé créé avec succès',
        });
      }
      
      setShowDialog(false);
      setEditingAssocie(null);
      resetForm();
      loadAssocies();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'associé',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      adresse: '',
      pourcentage_participation: 100,
      statut: 'actif'
    });
  };

  const openEditDialog = (associe: Associe) => {
    setEditingAssocie(associe);
    setFormData({
      nom: associe.nom,
      prenom: associe.prenom,
      telephone: associe.telephone || '',
      email: associe.email || '',
      adresse: associe.adresse || '',
      pourcentage_participation: associe.pourcentage_participation || 100,
      statut: associe.statut
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingAssocie(null);
    resetForm();
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Gestion des Associés</h2>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvel Associé
        </Button>
      </div>

      {/* Liste des associés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {associes.map((associe) => (
          <Card key={associe.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {associe.prenom} {associe.nom}
                </CardTitle>
                <Badge variant={associe.statut === 'actif' ? 'default' : 'secondary'}>
                  {associe.statut}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {associe.telephone && (
                  <p><span className="font-medium">Téléphone:</span> {associe.telephone}</p>
                )}
                {associe.email && (
                  <p><span className="font-medium">Email:</span> {associe.email}</p>
                )}
                <p>
                  <span className="font-medium">Participation:</span> {associe.pourcentage_participation}%
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(associe)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    // TODO: Voir CA de l'associé
                    toast({
                      title: 'Information',
                      description: 'Rapport CA à implémenter'
                    });
                  }}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  CA
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de création/modification */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAssocie ? 'Modifier l\'associé' : 'Nouvel associé'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                placeholder="+224 xxx xxx xxx"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="associe@example.com"
              />
            </div>

            <div>
              <Label htmlFor="pourcentage_participation">Pourcentage de participation (%)</Label>
              <Input
                id="pourcentage_participation"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.pourcentage_participation}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  pourcentage_participation: parseFloat(e.target.value) || 0 
                }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select 
                value={formData.statut} 
                onValueChange={(value: 'actif' | 'inactif') => 
                  setFormData(prev => ({ ...prev, statut: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                placeholder="Adresse complète..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};