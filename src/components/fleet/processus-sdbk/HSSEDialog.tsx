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
  
  // Check-liste HSSE détaillée selon les normes de sécurité
  const checklistItems = [
    { 
      category: 'Extincteurs',
      items: [
        { key: 'extincteur_emplacement_ok', label: 'Extincteur en place', description: 'Extincteur accessible et dans son emplacement' },
        { key: 'extincteur_date_validite_ok', label: 'Date de validité OK', description: 'Date de révision non dépassée' },
        { key: 'extincteur_pression_ok', label: 'Pression conforme', description: 'Manomètre dans la zone verte' }
      ]
    },
    { 
      category: 'Trousse de secours',
      items: [
        { key: 'trousse_secours_complete', label: 'Trousse complète', description: 'Tous les éléments présents' },
        { key: 'trousse_secours_date_ok', label: 'Date de péremption OK', description: 'Aucun produit périmé' }
      ]
    },
    { 
      category: 'Signalisation',
      items: [
        { key: 'triangle_signalisation_present', label: 'Triangle présent', description: 'Triangle de panne disponible' },
        { key: 'triangle_signalisation_etat_ok', label: 'Triangle en bon état', description: 'Pas de dommage visible' }
      ]
    },
    { 
      category: 'Équipements de protection',
      items: [
        { key: 'gilets_nombre_suffisant', label: 'Nombre de gilets suffisant', description: 'Un gilet par personne minimum' },
        { key: 'gilets_etat_visible', label: 'Gilets haute visibilité', description: 'Bandes réfléchissantes en bon état' }
      ]
    },
    { 
      category: 'Contrôle des fuites',
      items: [
        { key: 'fuite_carburant_absente', label: 'Pas de fuite carburant', description: 'Aucune trace de carburant au sol' },
        { key: 'fuite_huile_absente', label: 'Pas de fuite huile', description: 'Aucune trace d\'huile au sol' }
      ]
    },
    { 
      category: 'Propreté citerne',
      items: [
        { key: 'citerne_proprete_exterieure', label: 'Citerne propre extérieurement', description: 'Pas de résidus ou salissures' },
        { key: 'citerne_proprete_interieure', label: 'Citerne propre intérieurement', description: 'Nettoyage intérieur conforme' }
      ]
    },
    { 
      category: 'Sécurité générale',
      items: [
        { key: 'danger_visible_absent', label: 'Absence de danger visible', description: 'Aucun élément dangereux apparent' },
        { key: 'securite_generale_ok', label: 'Sécurité générale conforme', description: 'Tous les contrôles de sécurité OK' }
      ]
    }
  ];

  const allCheckItems = checklistItems.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const [checks, setChecks] = useState(() => {
    const initialChecks: Record<string, boolean> = {};
    allCheckItems.forEach(item => {
      initialChecks[item.key] = false;
    });
    return initialChecks;
  });
  const { toast } = useToast();

  const isConforme = () => {
    return Object.values(checks).every(check => check);
  };

  const getPointsNonConformes = () => {
    return allCheckItems
      .filter(item => !checks[item.key])
      .map(item => `${item.category}: ${item.label}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const conforme = isConforme();
      const pointsBloquantsArray = conforme ? [] : getPointsNonConformes();

      const controleData = {
        vehicule_id: vehiculeId,
        // Nouveaux champs détaillés
        extincteur_emplacement_ok: checks.extincteur_emplacement_ok || false,
        extincteur_date_validite_ok: checks.extincteur_date_validite_ok || false,
        extincteur_pression_ok: checks.extincteur_pression_ok || false,
        trousse_secours_complete: checks.trousse_secours_complete || false,
        trousse_secours_date_ok: checks.trousse_secours_date_ok || false,
        triangle_signalisation_present: checks.triangle_signalisation_present || false,
        triangle_signalisation_etat_ok: checks.triangle_signalisation_etat_ok || false,
        gilets_nombre_suffisant: checks.gilets_nombre_suffisant || false,
        gilets_etat_visible: checks.gilets_etat_visible || false,
        fuite_carburant_absente: checks.fuite_carburant_absente || false,
        fuite_huile_absente: checks.fuite_huile_absente || false,
        citerne_proprete_exterieure: checks.citerne_proprete_exterieure || false,
        citerne_proprete_interieure: checks.citerne_proprete_interieure || false,
        danger_visible_absent: checks.danger_visible_absent || false,
        securite_generale_ok: checks.securite_generale_ok || false,
        // Champs originaux pour compatibilité
        extincteurs_ok: checks.extincteur_emplacement_ok && checks.extincteur_date_validite_ok && checks.extincteur_pression_ok,
        trousse_secours_ok: checks.trousse_secours_complete && checks.trousse_secours_date_ok,
        triangle_signalisation_ok: checks.triangle_signalisation_present && checks.triangle_signalisation_etat_ok,
        gilets_fluorescents_ok: checks.gilets_nombre_suffisant && checks.gilets_etat_visible,
        absence_fuite: checks.fuite_carburant_absente && checks.fuite_huile_absente,
        proprete_citerne: checks.citerne_proprete_exterieure && checks.citerne_proprete_interieure,
        absence_danger_visible: checks.danger_visible_absent,
        equipements_securite_complets: checks.securite_generale_ok,
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
              <div className="space-y-6">
                {checklistItems.map((category) => (
                  <div key={category.category} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3 text-blue-700">{category.category}</h4>
                    <div className="space-y-3">
                      {category.items.map((item) => {
                        const isChecked = checks[item.key];
                        return (
                          <div key={item.key} className={`border rounded p-3 ${isChecked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={item.key}
                                checked={isChecked}
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
                              {isChecked ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                    {Object.values(checks).filter(Boolean).length}/{allCheckItems.length}
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