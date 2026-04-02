import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';
import { chauffeursService } from '@/services/chauffeurs';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation?: any;
  preselectedChauffeurId?: string;
  preselectedThemeId?: string;
}

export const FormationFormDialog = ({ open, onOpenChange, formation, preselectedChauffeurId, preselectedThemeId }: Props) => {
  const queryClient = useQueryClient();
  const [chauffeurId, setChauffeurId] = useState('');
  const [themeId, setThemeId] = useState('');
  const [dateFormation, setDateFormation] = useState('');
  const [formateurNom, setFormateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [signatureChauffeur, setSignatureChauffeur] = useState('');
  const [signatureFormateur, setSignatureFormateur] = useState('');
  const [chauffeurSearch, setChauffeurSearch] = useState('');

  const canvasChauffeurRef = useRef<HTMLCanvasElement>(null);
  const canvasFormateurRef = useRef<HTMLCanvasElement>(null);

  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes-formation'],
    queryFn: formationsService.getThemes,
  });

  useEffect(() => {
    if (formation) {
      setChauffeurId(formation.chauffeur_id);
      setThemeId(formation.theme_id);
      setDateFormation(formation.date_formation);
      setFormateurNom(formation.formateur_nom || '');
      setCommentaire(formation.commentaire || '');
      setSignatureChauffeur(formation.signature_chauffeur || '');
      setSignatureFormateur(formation.signature_formateur || '');
    } else {
      setChauffeurId(preselectedChauffeurId || '');
      setThemeId(preselectedThemeId || '');
      setDateFormation(new Date().toISOString().split('T')[0]);
      setFormateurNom('');
      setCommentaire('');
      setSignatureChauffeur('');
      setSignatureFormateur('');
    }
  }, [formation, open, preselectedChauffeurId, preselectedThemeId]);

  const createMutation = useMutation({
    mutationFn: (data: any) => formationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['formations-stats'] });
      onOpenChange(false);
      toast({ title: 'Formation ajoutée avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => formationsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['formations-stats'] });
      onOpenChange(false);
      toast({ title: 'Formation mise à jour' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chauffeurId || !themeId || !dateFormation) {
      toast({ title: 'Veuillez remplir les champs obligatoires', variant: 'destructive' });
      return;
    }

    const data = {
      chauffeur_id: chauffeurId,
      theme_id: themeId,
      date_formation: dateFormation,
      formateur_nom: formateurNom || null,
      signature_chauffeur: signatureChauffeur || null,
      signature_formateur: signatureFormateur || null,
      commentaire: commentaire || null,
    };

    if (formation) {
      updateMutation.mutate({ id: formation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Simple signature pad
  const setupCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawing = false;
    canvas.addEventListener('mousedown', () => { drawing = true; ctx.beginPath(); });
    canvas.addEventListener('mouseup', () => { drawing = false; });
    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    });
  };

  const getSignatureData = (canvas: HTMLCanvasElement | null): string => {
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setupCanvas(canvasChauffeurRef.current);
        setupCanvas(canvasFormateurRef.current);
      }, 100);
    }
  }, [open]);

  const filteredChauffeurs = chauffeurs.filter(c => {
    if (!chauffeurSearch) return true;
    const s = chauffeurSearch.toLowerCase();
    return (
      c.nom?.toLowerCase().includes(s) ||
      c.prenom?.toLowerCase().includes(s) ||
      c.matricule?.toLowerCase().includes(s)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formation ? 'Modifier la formation' : 'Nouvelle formation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chauffeur */}
          <div className="space-y-2">
            <Label>Chauffeur *</Label>
            <Input
              placeholder="Rechercher un chauffeur..."
              value={chauffeurSearch}
              onChange={e => setChauffeurSearch(e.target.value)}
              className="mb-2"
            />
            <Select value={chauffeurId} onValueChange={setChauffeurId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chauffeur" />
              </SelectTrigger>
              <SelectContent>
                {filteredChauffeurs.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.prenom} {c.nom} {c.matricule ? `(${c.matricule})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Thème */}
          <div className="space-y-2">
            <Label>Thème de formation *</Label>
            <Select value={themeId} onValueChange={setThemeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un thème" />
              </SelectTrigger>
              <SelectContent>
                {themes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nom} {t.obligatoire ? '(Obligatoire)' : ''} - {t.duree_validite} mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
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

          {/* Commentaire */}
          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Observations..." />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Signature chauffeur</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => clearCanvas(canvasChauffeurRef.current)}>
                  Effacer
                </Button>
              </div>
              <canvas
                ref={canvasChauffeurRef}
                width={250}
                height={100}
                className="border rounded cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Signature formateur</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => clearCanvas(canvasFormateurRef.current)}>
                  Effacer
                </Button>
              </div>
              <canvas
                ref={canvasFormateurRef}
                width={250}
                height={100}
                className="border rounded cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {formation ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
