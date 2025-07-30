import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';

interface ChauffeurDocumentManagerProps {
  chauffeur: any;
  onUpdate?: () => void;
}

export const ChauffeurDocumentManager = ({ chauffeur, onUpdate }: ChauffeurDocumentManagerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [chauffeur.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur')
        .eq('entity_id', chauffeur.id);

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !selectedDocumentType) return;

    try {
      setUploading(selectedDocumentType);
      
      // Upload du fichier
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${chauffeur.id}/${selectedDocumentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Calculer la date d'expiration si nécessaire et pas fournie manuellement
      let finalExpirationDate = expirationDate;
      if (!finalExpirationDate) {
        const docConfig = CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
        if (docConfig && docConfig.duree_mois) {
          const now = new Date();
          const expDate = new Date(now.setMonth(now.getMonth() + docConfig.duree_mois));
          finalExpirationDate = expDate.toISOString().split('T')[0];
        }
      }

      // Sauvegarder en base
      const { error: saveError } = await supabase
        .from('documents')
        .upsert({
          entity_type: 'chauffeur',
          entity_id: chauffeur.id,
          type: selectedDocumentType,
          nom: CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES]?.label || selectedDocumentType,
          url: urlData.publicUrl,
          date_expiration: finalExpirationDate || null,
          statut: 'valide',
          taille: selectedFile.size
        });

      if (saveError) throw saveError;

      toast({
        title: 'Succès',
        description: 'Document téléchargé avec succès'
      });

      // Reset form and close dialog
      setSelectedFile(null);
      setExpirationDate('');
      setShowUploadDialog(false);
      setSelectedDocumentType(null);
      loadDocuments();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès'
      });

      loadDocuments();
      onUpdate?.();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive'
      });
    }
  };

  const getDocumentStatus = (doc: any) => {
    if (!doc.date_expiration) return 'valide';
    
    const now = new Date();
    const expDate = new Date(doc.date_expiration);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expire';
    if (daysUntilExpiry <= 30) return 'a_renouveler';
    return 'valide';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expire':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'a_renouveler':
        return <Badge className="bg-orange-500 text-white">À renouveler</Badge>;
      default:
        return <Badge className="bg-green-500 text-white">Valide</Badge>;
    }
  };

  const handleFileSelect = (documentType: string) => {
    setSelectedDocumentType(documentType);
    setExpirationDate('');
    setSelectedFile(null);
    setShowUploadDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const existingDocuments = Object.keys(CHAUFFEUR_DOCUMENT_TYPES).map(type => {
    const config = CHAUFFEUR_DOCUMENT_TYPES[type as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
    const existingDoc = documents.find(doc => doc.type === type);
    
    return {
      type,
      config,
      document: existingDoc,
      status: existingDoc ? getDocumentStatus(existingDoc) : null
    };
  });

  if (loading) {
    return <div className="text-center py-4">Chargement des documents...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Documents de {chauffeur.prenom} {chauffeur.nom}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingDocuments.map(({ type, config, document, status }) => (
              <Card key={type} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{config.label}</h4>
                    {status && getStatusBadge(status)}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {config.duree_mois && (
                      <div>Durée: {config.duree_mois} mois</div>
                    )}
                  </div>

                  {document ? (
                    <div className="space-y-2">
                      {document.date_expiration && (
                        <div className="text-sm">
                          Expire le: {new Date(document.date_expiration).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileSelect(type)}
                          disabled={uploading === type}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleFileSelect(type)}
                      disabled={uploading === type}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading === type ? 'Téléchargement...' : 'Ajouter'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour l'upload avec date d'expiration */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDocumentType && CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES]?.label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Fichier *</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  Fichier sélectionné: {selectedFile.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="expiration-date">Date d'expiration</Label>
              <Input
                id="expiration-date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedDocumentType && CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES]?.duree_mois
                  ? `Durée par défaut: ${CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES].duree_mois} mois`
                  : 'Laissez vide si le document n\'expire pas'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploading !== null}
            >
              Annuler
            </Button>
            <Button
              onClick={uploadDocument}
              disabled={!selectedFile || uploading !== null}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
