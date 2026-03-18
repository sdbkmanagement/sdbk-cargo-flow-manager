import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { validationService, type ValidationWorkflowWithEtapes, type EtapeType, type StatutEtape } from '@/services/validation';
import { useToast } from '@/hooks/use-toast';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';
import { ValidationHistorique } from './ValidationHistorique';
import { ValidationStatusBadge } from './ValidationStatusBadge';
import { ValidationActionButtons } from './ValidationActionButtons';
import { EtapeCommentaires } from './EtapeCommentaires';

interface ValidationWorkflowCardProps {
  vehiculeId: string;
  vehiculeNumero: string;
  userRole?: string;
}

const ETAPE_LABELS = {
  maintenance: 'Maintenance',
  administratif: 'Administratif', 
  hsecq: 'HSEQ',
  obc: 'OBC (Opérations)'
};

export const ValidationWorkflowCard = ({ vehiculeId, vehiculeNumero, userRole = 'admin' }: ValidationWorkflowCardProps) => {
  const [workflow, setWorkflow] = useState<ValidationWorkflowWithEtapes | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState<{show: boolean, etapeId: string, action: StatutEtape} | null>(null);
  const [etapeCommentaires, setEtapeCommentaires] = useState<{[key: string]: any[]}>({});
  const { toast } = useToast();
  const { canValidateEtape, getUserRole, getUserName, getUserRoles } = useValidationPermissions();

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      console.log(`Chargement optimisé workflow pour véhicule ${vehiculeId}`);
      const data = await validationService.getWorkflowByVehicule(vehiculeId);
      setWorkflow(data);
      
      // Charger l'historique des commentaires pour chaque étape
      if (data) {
        const historique = await validationService.getHistorique(data.id);
        const commentairesParEtape: {[key: string]: any[]} = {};
        
        data.etapes.forEach(etape => {
          commentairesParEtape[etape.id] = historique.filter(h => h.etape === etape.etape);
        });
        
        setEtapeCommentaires(commentairesParEtape);
      }
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
      if (!etape) {
        toast({
          title: 'Erreur',
          description: 'Étape non trouvée dans le workflow',
          variant: 'destructive'
        });
        return;
      }

      if (!canValidateEtape(etape.etape)) {
        toast({
          title: 'Accès refusé',
          description: `Vous n'avez pas l'autorisation de valider l'étape "${ETAPE_LABELS[etape.etape as EtapeType]}"`,
          variant: 'destructive'
        });
        return;
      }

      const commentaireFinal = commentaireText?.trim() || '';
      const userName = getUserName();
      const userRoleValue = getUserRole();

      console.log('🚀 Démarrage de la validation:', {
        etapeId,
        etape: etape.etape,
        statutActuel: etape.statut,
        nouveauStatut: statut,
        commentaire: commentaireFinal,
        validateur: userName,
        role: userRoleValue
      });

      await validationService.updateEtapeStatut(
        etapeId, 
        statut, 
        commentaireFinal,
        userName,
        userRoleValue
      );
      
      console.log('✅ Validation réussie');
      
      const actionText = statut === 'valide' ? 'validée' : 
                        statut === 'rejete' ? 'rejetée' : 'mise en attente';
      
      toast({
        title: 'Validation mise à jour',
        description: `L'étape "${ETAPE_LABELS[etape.etape as EtapeType]}" a été ${actionText} avec succès`,
      });
      
      await loadWorkflow();
      setShowCommentDialog(null);
      setCommentaire('');
      
    } catch (error) {
      console.error('💥 Erreur lors de la validation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      toast({
        title: 'Erreur de validation',
        description: `Impossible de mettre à jour la validation: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
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

  const canModifyEtape = (etape: any) => {
    const canValidate = canValidateEtape(etape.etape);
    
    console.log('🔍 Vérification modification étape:', {
      etape: etape.etape,
      canValidate,
      userRoles: getUserRoles(),
      userRole: getUserRole()
    });
    
    return canValidate;
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
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle className="text-base sm:text-lg leading-tight">{vehiculeNumero}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {getStatutGlobalBadge(workflow.statut_global)}
            <ValidationHistorique workflowId={workflow.id} />
            <Button onClick={loadWorkflow} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflow.etapes.map((etape) => {
            const canModify = canModifyEtape(etape);
            
            return (
              <div key={etape.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm">{ETAPE_LABELS[etape.etape as EtapeType]}</h4>
                  <ValidationStatusBadge statut={etape.statut as StatutEtape} size="sm" />
                  
                  {canModify ? (
                    <div className="ml-auto">
                      <ValidationActionButtons
                        currentStatus={etape.statut as StatutEtape}
                        onStatusChange={(status) => setShowCommentDialog({show: true, etapeId: etape.id, action: status})}
                        isLoading={actionLoading === etape.id}
                      />
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-gray-500 ml-auto">
                      Accès limité
                    </Badge>
                  )}
                </div>
                
                <EtapeCommentaires
                  etapeLabel={ETAPE_LABELS[etape.etape as EtapeType]}
                  commentaires={etapeCommentaires[etape.id] || []}
                  dernierCommentaire={etape.commentaire}
                  derniereModification={etape.validateur_nom ? {
                    validateur_nom: etape.validateur_nom,
                    date: etape.date_validation || etape.updated_at
                  } : undefined}
                />
              </div>
            );
          })}
        </div>

        <Dialog open={showCommentDialog?.show} onOpenChange={(open) => !open && setShowCommentDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">
                {showCommentDialog?.action === 'valide' ? '✅ Valider l\'étape' : 
                 showCommentDialog?.action === 'rejete' ? '❌ Rejeter l\'étape' : 
                 '⏳ Remettre en attente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="commentaire" className="text-sm">
                  Commentaire {showCommentDialog?.action === 'rejete' ? '(requis pour un rejet)' : '(optionnel)'}
                </Label>
                <Textarea
                  id="commentaire"
                  placeholder="Expliquez la raison de cette modification..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentDialog(null);
                    setCommentaire('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (showCommentDialog) {
                      handleValidation(showCommentDialog.etapeId, showCommentDialog.action, commentaire);
                    }
                  }}
                  disabled={actionLoading !== null || (showCommentDialog?.action === 'rejete' && !commentaire.trim())}
                  className={
                    showCommentDialog?.action === 'valide' ? 'bg-green-600 hover:bg-green-700' : 
                    showCommentDialog?.action === 'rejete' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  }
                >
                  {actionLoading ? 'En cours...' : (
                    showCommentDialog?.action === 'valide' ? 'Valider' : 
                    showCommentDialog?.action === 'rejete' ? 'Rejeter' :
                    'Mettre en attente'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
