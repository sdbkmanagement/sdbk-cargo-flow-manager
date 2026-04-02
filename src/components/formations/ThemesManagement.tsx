import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formationsService, ThemeFormation } from '@/services/formationsService';
import { toast } from '@/hooks/use-toast';

export const ThemesManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [editTheme, setEditTheme] = useState<ThemeFormation | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [duree, setDuree] = useState(12);
  const [obligatoire, setObligatoire] = useState(false);
  const queryClient = useQueryClient();

  const { data: themes = [] } = useQuery({
    queryKey: ['themes-formation'],
    queryFn: formationsService.getThemes,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => formationsService.createTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes-formation'] });
      setShowForm(false);
      toast({ title: 'Thème créé' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => formationsService.updateTheme(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes-formation'] });
      setShowForm(false);
      toast({ title: 'Thème mis à jour' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: formationsService.deleteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes-formation'] });
      toast({ title: 'Thème désactivé' });
    },
  });

  const openForm = (theme?: ThemeFormation) => {
    if (theme) {
      setEditTheme(theme);
      setNom(theme.nom);
      setDescription(theme.description || '');
      setDuree(theme.duree_validite);
      setObligatoire(theme.obligatoire);
    } else {
      setEditTheme(null);
      setNom('');
      setDescription('');
      setDuree(12);
      setObligatoire(false);
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nom, description: description || null, duree_validite: duree, obligatoire };
    if (editTheme) {
      updateMutation.mutate({ id: editTheme.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestion des thèmes de formation</CardTitle>
          <Button onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau thème
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {themes.map(theme => (
            <div key={theme.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{theme.nom}</p>
                  {theme.obligatoire && <Badge variant="destructive">Obligatoire</Badge>}
                </div>
                {theme.description && <p className="text-sm text-muted-foreground">{theme.description}</p>}
                <p className="text-xs text-muted-foreground">Validité : {theme.duree_validite} mois</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openForm(theme)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(theme.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTheme ? 'Modifier le thème' : 'Nouveau thème'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Durée de validité (mois)</Label>
              <Input type="number" value={duree} onChange={e => setDuree(parseInt(e.target.value))} min={1} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={obligatoire} onCheckedChange={setObligatoire} />
              <Label>Formation obligatoire</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
