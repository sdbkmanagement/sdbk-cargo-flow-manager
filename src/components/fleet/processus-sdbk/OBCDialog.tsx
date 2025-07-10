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
    exces_vitesse_urbain: 0,
    exces_vitesse_campagne: 0,
    temps_conduite_depasse: 0,
    conduite_continue_sans_pause: 0,
    conduite_nuit_non_autorisee: 0,
    pause_reglementaire_non_respectee: 0,
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

  const invariants = [
    { key: 'acceleration_excessive', label: 'Accélérations excessives', description: 'Nombre d\'accélérations brusques détectées' },
    { key: 'freinage_brusque', label: 'Freinages brusques', description: 'Nombre de freinages d\'urgence' },
    { key: 'exces_vitesse_urbain', label: 'Excès vitesse urbain', description: 'Dépassements > 30 km/h en ville' },
    { key: 'exces_vitesse_campagne', label: 'Excès vitesse campagne', description: 'Dépassements > 50 km/h en campagne' },
    { key: 'temps_conduite_depasse', label: 'Temps de conduite dépassé', description: 'Dépassements du temps réglementaire' },
    { key: 'conduite_continue_sans_pause', label: 'Conduite sans pause', description: 'Conduite continue excessive' },
    { key: 'conduite_nuit_non_autorisee', label: 'Conduite de nuit interdite', description: 'Conduite de nuit non autorisée' },
    { key: 'pause_reglementaire_non_respectee', label: 'Pause non respectée', description: 'Pauses réglementaires non prises' },
    { key: 'anomalies_techniques', label: 'Anomalies techniques', description: 'Problèmes techniques détectés' }
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
    const totalViolations = Object.keys(formData)
      .filter(key => key.includes('_'))
      .reduce((sum, key) => sum + (formData[key as keyof typeof formData] as number), 0);
    
    return Math.max(0, 100 - (totalViolations * 5)); // Chaque violation retire 5 points
  };

  const isConforme = () => {
    const score = calculateScore();
    return score >= 70; // Seuil de conformité à 70%
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
        exces_vitesse_urbain: formData.exces_vitesse_urbain,
        exces_vitesse_campagne: formData.exces_vitesse_campagne,
        temps_conduite_depasse: formData.temps_conduite_depasse,
        conduite_continue_sans_pause: formData.conduite_continue_sans_pause,
        conduite_nuit_non_autorisee: formData.conduite_nuit_non_autorisee,
        pause_reglementaire_non_respectee: formData.pause_reglementaire_non_respectee,
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
                {invariants.map((invariant) => (
                  <div key={invariant.key} className="space-y-2">
                    <Label htmlFor={invariant.key}>{invariant.label}</Label>
                    <Input
                      id={invariant.key}
                      type="number"
                      min="0"
                      value={formData[invariant.key as keyof typeof formData]}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        [invariant.key]: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">{invariant.description}</p>
                  </div>
                ))}
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