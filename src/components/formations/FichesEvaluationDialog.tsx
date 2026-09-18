import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fichesEvaluationService } from '@/services/fichesEvaluation';
import { toast } from '@/hooks/use-toast';
import { Upload, ExternalLink, Trash2, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chauffeur: any;
  defaultType?: 'theorique' | 'pratique';
}

export const FichesEvaluationDialog = ({ open, onOpenChange, chauffeur, defaultType = 'theorique' }: Props) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'theorique' | 'pratique'>(defaultType);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [formateur, setFormateur] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [file, setFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (open) setType(defaultType);
  }, [open, defaultType]);

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches-evaluation', chauffeur?.id],
    queryFn: () => fichesEvaluationService.getByChauffeur(chauffeur.id),
    enabled: open && !!chauffeur?.id,
  });

  const resetForm = () => {
    setNote(''); setFormateur(''); setCommentaire(''); setFile(null);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Veuillez sélectionner un fichier à charger');
      const { url, nom } = await fichesEvaluationService.uploadFichier(file);
      await fichesEvaluationService.create({
        chauffeur_id: chauffeur.id,
        type_fiche: type,
        date_fiche: date,
        note_obtenue: note === '' ? null : parseFloat(note),
        formateur_nom: formateur || null,
        commentaire: commentaire || null,
        fichier_nom: nom,
        fichier_url: url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-evaluation', chauffeur?.id] });
      toast({ title: 'Fiche archivée' });
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fichesEvaluationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-evaluation', chauffeur?.id] });
      toast({ title: 'Fiche supprimée' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  if (!chauffeur) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Fiches d'évaluation — {chauffeur.prenom} {chauffeur.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="space-y-4 border rounded-lg p-4">
            <p className="font-medium text-sm">Charger une fiche signée</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de fiche</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="theorique">Théorique</SelectItem>
                    <SelectItem value="pratique">Pratique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Note obtenue (%)</Label>
                <Input type="number" min="0" max="100" value={note} onChange={e => setNote(e.target.value)} placeholder="Optionnel" />
              </div>
              <div>
                <Label>Formateur</Label>
                <Input value={formateur} onChange={e => setFormateur(e.target.value)} placeholder="Optionnel" />
              </div>
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} placeholder="Optionnel" />
            </div>
            <div>
              <Label>Fichier (PDF, image...)</Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending || !file}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {archiveMutation.isPending ? 'Archivage...' : 'Archiver la fiche'}
            </Button>
          </div>

          <div>
            <p className="font-medium text-sm mb-2">Fiches archivées</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : fiches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune fiche archivée pour ce chauffeur.</p>
            ) : (
              <div className="space-y-2">
                {fiches.map(f => (
                  <div key={f.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{f.type_fiche}</Badge>
                          <span className="text-sm">{new Date(f.date_fiche).toLocaleDateString('fr-FR')}</span>
                          {f.note_obtenue != null && (
                            <Badge className="bg-blue-600 text-white border-0">{f.note_obtenue}%</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {f.fichier_nom}{f.formateur_nom ? ` — ${f.formateur_nom}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {f.fichier_url && (
                        <Button variant="outline" size="sm" onClick={() => window.open(f.fichier_url!, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(f.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
