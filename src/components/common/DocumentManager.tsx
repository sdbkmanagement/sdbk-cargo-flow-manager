
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentManagerProps {
  entityType: string;
  entityId: string;
  entityName: string;
  documentTypes?: Array<{ value: string; label: string }>;
  readonly?: boolean;
}

const defaultDocumentTypes = [
  { value: 'contrat', label: 'Contrat' },
  { value: 'facture', label: 'Facture' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'autorisation', label: 'Autorisation' },
  { value: 'autre', label: 'Autre document' }
];

export const DocumentManager = ({ 
  entityType, 
  entityId, 
  entityName, 
  documentTypes = defaultDocumentTypes,
  readonly = false 
}: DocumentManagerProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getByEntity(entityType, entityId);
      setDocuments(data);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !documentName) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      
      // Upload du fichier
      const fileUrl = await documentService.uploadFile(selectedFile, entityType, entityId, documentType);
      
      // Création de l'enregistrement en base
      await documentService.create({
        entity_type: entityType,
        entity_id: entityId,
        nom: documentName,
        type: documentType,
        url: fileUrl,
        taille: selectedFile.size,
        date_expiration: expirationDate || null,
        statut: 'valide'
      });

      toast({
        title: 'Document ajouté',
        description: 'Le document a été téléchargé avec succès'
      });

      // Réinitialiser le formulaire
      setSelectedFile(null);
      setDocumentType('');
      setDocumentName('');
      setExpirationDate('');
      setShowUploadDialog(false);
      
      // Recharger la liste
      loadDocuments();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      // Supprimer le fichier du storage
      await documentService.deleteFile(document.url);
      
      // Supprimer l'enregistrement de la base
      await documentService.delete(document.id);
      
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès'
      });
      
      loadDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive'
      });
    }
  };

  const handleView = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const handleDownload = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.nom;
    link.click();
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiring = (document: Document) => {
    if (!document.date_expiration) return false;
    const expirationDate = new Date(document.date_expiration);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (document: Document) => {
    if (!document.date_expiration) return false;
    return new Date(document.date_expiration) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Documents de {entityName}
          </CardTitle>
          {!readonly && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Télécharger un document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="documentType">Type de document *</Label>
                    <select
                      id="documentType"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      required
                    >
                      <option value="">Sélectionner un type</option>
                      {documentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="documentName">Nom du document *</Label>
                    <Input
                      id="documentName"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Nom du document"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expirationDate">Date d'expiration</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="file">Fichier *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      required
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun document téléchargé</p>
            {!readonly && (
              <p className="text-sm">Cliquez sur "Ajouter un document" pour commencer</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{document.nom}</span>
                      {isExpired(document) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" title="Document expiré" />
                      )}
                      {isExpiring(document) && !isExpired(document) && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" title="Document expire bientôt" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(document.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatFileSize(document.taille)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">
                        {new Date(document.created_at!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {document.date_expiration ? (
                      <span className={`text-sm ${
                        isExpired(document) ? 'text-red-600 font-medium' :
                        isExpiring(document) ? 'text-orange-600 font-medium' :
                        'text-gray-600'
                      }`}>
                        {new Date(document.date_expiration).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Aucune</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(document)}
                        title="Voir le document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(document)}
                        title="Télécharger le document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {!readonly && (
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(document)}
                          title="Supprimer le document"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
