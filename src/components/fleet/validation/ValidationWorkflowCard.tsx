
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { validationService, type ValidationWorkflowWithEtapes, type EtapeType, type StatutEtape } from '@/services/validation';
import { useToast } from '@/hooks/use-toast';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';

interface ValidationWorkflowCardProps {
  vehiculeId: string;
  vehiculeNumero: string;
  userRole?: string;
}

const ETAPE_LABELS = {
  maintenance: 'Maintenance',
  administratif: 'Administratif', 
  hsecq: 'HSECQ',
  obc: 'OBC (Opérations)'
};

export const ValidationWorkflowCard = ({ vehiculeId, vehiculeNumero, userRole = 'admin' }: ValidationWorkflowCardProps) => {
  const [workflow, setWorkflow] = useState<ValidationWorkflowWithEtapes | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState<{show: boolean, etapeId: string, action: StatutEtape} | null>(null);
  const { toast } = useToast();
  const { canValidateEtape, getUserRole, getUserName } = useValidationPermissions();

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      console.log(`Chargement optimisé workflow pour véhicule ${vehiculeId}`);
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

  useEffect(() => {
    loadWorkflow();
  }, [vehiculeId]);

  const handleValidation = async (etapeId: string, statut: StatutEtape, commentaireText?: string) => {
    try {
      setActionLoading(etapeId);
      
      const etape = workflow?.etapes.find(e => e.id === etapeId);
      if (!etape || !canValidateEtape(etape.etape)) {
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas l\'autorisation de valider cette étape.',
          variant: 'destructive'
        });
        return;
      }

      await validationService.updateEtapeStatut(
        etapeId, 
        statut, 
        commentaireText || '',
        getUserName(),
        getUserRole()
      );
      
      toast({
        title: 'Validation mise à jour',
        description: `L'étape a été ${statut === 'valide' ? 'validée' : 'rejetée'} avec succès`,
      });
      
      // Recharger seulement ce workflow
      await loadWorkflow();
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement workflow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">Erreur lors du chargement du workflow</p>
            <Button onClick={loadWorkflow} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Workflow - {vehiculeNumero}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatutGlobalBadge(workflow.statut_global)}
            <Button onClick={loadWorkflow} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflow.etapes.map((etape) => (
            <div key={etape.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{ETAPE_LABELS[etape.etape as EtapeType]}</h4>
                  {getStatutBadge(etape.statut as StatutEtape)}
                </div>
                
                {canValidateEtape(etape.etape) && etape.statut === 'en_attente' && (
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

                {!canValidateEtape(etape.etape) && etape.statut === 'en_attente' && (
                  <Badge variant="outline" className="text-gray-500">
                    Accès limité
                  </Badge>
                )}
              </div>
              
              {etape.commentaire && (
                <div className="mt-2 p-2 bg-white rounded text-sm border">
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
