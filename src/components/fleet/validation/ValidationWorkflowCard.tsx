
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, MessageSquare, History } from 'lucide-react';
import { validationService, type ValidationWorkflowWithEtapes, type EtapeType, type StatutEtape } from '@/services/validation';
import { useToast } from '@/hooks/use-toast';

interface ValidationWorkflowCardProps {
  vehiculeId: string;
  vehiculeNumero: string;
  userRole?: string; // Pour déterminer les permissions
}

const ETAPE_LABELS = {
  maintenance: 'Maintenance',
  administratif: 'Administratif', 
  hsecq: 'HSECQ',
  obc: 'OBC (Opérations)'
};

const ETAPE_PERMISSIONS = {
  maintenance: ['maintenance', 'admin', 'direction'],
  administratif: ['administratif', 'admin', 'direction'],
  hsecq: ['hsecq', 'admin', 'direction'],
  obc: ['obc', 'admin', 'direction']
};

export const ValidationWorkflowCard = ({ vehiculeId, vehiculeNumero, userRole = 'admin' }: ValidationWorkflowCardProps) => {
  const [workflow, setWorkflow] = useState<ValidationWorkflowWithEtapes | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState<{show: boolean, etapeId: string, action: StatutEtape} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflow();
  }, [vehiculeId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await validationService.getWorkflowByVehicule(vehiculeId);
      setWorkflow(data);
    } catch (error) {
      console.error('Erreur lors du chargement du workflow:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le workflow de validation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (etapeId: string, statut: StatutEtape, commentaireText?: string) => {
    try {
      setActionLoading(etapeId);
      await validationService.updateEtapeStatut(
        etapeId, 
        statut, 
        commentaireText,
        'Utilisateur', // TODO: Récupérer le vrai nom utilisateur
        userRole
      );
      
      toast({
        title: 'Validation mise à jour',
        description: `L'étape a été ${statut === 'valide' ? 'validée' : 'rejetée'} avec succès`,
      });
      
      await loadWorkflow(); // Recharger pour voir les changements
      setShowCommentDialog(null);
      setCommentaire('');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la validation',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatutBadge = (statut: StatutEtape) => {
    switch (statut) {
      case 'valide':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Validé</Badge>;
      case 'rejete':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'en_attente':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getStatutGlobalBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge className="bg-green-500 text-white">✅ Validé - Prêt pour mission</Badge>;
      case 'rejete':
        return <Badge className="bg-red-500 text-white">❌ Rejeté - Corrections requises</Badge>;
      case 'en_validation':
      default:
        return <Badge className="bg-blue-500 text-white">🔄 En cours de validation</Badge>;
    }
  };

  const canValidateEtape = (etape: EtapeType) => {
    return ETAPE_PERMISSIONS[etape]?.includes(userRole) || false;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement du workflow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Erreur lors du chargement du workflow</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Workflow de Validation - {vehiculeNumero}</CardTitle>
          {getStatutGlobalBadge(workflow.statut_global)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflow.etapes.map((etape) => (
            <div key={etape.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{ETAPE_LABELS[etape.etape as EtapeType]}</h4>
                  {getStatutBadge(etape.statut as StatutEtape)}
                </div>
                
                {canValidateEtape(etape.etape as EtapeType) && etape.statut === 'en_attente' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => setShowCommentDialog({show: true, etapeId: etape.id, action: 'valide'})}
                      disabled={actionLoading === etape.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => setShowCommentDialog({show: true, etapeId: etape.id, action: 'rejete'})}
                      disabled={actionLoading === etape.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
              
              {etape.commentaire && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-gray-500" />
                    <div>
                      <p>{etape.commentaire}</p>
                      {etape.validateur_nom && (
                        <p className="text-xs text-gray-500 mt-1">
                          Par {etape.validateur_nom} • {etape.date_validation ? new Date(etape.date_validation).toLocaleDateString('fr-FR') : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Dialog open={showCommentDialog?.show} onOpenChange={(open) => !open && setShowCommentDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {showCommentDialog?.action === 'valide' ? 'Valider l\'étape' : 'Rejeter l\'étape'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
                <Textarea
                  id="commentaire"
                  placeholder="Ajoutez un commentaire..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCommentDialog(null)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => showCommentDialog && handleValidation(showCommentDialog.etapeId, showCommentDialog.action, commentaire)}
                  disabled={actionLoading !== null}
                  className={showCommentDialog?.action === 'valide' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionLoading ? 'En cours...' : (showCommentDialog?.action === 'valide' ? 'Valider' : 'Rejeter')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
