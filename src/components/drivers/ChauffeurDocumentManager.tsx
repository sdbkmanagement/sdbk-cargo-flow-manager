
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';
import { DocumentUpload } from './DocumentUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChauffeurDocument {
  id: string;
  type: keyof typeof CHAUFFEUR_DOCUMENT_TYPES;
  nom: string;
  url: string;
  date_expiration?: string;
  date_delivrance?: string;
  statut: 'valide' | 'expire' | 'a_renouveler';
  taille: number;
}

interface ChauffeurDocumentManagerProps {
  chauffeurId: string;
  documents?: ChauffeurDocument[];
  onDocumentsChange?: (documents: ChauffeurDocument[]) => void;
}

export const ChauffeurDocumentManager = ({ 
  chauffeurId, 
  documents = [], 
  onDocumentsChange 
}: ChauffeurDocumentManagerProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<keyof typeof CHAUFFEUR_DOCUMENT_TYPES | null>(null);
  const [dateExpiration, setDateExpiration] = useState('');
  const [dateDelivrance, setDateDelivrance] = useState('');
  const { toast } = useToast();

  const getDocumentStatus = (doc: ChauffeurDocument) => {
    if (!doc.date_expiration) {
      return { type: 'info' as const, text: 'Permanent' };
    }
    
    const expirationDate = new Date(doc.date_expiration);
    const today = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (expirationDate < today) {
      return { type: 'error' as const, text: 'Expiré' };
    } else if (expirationDate < thirtyDaysFromNow) {
      return { type: 'warning' as const, text: 'À renouveler' };
    } else {
      return { type: 'success' as const, text: 'Valide' };
    }
  };

  const getStatusBadge = (status: { type: string; text: string }) => {
    const baseClasses = "text-xs font-medium";
    
    switch (status.type) {
      case 'error':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>{status.text}</Badge>;
      case 'warning':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status.text}</Badge>;
      case 'success':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>{status.text}</Badge>;
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>{status.text}</Badge>;
    }
  };

  const handleAddDocument = (documentType: keyof typeof CHAUFFEUR_DOCUMENT_TYPES) => {
    setSelectedDocumentType(documentType);
    setDateExpiration('');
    setDateDelivrance('');
    setShowUploadDialog(true);
  };

  const handleFileUpload = (files: any[]) => {
    if (files.length > 0 && selectedDocumentType) {
      const file = files[0];
      const documentConfig = CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType];
      
      let calculatedExpirationDate = '';
      if (documentConfig.duree_mois && dateDelivrance) {
        const delivranceDate = new Date(dateDelivrance);
        delivranceDate.setMonth(delivranceDate.getMonth() + documentConfig.duree_mois);
        calculatedExpirationDate = delivranceDate.toISOString().split('T')[0];
      }

      const newDocument: ChauffeurDocument = {
        id: Date.now().toString(),
        type: selectedDocumentType,
        nom: documentConfig.label,
        url: file.url,
        date_expiration: dateExpiration || calculatedExpirationDate || undefined,
        date_delivrance: dateDelivrance || undefined,
        statut: 'valide',
        taille: file.size
      };

      const updatedDocuments = [...documents, newDocument];
      onDocumentsChange?.(updatedDocuments);
      
      toast({
        title: "Document ajouté",
        description: `${documentConfig.label} a été ajouté avec succès.`,
      });

      setShowUploadDialog(false);
      setSelectedDocumentType(null);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange?.(updatedDocuments);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès.",
    });
  };

  const renderDocumentCard = (documentType: keyof typeof CHAUFFEUR_DOCUMENT_TYPES) => {
    const documentConfig = CHAUFFEUR_DOCUMENT_TYPES[documentType];
    const existingDoc = documents.find(doc => doc.type === documentType);

    return (
      <Card key={documentType} className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{documentConfig.label}</CardTitle>
            {documentConfig.obligatoire && (
              <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
            )}
          </div>
          {documentConfig.duree_mois && (
            <p className="text-sm text-muted-foreground">
              Durée: {documentConfig.duree_mois} mois
            </p>
          )}
        </CardHeader>
        <CardContent>
          {existingDoc ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut</span>
                {getStatusBadge(getDocumentStatus(existingDoc))}
              </div>
              
              {existingDoc.date_expiration && (
                <div className="flex items-center gap-2 text-sm">
                  {getDocumentStatus(existingDoc).type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span>
                    Expire le: {new Date(existingDoc.date_expiration).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteDocument(existingDoc.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Aucun document uploadé
              </p>
              <Button 
                onClick={() => handleAddDocument(documentType)}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents du chauffeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(CHAUFFEUR_DOCUMENT_TYPES) as Array<keyof typeof CHAUFFEUR_DOCUMENT_TYPES>).map(renderDocumentCard)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ajouter - {selectedDocumentType && CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType].label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_delivrance">Date de délivrance</Label>
                <Input
                  id="date_delivrance"
                  type="date"
                  value={dateDelivrance}
                  onChange={(e) => setDateDelivrance(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date_expiration">Date d'expiration (optionnelle)</Label>
                <Input
                  id="date_expiration"
                  type="date"
                  value={dateExpiration}
                  onChange={(e) => setDateExpiration(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Fichier du document</Label>
              <DocumentUpload
                onFilesChange={handleFileUpload}
                maxFiles={1}
                maxSizePerFile={10}
                acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
