import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertTriangle, XCircle, Eraser } from 'lucide-react';
import { formationsService, ThemeFormation, Formation } from '@/services/formationsService';
import { useQueryClient } from '@tanstack/react-query';
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
  const [noteObtenue, setNoteObtenue] = useState<string>('');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setDateFormation(new Date().toISOString().split('T')[0]);
      setFormateurNom('');
      setCommentaire('');
      setNoteObtenue('');
      setSelectedThemes(new Set());
      setSignatureData('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const onDown = (e: MouseEvent | TouchEvent) => {
        drawingRef.current = true;
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in e ? e.touches[0] : e;
        ctx.moveTo(pos.clientX - rect.left, pos.clientY - rect.top);
      };
      const onUp = () => { drawingRef.current = false; };
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!drawingRef.current) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in e ? e.touches[0] : e;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        ctx.lineTo(pos.clientX - rect.left, pos.clientY - rect.top);
        ctx.stroke();
      };

      canvas.addEventListener('mousedown', onDown);
      canvas.addEventListener('mouseup', onUp);
      canvas.addEventListener('mouseleave', onUp);
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('touchstart', onDown, { passive: false });
      canvas.addEventListener('touchend', onUp);
      canvas.addEventListener('touchmove', onMove, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', onDown);
        canvas.removeEventListener('mouseup', onUp);
        canvas.removeEventListener('mouseleave', onUp);
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('touchstart', onDown);
        canvas.removeEventListener('touchend', onUp);
        canvas.removeEventListener('touchmove', onMove);
      };
    }, 150);
    return () => clearTimeout(timer);
  }, [open]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const getSignature = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = pixels.some((_, i) => i % 4 === 3 && pixels[i] > 0);
    return hasContent ? canvas.toDataURL('image/png') : '';
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
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
      const sig = getSignature();
      const promises = Array.from(selectedThemes).map(themeId =>
        formationsService.create({
          chauffeur_id: chauffeur.id,
          theme_id: themeId,
          date_formation: dateFormation,
          formateur_nom: formateurNom || undefined,
          commentaire: commentaire || undefined,
          note_obtenue: noteObtenue ? parseFloat(noteObtenue) : undefined,
          signature_chauffeur: sig || undefined,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Note obtenue (%)</Label>
              <Input type="number" min="0" max="100" step="1" value={noteObtenue} onChange={e => setNoteObtenue(e.target.value)} placeholder="Ex: 85" />
            </div>
            <div className="space-y-2">
              <Label>Commentaire</Label>
              <Textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Observations..." rows={2} />
            </div>
          </div>

          {/* Signature chauffeur (optionnelle) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Signature chauffeur <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
              <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
                <Eraser className="w-3 h-3 mr-1" /> Effacer
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              className="border rounded cursor-crosshair w-full bg-background"
              style={{ touchAction: 'none' }}
            />
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

            <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto">
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
