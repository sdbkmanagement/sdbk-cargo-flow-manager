import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle, RefreshCw, User, Edit, Trash2, Bug, Eye, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';
import { alertesService } from '@/services/alertesService';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { documentsService } from '@/services/documentsService';

interface DocumentAlert {
  id: string;
  chauffeur_nom: string;
  document_nom: string;
  document_type: string;
  date_expiration: string | null;
  jours_restants: number | null;
  statut: string;
  niveau_alerte: string;
  chauffeur_id?: string;
}

interface EditDocumentData {
  id: string;
  nom: string;
  date_expiration: string;
  chauffeur_id: string;
  chauffeur_nom: string;
  url: string;
}

export const DriversAlerts = () => {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EditDocumentData | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Début du chargement des alertes dans le composant...');
      
      const alertesData = await alertesService.getAlertesChauffeurs();
      
      console.log('📊 Alertes chauffeurs récupérées pour l\'affichage:', alertesData);

      // Transformer les données pour correspondre à l'interface
      const alertsFormatted = alertesData.map(alert => ({
        id: alert.id || '',
        chauffeur_nom: alert.chauffeur_nom || 'Chauffeur inconnu',
        document_nom: alert.document_nom || '',
        document_type: alert.document_type || '',
        date_expiration: alert.date_expiration,
        jours_restants: alert.jours_restants,
        statut: alert.statut || 'inconnu',
        niveau_alerte: alert.niveau_alerte || 'INFO',
        chauffeur_id: alert.chauffeur_id
      }));

      console.log('✅ Alertes formatées pour affichage:', alertsFormatted);
      setAlerts(alertsFormatted);
    } catch (error) {
      console.error('💥 Erreur lors du chargement des alertes dans le composant:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les alertes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const debugDatabase = async () => {
    try {
      console.log('🐛 DÉBOGAGE - Vérification de la base de données...');
      
      // Vérifier la table documents
      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('*');
      
      console.log('📄 TOUS les documents:', allDocs);
      console.log('❌ Erreurs documents:', allDocsError);

      // Vérifier spécifiquement les documents chauffeurs
      const { data: chauffeurDocs, error: chauffeurDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur');
      
      console.log('👤 Documents chauffeurs:', chauffeurDocs);
      console.log('❌ Erreurs documents chauffeurs:', chauffeurDocsError);

      // Vérifier la vue alertes
      const { data: vueAlertes, error: vueAlertesError } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*');
      
      console.log('🎯 Vue alertes_documents_chauffeurs:', vueAlertes);
      console.log('❌ Erreurs vue alertes:', vueAlertesError);

      // Vérifier les chauffeurs
      const { data: chauffeurs, error: chauffeursError } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom');
      
      console.log('👥 Chauffeurs:', chauffeurs);
      console.log('❌ Erreurs chauffeurs:', chauffeursError);

      toast({
        title: 'Débogage terminé',
        description: 'Vérifiez la console pour les détails',
      });

    } catch (error) {
      console.error('💥 Erreur lors du débogage:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
    
    // Actualiser les alertes toutes les 30 secondes
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEditDocument = async (alert: DocumentAlert) => {
    if (!alert.chauffeur_id || !alert.date_expiration) {
      toast({
        title: 'Erreur',
        description: 'Informations du document incomplètes',
        variant: 'destructive'
      });
      return;
    }

    // Récupérer les détails complets du document
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', alert.id)
        .single();

      if (error || !document) {
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les détails du document',
          variant: 'destructive'
        });
        return;
      }

      setEditingDocument({
        id: alert.id,
        nom: alert.document_nom,
        date_expiration: alert.date_expiration,
        chauffeur_id: alert.chauffeur_id,
        chauffeur_nom: alert.chauffeur_nom,
        url: document.url
      });
      setNewExpirationDate(alert.date_expiration);
      setEditDialog(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la récupération du document',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument || !newExpirationDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une nouvelle date d\'expiration',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Mise à jour du document:', editingDocument.id, 'nouvelle date:', newExpirationDate);

      const { error } = await supabase
        .from('documents')
        .update({
          date_expiration: newExpirationDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDocument.id);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le document',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Document mis à jour',
        description: `Nouvelle date d'expiration: ${new Date(newExpirationDate).toLocaleDateString('fr-FR')}`
      });

      setEditDialog(false);
      setEditingDocument(null);
      setNewExpirationDate('');
      
      // Recharger les alertes
      loadAlerts();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du document',
        variant: 'destructive'
      });
    }
  };

  const handleReplaceDocument = (alert: DocumentAlert) => {
    if (!alert.chauffeur_id) {
      toast({
        title: 'Erreur',
        description: 'Informations du document incomplètes',
        variant: 'destructive'
      });
      return;
    }

    // Récupérer les détails complets du document pour le remplacement
    supabase
      .from('documents')
      .select('*')
      .eq('id', alert.id)
      .single()
      .then(({ data: document, error }) => {
        if (error || !document) {
          toast({
            title: 'Erreur',
            description: 'Impossible de récupérer les détails du document',
            variant: 'destructive'
          });
          return;
        }

        setEditingDocument({
          id: alert.id,
          nom: alert.document_nom,
          date_expiration: alert.date_expiration || '',
          chauffeur_id: alert.chauffeur_id!,
          chauffeur_nom: alert.chauffeur_nom,
          url: document.url
        });
        setReplaceDialog(true);
      });
  };

  const handleDocumentUpload = async (file: File, expirationDate?: string) => {
    if (!editingDocument) return;

    setIsUploading(true);
    try {
      console.log('Remplacement du document:', editingDocument.id);

      // Upload du nouveau fichier
      const newUrl = await documentsService.uploadFile(
        file, 
        'chauffeur', 
        editingDocument.chauffeur_id, 
        editingDocument.nom
      );

      // Supprimer l'ancien fichier du storage
      if (editingDocument.url) {
        await documentsService.deleteFile(editingDocument.url);
      }

      // Mettre à jour l'enregistrement du document
      const { error } = await supabase
        .from('documents')
        .update({
          url: newUrl,
          taille: file.size,
          date_expiration: expirationDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDocument.id);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le document',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Document remplacé',
        description: 'Le nouveau document a été téléchargé avec succès'
      });

      setReplaceDialog(false);
      setEditingDocument(null);
      
      // Recharger les alertes
      loadAlerts();
    } catch (error) {
      console.error('Erreur lors du remplacement:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du remplacement du document',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (alert: DocumentAlert) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le document "${alert.document_nom}" de ${alert.chauffeur_nom} ?`)) {
      return;
    }

    try {
      console.log('Suppression du document:', alert.id);

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', alert.id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le document',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Document supprimé',
        description: `Le document "${alert.document_nom}" a été supprimé`
      });

      // Recharger les alertes
      loadAlerts();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du document',
        variant: 'destructive'
      });
    }
  };

  const getAlertIcon = (niveau: string) => {
    if (niveau.includes('URGENT')) return XCircle;
    if (niveau.includes('ATTENTION')) return AlertTriangle;
    return Clock;
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'expire':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'a_renouveler':
        return <Badge variant="secondary">À renouveler</Badge>;
      case 'manquant':
        return <Badge variant="outline" className="border-red-500 text-red-700">Manquant</Badge>;
      default:
        return <Badge variant="default">Valide</Badge>;
    }
  };

  const getDocumentLabel = (documentType: string) => {
    const config = CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
    return config ? config.label : documentType;
  };

  const getNiveauAlerte = (joursRestants: number | null) => {
    if (joursRestants === null) return 'INFO';
    if (joursRestants < 0) return 'URGENT - EXPIRÉ';
    if (joursRestants <= 7) return 'URGENT';
    if (joursRestants <= 30) return 'ATTENTION';
    return 'INFO';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement des alertes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertes Documents Chauffeurs</h2>
          <p className="text-gray-600">
            {alerts.length} alerte(s) détectée(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={debugDatabase} variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Bug className="w-4 h-4 mr-2" />
            Debug DB
          </Button>
          <Button onClick={loadAlerts} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents expirés</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants < 0).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expire sous 7 jours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants >= 0 && a.jours_restants <= 7).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expire sous 30 jours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants > 7 && a.jours_restants <= 30).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune alerte
            </h3>
            <p className="text-gray-600 mb-4">
              Tous les documents des chauffeurs sont conformes
            </p>
            <Button onClick={debugDatabase} variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Bug className="w-4 h-4 mr-2" />
              Déboguer la base de données
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.niveau_alerte);
            const niveauCalcule = getNiveauAlerte(alert.jours_restants);
            
            return (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.jours_restants !== null && alert.jours_restants < 0 
                  ? 'border-l-red-500 bg-red-50' 
                  : alert.jours_restants !== null && alert.jours_restants <= 7
                  ? 'border-l-orange-500 bg-orange-50'
                  : 'border-l-blue-500 bg-blue-50'
              }`}>
                <AlertIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold text-gray-900">
                            {alert.chauffeur_nom}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {getDocumentLabel(alert.document_type)}
                        </span>
                        {getStatusBadge(alert.statut)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{niveauCalcule}</span>
                        {alert.date_expiration && (
                          <span className="ml-2">
                            • Expiration: {new Date(alert.date_expiration).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {alert.jours_restants !== null && (
                          <span className="ml-2">
                            • {alert.jours_restants < 0 
                              ? `Expiré depuis ${Math.abs(alert.jours_restants)} jour(s)`
                              : `${alert.jours_restants} jour(s) restant(s)`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDocument(alert)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier date
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReplaceDocument(alert)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Remplacer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDocument(alert)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Dialog de modification de date d'expiration */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la date d'expiration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chauffeur</Label>
              <Input value={editingDocument?.chauffeur_nom || ''} disabled />
            </div>
            <div>
              <Label>Document</Label>
              <Input value={editingDocument?.nom || ''} disabled />
            </div>
            <div>
              <Label>Document actuel</Label>
              <div className="flex gap-2">
                <Input 
                  value={editingDocument?.date_expiration ? new Date(editingDocument.date_expiration).toLocaleDateString('fr-FR') : ''} 
                  disabled 
                />
                {editingDocument?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(editingDocument.url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="newDate">Nouvelle date d'expiration</Label>
              <Input
                id="newDate"
                type="date"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateDocument}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de remplacement de document */}
      <Dialog open={replaceDialog} onOpenChange={setReplaceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remplacer le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chauffeur</Label>
                <Input value={editingDocument?.chauffeur_nom || ''} disabled />
              </div>
              <div>
                <Label>Type de document</Label>
                <Input value={editingDocument?.nom || ''} disabled />
              </div>
            </div>
            
            {editingDocument?.url && (
              <div>
                <Label>Document actuel</Label>
                <div className="flex gap-2 items-center p-3 bg-gray-50 border rounded">
                  <span className="text-sm text-gray-600">Document expiré</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(editingDocument.url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Consulter l'ancien
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="text-base font-medium">Télécharger le nouveau document</Label>
              <p className="text-sm text-gray-600 mb-4">
                Le nouveau document remplacera automatiquement l'ancien et résoudra l'alerte.
              </p>
              
              <DocumentUpload
                onUpload={handleDocumentUpload}
                onCancel={() => setReplaceDialog(false)}
                acceptedTypes=".pdf,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024}
                showExpirationDate={true}
                requiredExpirationDate={true}
                isLoading={isUploading}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
