import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Eye, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import { documentsSimpleService } from '@/services/documentsSimple';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChauffeurDocumentManagerProps {
  chauffeur: any;
  onUpdate: () => void;
}

export const ChauffeurDocumentManager = ({ chauffeur, onUpdate }: ChauffeurDocumentManagerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (chauffeur?.id) {
      loadDocuments();
    }
  }, [chauffeur?.id]);

  const loadDocuments = async () => {
    try {
      console.log('Chargement des documents pour le chauffeur:', chauffeur.id);
      const docs = await documentsSimpleService.getByEntity('chauffeur', chauffeur.id);
      setDocuments(docs);
      console.log('Documents chargés:', docs.length);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (documentType: string, file: File, dateExpiration?: string) => {
    if (!chauffeur?.id) {
      toast({
        title: "Erreur",
        description: "Aucun chauffeur sélectionné",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Début upload document:', { 
        documentType, 
        fileName: file.name, 
        dateExpiration,
        chauffeurId: chauffeur.id 
      });
      
      // Upload du fichier
      const url = await documentsSimpleService.uploadFile(file, 'chauffeur', chauffeur.id, documentType);
      console.log('Fichier uploadé avec succès, URL:', url);
      
      // Préparer les données du document
      const documentData = {
        entity_type: 'chauffeur' as const,
        entity_id: chauffeur.id,
        nom: CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES]?.label || documentType,
        type: documentType,
        url: url,
        taille: file.size,
        date_expiration: dateExpiration || null,
      };

      console.log('Données du document à sauvegarder:', documentData);

      let savedDocument;
      if (editingDocument) {
        savedDocument = await documentsSimpleService.update(editingDocument.id, documentData);
        toast({
          title: "Document modifié",
          description: "Le document a été mis à jour avec succès",
        });
        setEditingDocument(null);
      } else {
        savedDocument = await documentsSimpleService.create(documentData);
        toast({
          title: "Document ajouté",
          description: "Le document a été téléchargé avec succès",
        });
      }
      
      console.log('Document sauvegardé:', savedDocument);
      setShowUpload(null);
      await loadDocuments();
      onUpdate();
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: `Impossible de télécharger le document: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (document: any) => {
    try {
      setIsLoading(true);
      
      // Supprimer le fichier du storage
      if (document.url) {
        await documentsSimpleService.deleteFile(document.url);
      }
      
      // Supprimer l'enregistrement de la base
      await documentsSimpleService.delete(document.id);
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });
      
      setDocumentToDelete(null);
      await loadDocuments();
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcul du statut côté client pour l'affichage
  const getDocumentStatus = (document: any) => {
    if (!document.date_expiration) return { status: 'permanent', label: 'Permanent', color: 'bg-blue-500' };
    
    const now = new Date();
    const expDate = new Date(document.date_expiration);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Expiré', color: 'bg-red-500' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', label: `Expire dans ${daysUntilExpiry}j`, color: 'bg-orange-500' };
    return { status: 'valid', label: 'Valide', color: 'bg-green-500' };
  };

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'expiring': return <Clock className="w-4 h-4" />;
      case 'valid': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getExpirationDate = (documentType: string) => {
    const config = CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
    if (!config?.duree_mois) return null;
    
    const now = new Date();
    const expiration = new Date(now);
    expiration.setMonth(expiration.getMonth() + config.duree_mois);
    return expiration.toISOString().split('T')[0];
  };

  const startEdit = (document: any, documentType: string) => {
    setEditingDocument(document);
    setShowUpload(documentType);
  };

  const isExpirationRequired = (documentType: string) => {
    return documentType !== 'photo_profil' && documentType !== 'contrat_travail';
  };

  if (!chauffeur) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Aucun chauffeur sélectionné
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents de {chauffeur.prenom} {chauffeur.nom}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(CHAUFFEUR_DOCUMENT_TYPES).map(([key, config]) => {
              const existingDoc = documents.find(doc => doc.type === key);
              const status = existingDoc ? getDocumentStatus(existingDoc) : null;
              
              return (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      {config.obligatoire && (
                        <span className="text-xs text-red-600">Obligatoire</span>
                      )}
                      {config.duree_mois && (
                        <p className="text-sm text-gray-500">
                          Durée: {config.duree_mois} mois
                        </p>
                      )}
                    </div>
                    {status && (
                      <Badge className={`${status.color} text-white flex items-center gap-1`}>
                        {getDocumentIcon(status.status)}
                        {status.label}
                      </Badge>
                    )}
                  </div>
                  
                  {existingDoc ? (
                    <div className="space-y-2">
                      {existingDoc.date_expiration && (
                        <p className="text-sm text-gray-600">
                          Expire le: {new Date(existingDoc.date_expiration).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(existingDoc.url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(existingDoc, key)}
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDocumentToDelete(existingDoc)}
                          className="text-red-600 hover:text-red-800"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowUpload(key)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'upload/modification */}
      {showUpload && (
        <Dialog open={!!showUpload} onOpenChange={() => {
          setShowUpload(null);
          setEditingDocument(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Modifier' : 'Télécharger'}: {CHAUFFEUR_DOCUMENT_TYPES[showUpload as keyof typeof CHAUFFEUR_DOCUMENT_TYPES]?.label}
              </DialogTitle>
            </DialogHeader>
            <DocumentUpload
              onUpload={(file, expirationDate) => {
                const defaultExpiration = expirationDate || getExpirationDate(showUpload);
                handleUpload(showUpload, file, defaultExpiration);
              }}
              onCancel={() => {
                setShowUpload(null);
                setEditingDocument(null);
              }}
              acceptedTypes=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024}
              showExpirationDate={isExpirationRequired(showUpload)}
              requiredExpirationDate={isExpirationRequired(showUpload)}
              defaultExpirationDate={editingDocument?.date_expiration || getExpirationDate(showUpload)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => documentToDelete && handleDelete(documentToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
