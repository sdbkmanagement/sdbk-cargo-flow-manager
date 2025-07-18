
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
  AlertTriangle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentManagerProps {
  chauffeurId: string;
  chauffeurNom: string;
}

const documentTypes = [
  { value: 'permis_conduire', label: 'Permis de conduire', requiresExpiration: true },
  { value: 'visite_medicale', label: 'Visite médicale', requiresExpiration: true },
  { value: 'formation_adr', label: 'Formation ADR', requiresExpiration: true },
  { value: 'formation_hse', label: 'Formation HSE', requiresExpiration: true },
  { value: 'formation_conduite', label: 'Formation conduite', requiresExpiration: true },
  { value: 'certificat_medical', label: 'Certificat médical', requiresExpiration: true },
  { value: 'carte_professionnelle', label: 'Carte professionnelle', requiresExpiration: true },
  { value: 'carte_identite', label: 'Carte d\'identité', requiresExpiration: true },
  { value: 'attestation_assurance', label: 'Attestation d\'assurance', requiresExpiration: false },
  { value: 'contrat_travail', label: 'Contrat de travail', requiresExpiration: false },
  { value: 'autre', label: 'Autre document', requiresExpiration: false }
];

export const DocumentManager = ({ chauffeurId, chauffeurNom }: DocumentManagerProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [dateDelivrance, setDateDelivrance] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [chauffeurId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getByEntity('chauffeur', chauffeurId);
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
      const fileUrl = await documentService.uploadFile(selectedFile, 'chauffeur', chauffeurId, documentType);
      
      // Création de l'enregistrement en base
      await documentService.create({
        entity_type: 'chauffeur',
        entity_id: chauffeurId,
        nom: documentName,
        type: documentType,
        url: fileUrl,
        taille: selectedFile.size,
        date_delivrance: dateDelivrance || null,
        date_expiration: dateExpiration || null,
        commentaire: commentaire || null
      });

      toast({
        title: 'Document ajouté',
        description: 'Le document a été téléchargé avec succès'
      });

      // Réinitialiser le formulaire
      setSelectedFile(null);
      setDocumentType('');
      setDocumentName('');
      setDateDelivrance('');
      setDateExpiration('');
      setCommentaire('');
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

  const getDocumentBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'expire':
        return 'destructive';
      case 'a_renouveler':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'expire':
        return 'Expiré';
      case 'a_renouveler':
        return 'À renouveler';
      default:
        return 'Valide';
    }
  };

  const selectedDocType = documentTypes.find(dt => dt.value === documentType);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            Documents de {chauffeurNom}
          </CardTitle>
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
                  <Label htmlFor="dateDelivrance">Date de délivrance</Label>
                  <Input
                    id="dateDelivrance"
                    type="date"
                    value={dateDelivrance}
                    onChange={(e) => setDateDelivrance(e.target.value)}
                  />
                </div>
                
                {selectedDocType?.requiresExpiration && (
                  <div>
                    <Label htmlFor="dateExpiration">Date d'expiration *</Label>
                    <Input
                      id="dateExpiration"
                      type="date"
                      value={dateExpiration}
                      onChange={(e) => setDateExpiration(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="commentaire">Commentaire</Label>
                  <Input
                    id="commentaire"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Commentaire optionnel"
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
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun document téléchargé</p>
            <p className="text-sm">Cliquez sur "Ajouter un document" pour commencer</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Taille</TableHead>
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(document.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDocumentBadgeVariant(document.statut || 'valide')}>
                      {getStatusText(document.statut || 'valide')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {document.date_expiration ? (
                      <div className="text-sm">
                        <div>{new Date(document.date_expiration).toLocaleDateString('fr-FR')}</div>
                        {document.statut === 'expire' && (
                          <div className="text-destructive text-xs">Expiré</div>
                        )}
                        {document.statut === 'a_renouveler' && (
                          <div className="text-warning text-xs">À renouveler</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Aucune</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatFileSize(document.taille)}
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
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(document)}
                        title="Supprimer le document"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
