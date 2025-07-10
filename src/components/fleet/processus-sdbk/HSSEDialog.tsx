import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processusSDBKService } from '@/services/processus-sdbk';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface HSSEDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculeId: string;
  onSuccess: () => void;
}

export const HSSEDialog = ({ open, onOpenChange, vehiculeId, onSuccess }: HSSEDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [controleurNom, setControleurNom] = useState('');
  const [commentaires, setCommentaires] = useState('');
  const [pointsBloquants, setPointsBloquants] = useState('');
  const [checks, setChecks] = useState({
    extincteurs_ok: false,
    trousse_secours_ok: false,
    triangle_signalisation_ok: false,
    gilets_fluorescents_ok: false,
    absence_fuite: false,
    proprete_citerne: false,
    absence_danger_visible: false,
    equipements_securite_complets: false
  });
  const { toast } = useToast();

  const checklistItems = [
    { 
      key: 'extincteurs_ok', 
      label: 'Extincteurs en place et en bon état',
      description: 'Vérifier la présence et l\'état des extincteurs'
    },
    { 
      key: 'trousse_secours_ok', 
      label: 'Trousse de secours complète',
      description: 'Trousse de premiers secours présente et complète'
    },
    { 
      key: 'triangle_signalisation_ok', 
      label: 'Triangle de signalisation présent',
      description: 'Triangle de panne en bon état'
    },
    { 
      key: 'gilets_fluorescents_ok', 
      label: 'Gilets fluorescents disponibles',
      description: 'Gilets haute visibilité pour le chauffeur'
    },
    { 
      key: 'absence_fuite', 
      label: 'Absence de fuite détectée',
      description: 'Aucune fuite de carburant ou fluide'
    },
    { 
      key: 'proprete_citerne', 
      label: 'Propreté de la citerne',
      description: 'Citerne propre et sans contamination'
    },
    { 
      key: 'absence_danger_visible', 
      label: 'Absence de danger visible',
      description: 'Aucun élément dangereux apparent'
    },
    { 
      key: 'equipements_securite_complets', 
      label: 'Équipements de sécurité complets',
      description: 'Tous les équipements de sécurité requis présents'
    }
  ];

  const isConforme = () => {
    return Object.values(checks).every(check => check);
  };

  const getPointsNonConformes = () => {
    return checklistItems
      .filter(item => !checks[item.key as keyof typeof checks])
      .map(item => item.label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const conforme = isConforme();
      const pointsBloquantsArray = conforme ? [] : getPointsNonConformes();

      const controleData = {
        vehicule_id: vehiculeId,
        extincteurs_ok: checks.extincteurs_ok,
        trousse_secours_ok: checks.trousse_secours_ok,
        triangle_signalisation_ok: checks.triangle_signalisation_ok,
        gilets_fluorescents_ok: checks.gilets_fluorescents_ok,
        absence_fuite: checks.absence_fuite,
        proprete_citerne: checks.proprete_citerne,
        absence_danger_visible: checks.absence_danger_visible,
        equipements_securite_complets: checks.equipements_securite_complets,
        conforme,
        points_bloquants: pointsBloquantsArray,
        controleur_nom: controleurNom,
        commentaires
      };

      const controle = await processusSDBKService.creerControleHSSE(controleData);
      await processusSDBKService.terminerControleHSSE(
        controle.id, 
        conforme, 
        conforme ? undefined : pointsBloquantsArray
      );

      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le contrôle HSSE',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contrôle Q-HSSE (Qualité - Hygiène - Santé - Sécurité - Environnement)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="controleur_nom">Nom du contrôleur HSSE</Label>
            <Input
              id="controleur_nom"
              value={controleurNom}
              onChange={(e) => setControleurNom(e.target.value)}
              placeholder="Nom du contrôleur"
              required
            />
          </div>

          {/* Checklist HSSE */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist de Sécurité HSSE</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tous les points doivent être validés pour que le véhicule soit conforme
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklistItems.map((item) => (
                  <div key={item.key} className="border rounded p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={item.key}
                        checked={checks[item.key as keyof typeof checks]}
                        onCheckedChange={(checked) => 
                          setChecks(prev => ({ ...prev, [item.key]: !!checked }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={item.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {item.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                      {checks[item.key as keyof typeof checks] ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="commentaires">Commentaires et observations</Label>
            <Textarea
              id="commentaires"
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              placeholder="Observations particulières, recommandations..."
              rows={3}
            />
          </div>

          {!isConforme() && (
            <div>
              <Label htmlFor="points_bloquants">Points bloquants détaillés</Label>
              <Textarea
                id="points_bloquants"
                value={pointsBloquants}
                onChange={(e) => setPointsBloquants(e.target.value)}
                placeholder="Détaillez les points qui nécessitent une correction..."
                rows={2}
              />
            </div>
          )}

          {/* Résumé du contrôle */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Points vérifiés:</span>
                  <span className="font-bold">
                    {Object.values(checks).filter(Boolean).length}/{checklistItems.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Résultat:</span>
                  <div className="flex items-center gap-2">
                    {isConforme() ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">Conforme HSSE</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600 font-medium">Non conforme - Véhicule bloqué</span>
                      </>
                    )}
                  </div>
                </div>

                {!isConforme() && (
                  <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Points non conformes:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {getPointsNonConformes().map((point, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={isConforme() ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Enregistrement...' : 
               isConforme() ? 'Valider - Véhicule Conforme' : 'Enregistrer - Véhicule Bloqué'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};