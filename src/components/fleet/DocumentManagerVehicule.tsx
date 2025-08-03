
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  Trash2, 
  AlertTriangle,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentsSimpleService } from '@/services/documentsSimple';

interface DocumentManagerVehiculeProps {
  vehiculeId: string;
  vehiculeNumero: string;
}

interface Document {
  id: string;
  nom: string;
  type: string;
  url: string;
  date_expiration?: string;
  statut: string;
  commentaire?: string;
  created_at: string;
}

export const DocumentManagerVehicule = ({ vehiculeId, vehiculeNumero }: DocumentManagerVehiculeProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    nom: '',
    type: '',
    dateExpiration: '',
    commentaire: '',
    file: null as File | null
  });
  const { toast } = useToast();

  const documentTypes = [
    { value: 'carte_grise', label: 'Carte grise' },
    { value: 'assurance', label: 'Assurance' },
    { value: 'controle_technique', label: 'Contrôle technique' },
    { value: 'autorisation_transport', label: 'Autorisation transport' },
    { value: 'conformite', label: 'Conformité' },
    { value: 'controle_socotac', label: 'Contrôle SOCOTAC' },
    { value: 'certificat_jaugeage', label: 'Certificat de jaugeage' },
    { value: 'attestation_extincteurs', label: 'Attestation extincteurs' },
    { value: 'autre', label: 'Autre' }
  ];

  useEffect(() => {
    loadDocuments();
  }, [vehiculeId]);

  const loadDocuments = async () => {
    if (!vehiculeId) return;
    
    setLoading(true);
    try {
      console.log('Chargement documents pour véhicule:', vehiculeId);
      const data = await documentsSimpleService.getByEntity('vehicule', vehiculeId);
      console.log('Documents chargés:', data);
      setDocuments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Fichier sélectionné:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validation du fichier
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "Le fichier est trop volumineux (maximum 10MB)",
          variant: "destructive"
        });
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Erreur",
          description: "Type de fichier non autorisé. Utilisez: PDF, JPG, PNG, DOC, DOCX",
          variant: "destructive"
        });
        return;
      }

      setNewDocument(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    // Vérifier qu'au moins un champ significatif est rempli
    if (!newDocument.file && !newDocument.nom.trim() && !newDocument.dateExpiration) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins un champ (nom, date ou fichier)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('=== DEBUT UPLOAD DOCUMENT ===');
      console.log('Document à uploader:', {
        nom: newDocument.nom,
        type: newDocument.type,
        dateExpiration: newDocument.dateExpiration,
        commentaire: newDocument.commentaire,
        fichier: newDocument.file ? {
          name: newDocument.file.name,
          size: newDocument.file.size,
          type: newDocument.file.type
        } : 'Aucun fichier'
      });

      let url = null;
      
      // Upload du fichier seulement s'il y en a un
      if (newDocument.file) {
        url = await documentsSimpleService.uploadFile(
          newDocument.file,
          'vehicule',
          vehiculeId,
          newDocument.type
        );
        console.log('Fichier uploadé, URL:', url);
      }

      // Création du document en base
      const documentData = {
        entity_type: 'vehicule',
        entity_id: vehiculeId,
        nom: newDocument.nom.trim() || 'Document sans nom',
        type: newDocument.type || 'autre',
        url: url,
        date_expiration: newDocument.dateExpiration || null,
        commentaire: newDocument.commentaire?.trim() || null,
        taille: newDocument.file?.size || 0
      };

      console.log('Création document en base:', documentData);

      await documentsSimpleService.create(documentData);

      console.log('=== UPLOAD TERMINÉ AVEC SUCCÈS ===');

      toast({
        title: "Succès",
        description: url ? "Document téléchargé avec succès" : "Informations sauvegardées avec succès",
      });

      // Reset form
      setNewDocument({
        nom: '',
        type: '',
        dateExpiration: '',
        commentaire: '',
        file: null
      });
      setShowUploadForm(false);
      
      // Reload documents
      await loadDocuments();
      
    } catch (error: any) {
      console.error('=== ERREUR UPLOAD DOCUMENT ===');
      console.error('Erreur complète:', error);
      
      let errorMessage = 'Impossible de sauvegarder les informations';
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const documentToDelete = documents.find(doc => doc.id === documentId);
      if (documentToDelete?.url) {
        await documentsSimpleService.deleteFile(documentToDelete.url);
      }
      
      await documentsSimpleService.delete(documentId);
      
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
      
      await loadDocuments();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const getBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'expire':
        return 'destructive';
      case 'a_renouveler':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getBadgeText = (statut: string) => {
    switch (statut) {
      case 'expire':
        return 'Expiré';
      case 'a_renouveler':
        return 'À renouveler';
      default:
        return 'Valide';
    }
  };

  const resetForm = () => {
    setNewDocument({
      nom: '',
      type: '',
      dateExpiration: '',
      commentaire: '',
      file: null
    });
    setShowUploadForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Bouton d'ajout */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documents - {vehiculeNumero}</h3>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          disabled={loading || uploading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Formulaire d'upload */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de document</Label>
                <Select
                  value={newDocument.type}
                  onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du document</Label>
                <Input
                  id="nom"
                  value={newDocument.nom}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Carte grise tracteur"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateExpiration">Date d'expiration</Label>
                <Input
                  id="dateExpiration"
                  type="date"
                  value={newDocument.dateExpiration}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, dateExpiration: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Fichier</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
                {newDocument.file && (
                  <p className="text-sm text-green-600">
                    Fichier sélectionné: {newDocument.file.name} ({Math.round(newDocument.file.size / 1024)} KB)
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={newDocument.commentaire}
                onChange={(e) => setNewDocument(prev => ({ ...prev, commentaire: e.target.value }))}
                placeholder="Commentaire optionnel"
              />
            </div>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
              Tous les champs sont optionnels. Vous pouvez ajouter seulement une date d'expiration si nécessaire.
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents existants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              <p className="mt-2">Chargement des documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date d'expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>{doc.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>
                      {doc.date_expiration ? 
                        new Date(doc.date_expiration).toLocaleDateString('fr-FR') : 
                        'Aucune'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(doc.statut)}>
                        {getBadgeText(doc.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {doc.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            Voir
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          disabled={loading}
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
    </div>
  );
};
