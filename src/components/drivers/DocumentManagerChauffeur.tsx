import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { alertesChauffeursService } from '@/services/alertesChauffeurs';

interface DocumentManagerChauffeurProps {
  chauffeurId: string;
  chauffeurNom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DocumentManagerChauffeur = ({ 
  chauffeurId, 
  chauffeurNom, 
  open, 
  onOpenChange,
  onSuccess 
}: DocumentManagerChauffeurProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocument, setNewDocument] = useState({
    nom: '',
    type: '',
    dateExpiration: '',
    file: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, chauffeurId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await alertesChauffeursService.getDocumentsChauffeur(chauffeurId);
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

  const handleUpload = async () => {
    // Vérifier qu'au moins un champ est rempli
    if (!newDocument.file && !newDocument.nom && !newDocument.dateExpiration) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins un champ",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let url = null;
      
      // Upload du fichier seulement s'il y en a un
      if (newDocument.file) {
        url = await alertesChauffeursService.uploadDocument(
          newDocument.file,
          chauffeurId,
          newDocument.type || 'autre'
        );
      }

      await alertesChauffeursService.saveDocument(chauffeurId, {
        nom: newDocument.nom || 'Document sans nom',
        type: newDocument.type || 'autre',
        url: url,
        dateExpiration: newDocument.dateExpiration || undefined
      });

      toast({
        title: "Succès",
        description: url ? "Document téléchargé avec succès" : "Informations sauvegardées avec succès",
      });

      setNewDocument({
        nom: '',
        type: '',
        dateExpiration: '',
        file: null
      });
      setShowUploadForm(false);
      loadDocuments();
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les informations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setLoading(true);
    try {
      await alertesChauffeursService.deleteDocument(documentId);
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
      loadDocuments();
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents - {chauffeurNom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bouton d'ajout */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              disabled={loading}
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
                    <Label htmlFor="nom">Nom du document</Label>
                    <Input
                      id="nom"
                      value={newDocument.nom}
                      onChange={(e) => setNewDocument({...newDocument, nom: e.target.value})}
                      placeholder="Ex: Permis de conduire"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={newDocument.type}
                      onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                      placeholder="Ex: permis"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateExpiration">Date d'expiration</Label>
                    <Input
                      id="dateExpiration"
                      type="date"
                      value={newDocument.dateExpiration}
                      onChange={(e) => setNewDocument({...newDocument, dateExpiration: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file">Fichier</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => setNewDocument({...newDocument, file: e.target.files?.[0] || null})}
                    />
                    <p className="text-xs text-gray-500">
                      Tous les champs sont optionnels
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleUpload} disabled={loading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
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
                <div className="text-center py-4">Chargement...</div>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
