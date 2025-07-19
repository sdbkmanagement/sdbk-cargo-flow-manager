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
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DocumentVehicule = Database['public']['Tables']['documents_vehicules']['Row'];

interface DocumentManagerVehiculeProps {
  vehiculeId: string;
  vehiculeNumero: string;
}

const documentTypes = [
  { value: 'carte_grise_citerne_remorque', label: 'Carte grise Citerne/Remorque', requiresExpiration: false },
  { value: 'carte_grise_tracteur', label: 'Carte grise Tracteur', requiresExpiration: false },
  { value: 'carte_grise_porteur', label: 'Carte grise Porteur', requiresExpiration: false },
  { value: 'assurance_citerne_remorque', label: 'Assurance Citerne/Remorque', requiresExpiration: true },
  { value: 'assurance_tracteur', label: 'Assurance Tracteur', requiresExpiration: true },
  { value: 'assurance_porteur', label: 'Assurance Porteur', requiresExpiration: true },
  { value: 'autorisation_transport', label: 'Autorisation transport (carte rouge/bleu)', requiresExpiration: true },
  { value: 'conformite', label: 'Conformité', requiresExpiration: true },
  { value: 'controle_technique_annuel', label: 'Contrôle technique annuel', requiresExpiration: true },
  { value: 'controle_socotac', label: 'Contrôle SOCOTAC', requiresExpiration: true },
  { value: 'certificat_jaugeage', label: 'Certificat de jaugeage / Baremage', requiresExpiration: true },
  { value: 'attestation_extincteurs', label: 'Attestation contrôle extincteurs', requiresExpiration: true },
  { value: 'numero_police', label: 'Numéro de police', requiresExpiration: false }
];

export const DocumentManagerVehicule = ({ vehiculeId, vehiculeNumero }: DocumentManagerVehiculeProps) => {
  const [documents, setDocuments] = useState<DocumentVehicule[]>([]);
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
  }, [vehiculeId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

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

    const selectedDocType = documentTypes.find(dt => dt.value === documentType);
    if (selectedDocType?.requiresExpiration && !dateExpiration) {
      toast({
        title: 'Erreur',
        description: 'Une date d\'expiration est requise pour ce type de document',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      
      // Upload du fichier
      const fileName = `vehicule/${vehiculeId}/${documentType}_${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      // Calculer le statut du document
      let statut = 'valide';
      if (dateExpiration) {
        const expDate = new Date(dateExpiration);
        const today = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        
        if (expDate < today) {
          statut = 'expire';
        } else if (expDate <= oneMonthFromNow) {
          statut = 'a_renouveler';
        }
      }

      // Création de l'enregistrement en base
      const { error: insertError } = await supabase
        .from('documents_vehicules')
        .insert({
          vehicule_id: vehiculeId,
          nom: documentName,
          type: documentType,
          url: urlData.publicUrl,
          taille: selectedFile.size,
          date_delivrance: dateDelivrance || null,
          date_expiration: dateExpiration || null,
          commentaire: commentaire || null,
          statut: statut
        });

      if (insertError) {
        throw insertError;
      }

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

  const handleDelete = async (document: DocumentVehicule) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      // Supprimer le fichier du storage
      const pathParts = document.url.split('/documents/');
      const relativePath = pathParts[1] || document.url;
      
      await supabase.storage
        .from('documents')
        .remove([relativePath]);
      
      // Supprimer l'enregistrement de la base
      const { error } = await supabase
        .from('documents_vehicules')
        .delete()
        .eq('id', document.id);

      if (error) {
        throw error;
      }
      
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

  const handleView = (docItem: DocumentVehicule) => {
    window.open(docItem.url, '_blank');
  };

  const handleDownload = async (docItem: DocumentVehicule) => {
    try {
      // Récupérer le fichier depuis Supabase Storage
      const response = await fetch(docItem.url);
      
      if (!response.ok) {
        throw new Error('Impossible de télécharger le fichier');
      }
      
      // Convertir en blob
      const blob = await response.blob();
      
      // Créer un URL temporaire pour le blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = docItem.nom;
      
      // Ajouter le lien au DOM temporairement
      window.document.body.appendChild(link);
      
      // Déclencher le téléchargement
      link.click();
      
      // Nettoyer
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Téléchargement lancé',
        description: `Le document ${docItem.nom} est en cours de téléchargement`
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive'
      });
    }
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
            Documents du véhicule {vehiculeNumero}
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
              {documents.map((docItem) => (
                <TableRow key={docItem.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{docItem.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(docItem.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDocumentBadgeVariant(docItem.statut || 'valide')}>
                      {getStatusText(docItem.statut || 'valide')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {docItem.date_expiration ? (
                      <div className="text-sm">
                        <div>{new Date(docItem.date_expiration).toLocaleDateString('fr-FR')}</div>
                        {docItem.statut === 'expire' && (
                          <div className="text-destructive text-xs">Expiré</div>
                        )}
                        {docItem.statut === 'a_renouveler' && (
                          <div className="text-warning text-xs">À renouveler</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Aucune</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatFileSize(docItem.taille || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(docItem)}
                        title="Voir le document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(docItem)}
                        title="Télécharger le document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(docItem)}
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
