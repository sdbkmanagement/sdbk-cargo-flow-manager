import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formationsService, ThemeFormation, Formation } from '@/services/formationsService';
import { toast } from '@/hooks/use-toast';

interface BulkFormationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chauffeur: { id: string; nom: string; prenom: string; matricule?: string | null } | null;
  themes: ThemeFormation[];
  existingFormations: Map<string, Formation>;
}

export const BulkFormationDialog = ({ open, onOpenChange, chauffeur, themes, existingFormations }: BulkFormationDialogProps) => {
  const queryClient = useQueryClient();
  const [dateFormation, setDateFormation] = useState('');
  const [formateurNom, setFormateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDateFormation(new Date().toISOString().split('T')[0]);
      setFormateurNom('');
      setCommentaire('');
      setSelectedThemes(new Set());
    }
  }, [open]);

  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) {
        next.delete(themeId);
      } else {
        next.add(themeId);
      }
      return next;
    });
  };

  const selectAllThemes = () => {
    const nonExisting = themes.filter(t => !existingFormations.has(t.id)).map(t => t.id);
    setSelectedThemes(new Set(nonExisting));
  };

  const deselectAll = () => setSelectedThemes(new Set());

  const handleSubmit = async () => {
    if (!chauffeur || selectedThemes.size === 0) {
      toast({ title: 'Veuillez sélectionner au moins un thème', variant: 'destructive' });
      return;
    }
    if (!dateFormation) {
      toast({ title: 'Veuillez renseigner la date', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = Array.from(selectedThemes).map(themeId =>
        formationsService.create({
          chauffeur_id: chauffeur.id,
          theme_id: themeId,
          date_formation: dateFormation,
          formateur_nom: formateurNom || undefined,
          commentaire: commentaire || undefined,
        })
      );
      await Promise.all(promises);

      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['formations-stats'] });
      onOpenChange(false);
      toast({ title: `${selectedThemes.size} formation(s) enregistrée(s) avec succès` });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!chauffeur) return null;

  const statutIcon = (statut: string) => {
    if (statut === 'valide') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (statut === 'a_renouveler') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    if (statut === 'expire') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Recyclage — {chauffeur.prenom} {chauffeur.nom}
            {chauffeur.matricule && <span className="text-muted-foreground text-sm ml-2">({chauffeur.matricule})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date et formateur — saisis une seule fois */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de formation *</Label>
              <Input type="date" value={dateFormation} onChange={e => setDateFormation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Formateur</Label>
              <Input value={formateurNom} onChange={e => setFormateurNom(e.target.value)} placeholder="Nom du formateur" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Observations..." rows={2} />
          </div>

          {/* Sélection des thèmes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Thèmes à enregistrer</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAllThemes}>Tout cocher</Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAll}>Tout décocher</Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {themes.map(theme => {
                const existing = existingFormations.get(theme.id);
                const alreadyDone = !!existing;
                const isSelected = selectedThemes.has(theme.id);

                return (
                  <div
                    key={theme.id}
                    className={`flex items-center justify-between p-3 ${alreadyDone ? 'bg-muted/30' : 'hover:bg-muted/20 cursor-pointer'}`}
                    onClick={() => !alreadyDone && toggleTheme(theme.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={alreadyDone || isSelected}
                        disabled={alreadyDone}
                        onCheckedChange={() => !alreadyDone && toggleTheme(theme.id)}
                      />
                      <div>
                        <span className="text-sm font-medium">{theme.nom}</span>
                        {theme.obligatoire && (
                          <Badge variant="outline" className="ml-2 text-[10px]">Obligatoire</Badge>
                        )}
                      </div>
                    </div>
                    {alreadyDone && existing && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {statutIcon(existing.statut)}
                        <span>{new Date(existing.date_formation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedThemes.size} thème(s) sélectionné(s) • Les thèmes déjà enregistrés sont grisés
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || selectedThemes.size === 0}>
              {isSubmitting ? 'Enregistrement...' : `Enregistrer ${selectedThemes.size} formation(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
