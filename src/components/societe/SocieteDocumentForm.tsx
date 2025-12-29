import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  X, 
  Save, 
  Plus,
  File,
  Image,
  Trash2,
  Camera
} from 'lucide-react';
import { documentsSocieteService, DocumentSociete, DocumentSocieteCategorie, Societe, DocumentSocieteFichier } from '@/services/documentsSociete';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SocieteDocumentFormProps {
  documentId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPES_DOCUMENTS = [
  'Statuts',
  'Registre de commerce',
  'Patente',
  'ICE',
  'IF',
  'CNSS',
  'Attestation fiscale',
  'Certificat de conformité',
  'Licence de transport',
  'Agrément',
  'Contrat',
  'Police d\'assurance',
  'Attestation d\'assurance',
  'Procès-verbal',
  'Rapport d\'audit',
  'Autre'
];

export const SocieteDocumentForm: React.FC<SocieteDocumentFormProps> = ({ 
  documentId, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!documentId);
  const [categories, setCategories] = useState<DocumentSocieteCategorie[]>([]);
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [existingFichiers, setExistingFichiers] = useState<DocumentSocieteFichier[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [motifModification, setMotifModification] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    type_document: '',
    categorie_id: '',
    societe_id: '',
    description: '',
    date_delivrance: '',
    date_expiration: '',
    autorite_emettrice: '',
    numero_reference: '',
    commentaires: ''
  });

  useEffect(() => {
    loadInitialData();
  }, [documentId]);

  const loadInitialData = async () => {
    try {
      const [catsData, societesData] = await Promise.all([
        documentsSocieteService.getCategories(),
        documentsSocieteService.getSocietes()
      ]);
      setCategories(catsData);
      setSocietes(societesData);

      // Si société par défaut existe, la sélectionner
      if (societesData.length > 0 && !documentId) {
        setFormData(prev => ({ ...prev, societe_id: societesData[0].id }));
      }

      if (documentId) {
        await loadDocument(documentId);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadDocument = async (id: string) => {
    try {
      const doc = await documentsSocieteService.getDocument(id);
      if (doc) {
        setFormData({
          nom: doc.nom || '',
          type_document: doc.type_document || '',
          categorie_id: doc.categorie_id || '',
          societe_id: doc.societe_id || '',
          description: doc.description || '',
          date_delivrance: doc.date_delivrance || '',
          date_expiration: doc.date_expiration || '',
          autorite_emettrice: doc.autorite_emettrice || '',
          numero_reference: doc.numero_reference || '',
          commentaires: doc.commentaires || ''
        });
        setExistingFichiers(doc.fichiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le document',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse la limite de 10MB`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });
    setNewFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = async (fichierId: string) => {
    try {
      await documentsSocieteService.deleteFichier(fichierId);
      setExistingFichiers(prev => prev.filter(f => f.id !== fichierId));
      toast({
        title: 'Fichier supprimé',
        description: 'Le fichier a été supprimé'
      });
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le fichier',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.type_document) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le nom et le type de document',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      let savedDocument: DocumentSociete;

      if (documentId) {
        savedDocument = await documentsSocieteService.updateDocument(
          documentId,
          formData,
          user?.id,
          motifModification || 'Mise à jour'
        );
      } else {
        savedDocument = await documentsSocieteService.createDocument(formData, user?.id);
      }

      // Upload nouveaux fichiers
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          await documentsSocieteService.uploadFile(
            newFiles[i],
            savedDocument.id,
            existingFichiers.length + i
          );
        }
      }

      toast({
        title: documentId ? 'Document modifié' : 'Document créé',
        description: `Le document "${formData.nom}" a été enregistré`
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le document',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: File | DocumentSocieteFichier) => {
    const type = 'type_mime' in file ? file.type_mime : (file as File).type;
    if (type?.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {documentId ? 'Modifier le document' : 'Nouveau document'}
            </CardTitle>
            <CardDescription>
              {documentId 
                ? 'Modifiez les informations du document existant'
                : 'Créez un nouveau document pour la société'
              }
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du document *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                placeholder="Ex: Registre de commerce 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_document">Type de document *</Label>
              <Select 
                value={formData.type_document} 
                onValueChange={(value) => handleInputChange('type_document', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_DOCUMENTS.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie_id">Catégorie</Label>
              <Select 
                value={formData.categorie_id} 
                onValueChange={(value) => handleInputChange('categorie_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="societe_id">Société</Label>
              <Select 
                value={formData.societe_id} 
                onValueChange={(value) => handleInputChange('societe_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une société" />
                </SelectTrigger>
                <SelectContent>
                  {societes.map(soc => (
                    <SelectItem key={soc.id} value={soc.id}>{soc.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates et références */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_delivrance">Date de délivrance</Label>
              <Input
                id="date_delivrance"
                type="date"
                value={formData.date_delivrance}
                onChange={(e) => handleInputChange('date_delivrance', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_expiration">Date d'expiration</Label>
              <Input
                id="date_expiration"
                type="date"
                value={formData.date_expiration}
                onChange={(e) => handleInputChange('date_expiration', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_reference">N° de référence</Label>
              <Input
                id="numero_reference"
                value={formData.numero_reference}
                onChange={(e) => handleInputChange('numero_reference', e.target.value)}
                placeholder="Ex: RC-12345"
              />
            </div>
          </div>

          {/* Autorité émettrice */}
          <div className="space-y-2">
            <Label htmlFor="autorite_emettrice">Autorité émettrice</Label>
            <Input
              id="autorite_emettrice"
              value={formData.autorite_emettrice}
              onChange={(e) => handleInputChange('autorite_emettrice', e.target.value)}
              placeholder="Ex: Tribunal de commerce de Casablanca"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description du document..."
              rows={2}
            />
          </div>

          {/* Fichiers */}
          <div className="space-y-4">
            <Label>Fichiers attachés</Label>
            
            {/* Fichiers existants */}
            {existingFichiers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fichiers existants :</p>
                <div className="flex flex-wrap gap-2">
                  {existingFichiers.map(fichier => (
                    <div 
                      key={fichier.id}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                    >
                      {getFileIcon(fichier)}
                      <a 
                        href={fichier.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {fichier.nom_original || fichier.nom_fichier}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveExistingFile(fichier.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nouveaux fichiers */}
            {newFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nouveaux fichiers à ajouter :</p>
                <div className="flex flex-wrap gap-2">
                  {newFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg"
                    >
                      {getFileIcon(file)}
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveNewFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boutons d'ajout */}
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileAdd}
                />
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer fichier
                  </span>
                </Button>
              </label>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileAdd}
                />
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Scanner / Photo
                  </span>
                </Button>
              </label>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, Word, Images (max 10MB par fichier)
            </p>
          </div>

          {/* Commentaires */}
          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires / Observations</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => handleInputChange('commentaires', e.target.value)}
              placeholder="Notes ou observations..."
              rows={2}
            />
          </div>

          {/* Motif de modification (si édition) */}
          {documentId && (
            <div className="space-y-2">
              <Label htmlFor="motif">Motif de la modification</Label>
              <Input
                id="motif"
                value={motifModification}
                onChange={(e) => setMotifModification(e.target.value)}
                placeholder="Ex: Mise à jour suite au renouvellement"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {documentId ? 'Mettre à jour' : 'Créer le document'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
