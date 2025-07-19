
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Eye, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import { documentsService } from '@/services/documentsService';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';

interface ChauffeurDocumentManagerProps {
  chauffeur: any;
  onUpdate: () => void;
}

export const ChauffeurDocumentManager = ({ chauffeur, onUpdate }: ChauffeurDocumentManagerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [chauffeur.id]);

  const loadDocuments = async () => {
    try {
      const docs = await documentsService.getByEntity('chauffeur', chauffeur.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  const handleUpload = async (documentType: string, file: File, dateExpiration?: string) => {
    setIsLoading(true);
    try {
      const url = await documentsService.uploadFile(file, 'chauffeur', chauffeur.id, documentType);
      
      const documentData = {
        entity_type: 'chauffeur',
        entity_id: chauffeur.id,
        nom: CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES].label,
        type: documentType,
        url: url,
        taille: file.size,
        date_expiration: dateExpiration || null,
        statut: 'valide'
      };

      await documentsService.create(documentData);
      
      toast({
        title: "Document ajouté",
        description: "Le document a été téléchargé avec succès",
      });
      
      setShowUpload(null);
      loadDocuments();
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!config.duree_mois) return null;
    
    const now = new Date();
    const expiration = new Date(now);
    expiration.setMonth(expiration.getMonth() + config.duree_mois);
    return expiration.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents du chauffeur
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
                      <div className="flex gap-2">
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
                          onClick={() => setShowUpload(key)}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Remplacer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowUpload(key)}
                      className="w-full"
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

      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>
              Télécharger: {CHAUFFEUR_DOCUMENT_TYPES[showUpload as keyof typeof CHAUFFEUR_DOCUMENT_TYPES].label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              onUpload={(file) => {
                const defaultExpiration = getExpirationDate(showUpload);
                handleUpload(showUpload, file, defaultExpiration);
              }}
              onCancel={() => setShowUpload(null)}
              acceptedTypes=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024} // 10MB
              showExpirationDate={!!CHAUFFEUR_DOCUMENT_TYPES[showUpload as keyof typeof CHAUFFEUR_DOCUMENT_TYPES].duree_mois}
              defaultExpirationDate={getExpirationDate(showUpload)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
