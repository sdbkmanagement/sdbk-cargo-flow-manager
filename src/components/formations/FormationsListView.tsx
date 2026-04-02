import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';
import { FormationFormDialog } from './FormationFormDialog';
import { toast } from '@/hooks/use-toast';

const statutConfig = {
  valide: { label: 'Valide', className: 'bg-green-500 text-white' },
  a_renouveler: { label: 'À renouveler', className: 'bg-orange-500 text-white' },
  expire: { label: 'Expiré', className: 'bg-red-500 text-white' },
};

export const FormationsListView = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editFormation, setEditFormation] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations'],
    queryFn: formationsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: formationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast({ title: 'Formation supprimée' });
    },
  });

  const filtered = formations.filter(f => {
    const chauffeur = (f as any).chauffeurs;
    const theme = (f as any).themes_formation;
    const searchLower = search.toLowerCase();
    return (
      (chauffeur?.nom?.toLowerCase().includes(searchLower) || '') ||
      (chauffeur?.prenom?.toLowerCase().includes(searchLower) || '') ||
      (chauffeur?.matricule?.toLowerCase().includes(searchLower) || '') ||
      (theme?.nom?.toLowerCase().includes(searchLower) || '')
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Liste des formations</CardTitle>
          <Button onClick={() => { setEditFormation(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle formation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher par chauffeur ou thème..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Aucune formation trouvée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Chauffeur</th>
                  <th className="text-left p-3">Thème</th>
                  <th className="text-left p-3">Date formation</th>
                  <th className="text-left p-3">Date recyclage</th>
                  <th className="text-left p-3">Formateur</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const chauffeur = (f as any).chauffeurs;
                  const theme = (f as any).themes_formation;
                  const config = statutConfig[f.statut] || statutConfig.valide;
                  return (
                    <tr key={f.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{chauffeur?.prenom} {chauffeur?.nom}</p>
                          {chauffeur?.matricule && (
                            <p className="text-xs text-muted-foreground">{chauffeur.matricule}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {theme?.nom}
                        {theme?.obligatoire && (
                          <Badge variant="outline" className="ml-2 text-xs">Obligatoire</Badge>
                        )}
                      </td>
                      <td className="p-3">{new Date(f.date_formation).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">
                        {f.date_recyclage ? new Date(f.date_recyclage).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="p-3">{f.formateur_nom || '-'}</td>
                      <td className="p-3">
                        <Badge className={config.className}>{config.label}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditFormation(f); setShowForm(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(f.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <FormationFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        formation={editFormation}
      />
    </Card>
  );
};
