import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processusSDBKService } from '@/services/processus-sdbk';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface OBCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculeId: string;
  onSuccess: () => void;
}

export const OBCDialog = ({ open, onOpenChange, vehiculeId, onSuccess }: OBCDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    chauffeur_id: '',
    acceleration_excessive: 0,
    freinage_brusque: 0,
    vitesse_urbain_30_depassements: 0,
    vitesse_campagne_50_depassements: 0,
    temps_conduite_4h30_depasse: 0,
    conduite_continue_4h30: 0,
    conduite_nuit_22h_6h: 0,
    pause_45min_non_respectee: 0,
    anomalies_techniques: 0,
    controleur_nom: '',
    commentaires: ''
  });
  const [safeToLoadChecks, setSafeToLoadChecks] = useState({
    niveau_huile: false,
    pneus_ok: false,
    freins_ok: false,
    equipements_securite: false,
    documents_presents: false,
    proprete_vehicule: false,
    permis_chauffeur: false,
    equipement_chauffeur: false
  });
  const { toast } = useToast();

  // Les 8 invariants OBC officiels selon les spécifications
  const invariants = [
    { key: 'acceleration_excessive', label: '1. Accélérations excessives', description: 'Nombre d\'accélérations brusques détectées par l\'OBC', limite: 5 },
    { key: 'freinage_brusque', label: '2. Freinages brusques', description: 'Nombre de freinages d\'urgence enregistrés', limite: 3 },
    { key: 'vitesse_urbain_30_depassements', label: '3. Excès vitesse urbain > 30 km/h', description: 'Dépassements de vitesse en centre urbain', limite: 2 },
    { key: 'vitesse_campagne_50_depassements', label: '4. Excès vitesse campagne > 50 km/h', description: 'Dépassements de vitesse en rase campagne', limite: 1 },
    { key: 'temps_conduite_4h30_depasse', label: '5. Temps de conduite > 4h30', description: 'Non-respect du temps de conduite maximal', limite: 0 },
    { key: 'conduite_continue_4h30', label: '6. Conduite continue > 4h30', description: 'Conduite continue sans pause réglementaire', limite: 0 },
    { key: 'conduite_nuit_22h_6h', label: '7. Conduite de nuit (22h-6h)', description: 'Conduite de nuit non autorisée', limite: 0 },
    { key: 'pause_45min_non_respectee', label: '8. Pause 45min non respectée', description: 'Non-respect de la pause obligatoire de 45 minutes', limite: 0 }
  ];

  const safeToLoadItems = [
    { key: 'niveau_huile', label: 'Niveau d\'huile vérifié' },
    { key: 'pneus_ok', label: 'État des pneus conforme' },
    { key: 'freins_ok', label: 'Système de freinage opérationnel' },
    { key: 'equipements_securite', label: 'Équipements de sécurité présents' },
    { key: 'documents_presents', label: 'Tous les documents présents' },
    { key: 'proprete_vehicule', label: 'Véhicule propre' },
    { key: 'permis_chauffeur', label: 'Permis du chauffeur valide' },
    { key: 'equipement_chauffeur', label: 'Équipement du chauffeur complet' }
  ];

  const calculateScore = () => {
    let score = 100;
    invariants.forEach(invariant => {
      const value = formData[invariant.key as keyof typeof formData] as number;
      if (value > invariant.limite) {
        score -= (value - invariant.limite) * 10; // Déduction selon dépassement
      }
    });
    return Math.max(0, score);
  };

  const isConforme = () => {
    // Vérifier si chaque invariant respecte sa limite
    return invariants.every(invariant => {
      const value = formData[invariant.key as keyof typeof formData] as number;
      return value <= invariant.limite;
    });
  };

  const getViolations = () => {
    return invariants.filter(invariant => {
      const value = formData[invariant.key as keyof typeof formData] as number;
      return value > invariant.limite;
    });
  };

  const isSafeToLoadOK = () => {
    return Object.values(safeToLoadChecks).every(check => check);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const score = calculateScore();
      const conforme = isConforme();
      const safeToLoadValide = isSafeToLoadOK();

      const controleData = {
        vehicule_id: vehiculeId,
        chauffeur_id: formData.chauffeur_id,
        acceleration_excessive: formData.acceleration_excessive,
        freinage_brusque: formData.freinage_brusque,
        vitesse_urbain_30_depassements: formData.vitesse_urbain_30_depassements,
        vitesse_campagne_50_depassements: formData.vitesse_campagne_50_depassements,
        temps_conduite_4h30_depasse: formData.temps_conduite_4h30_depasse,
        conduite_continue_4h30: formData.conduite_continue_4h30,
        conduite_nuit_22h_6h: formData.conduite_nuit_22h_6h,
        pause_45min_non_respectee: formData.pause_45min_non_respectee,
        anomalies_techniques: formData.anomalies_techniques,
        score_global: score,
        conforme,
        safe_to_load_valide: safeToLoadValide,
        controleur_nom: formData.controleur_nom,
        commentaires: formData.commentaires
      };

      const controle = await processusSDBKService.creerControleOBC(controleData);
      await processusSDBKService.terminerControleOBC(controle.id, conforme, safeToLoadValide);

      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le contrôle OBC',
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
          <DialogTitle>Contrôle OBC (On Board Computer)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chauffeur_id">ID Chauffeur</Label>
              <Input
                id="chauffeur_id"
                value={formData.chauffeur_id}
                onChange={(e) => setFormData(prev => ({ ...prev, chauffeur_id: e.target.value }))}
                placeholder="Sélectionner le chauffeur"
                required
              />
            </div>
            <div>
              <Label htmlFor="controleur_nom">Nom du contrôleur OBC</Label>
              <Input
                id="controleur_nom"
                value={formData.controleur_nom}
                onChange={(e) => setFormData(prev => ({ ...prev, controleur_nom: e.target.value }))}
                placeholder="Nom du contrôleur"
                required
              />
            </div>
          </div>

          {/* Analyse des 8 invariants OBC */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse des 8 Invariants OBC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invariants.map((invariant) => {
                  const currentValue = formData[invariant.key as keyof typeof formData] as number;
                  const isViolation = currentValue > invariant.limite;
                  
                  return (
                    <div key={invariant.key} className={`space-y-2 p-3 rounded border ${
                      isViolation ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}>
                      <Label htmlFor={invariant.key} className={isViolation ? 'text-red-700' : ''}>
                        {invariant.label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={invariant.key}
                          type="number"
                          min="0"
                          value={currentValue}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            [invariant.key]: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="0"
                          className={isViolation ? 'border-red-300' : ''}
                        />
                        <span className="text-sm text-muted-foreground">
                          / {invariant.limite} max
                        </span>
                        {isViolation && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{invariant.description}</p>
                      {isViolation && (
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ Limite dépassée de {currentValue - invariant.limite}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Document Safe To Load */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist "Safe To Load"</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {safeToLoadItems.map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={safeToLoadChecks[item.key as keyof typeof safeToLoadChecks]}
                      onCheckedChange={(checked) => 
                        setSafeToLoadChecks(prev => ({ ...prev, [item.key]: !!checked }))
                      }
                    />
                    <label 
                      htmlFor={item.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
              placeholder="Observations, recommandations..."
              rows={3}
            />
          </div>

          {/* Résumé */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score OBC:</span>
                  <span className={`font-bold ${calculateScore() >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateScore()}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Safe To Load:</span>
                  <div className="flex items-center gap-1">
                    {isSafeToLoadOK() ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Conforme</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">Non conforme</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Résultat global:</span>
                  <div className="flex items-center gap-1">
                    {isConforme() && isSafeToLoadOK() ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Validé</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">Bloqué</span>
                      </>
                    )}
                  </div>
                </div>
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
              className={isConforme() && isSafeToLoadOK() ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Enregistrement...' : 
               isConforme() && isSafeToLoadOK() ? 'Valider le contrôle' : 'Bloquer le véhicule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};