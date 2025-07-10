import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { documentsAdministratifsService } from '@/services/documentsAdministratifs';
import { 
  FileText, 
  Upload, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Plus,
  Trash2
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type DocumentVehicule = Database['public']['Tables']['documents_vehicules']['Row'];

interface DocumentsAdministratifsManagerProps {
  vehicule: Vehicule;
  userRole: string;
  userName: string;
  userId: string;
  onClose: () => void;
}

export const DocumentsAdministratifsManager = ({
  vehicule,
  userRole,
  userName,
  userId,
  onClose
}: DocumentsAdministratifsManagerProps) => {
  const [activeDocumentType, setActiveDocumentType] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState({
    nom: '',
    date_expiration: '',
    date_emission: '',
    organisme_emetteur: '',
    numero_document: '',
    alerte_expiration_jours: 30
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les documents du véhicule
  const { data: documentsParType = {}, isLoading } = useQuery({
    queryKey: ['documents-vehicule', vehicule.id],
    queryFn: () => documentsAdministratifsService.getDocumentsByVehicle(vehicule.id),
  });

  // Récupérer les alertes du véhicule
  const { data: alertes = [] } = useQuery({
    queryKey: ['alertes-documents', vehicule.id],
    queryFn: () => documentsAdministratifsService.getAlertesVehicule(vehicule.id),
  });

  // Récupérer la conformité documentaire
  const { data: conformite } = useQuery({
    queryKey: ['conformite-documentaire', vehicule.id],
    queryFn: () => documentsAdministratifsService.verifierConformiteDocumentaire(vehicule.id),
  });

  // Mutation pour créer un document
  const createDocumentMutation = useMutation({
    mutationFn: documentsAdministratifsService.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-vehicule'] });
      queryClient.invalidateQueries({ queryKey: ['alertes-documents'] });
      queryClient.invalidateQueries({ queryKey: ['conformite-documentaire'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté avec succès.',
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout du document.',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour valider un document
  const validateDocumentMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      documentsAdministratifsService.validerDocument(id, userName, userId, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-vehicule'] });
      queryClient.invalidateQueries({ queryKey: ['alertes-documents'] });
      queryClient.invalidateQueries({ queryKey: ['conformite-documentaire'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Document validé',
        description: 'Le document a été validé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la validation.',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour supprimer un document
  const deleteDocumentMutation = useMutation({
    mutationFn: documentsAdministratifsService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-vehicule'] });
      queryClient.invalidateQueries({ queryKey: ['alertes-documents'] });
      queryClient.invalidateQueries({ queryKey: ['conformite-documentaire'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setDocumentData({
      nom: '',
      date_expiration: '',
      date_emission: '',
      organisme_emetteur: '',
      numero_document: '',
      alerte_expiration_jours: 30
    });
    setUploadingFile(null);
    setActiveDocumentType('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setDocumentData(prev => ({ ...prev, nom: file.name }));
    }
  };

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeDocumentType || !uploadingFile) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner un type de document et un fichier.',
        variant: 'destructive',
      });
      return;
    }

    // Ici, nous devrons uploader le fichier vers Supabase Storage
    // Pour l'instant, nous utilisons une URL temporaire
    const documentToCreate = {
      vehicule_id: vehicule.id,
      type: activeDocumentType,
      nom: documentData.nom,
      url: `documents/${vehicule.id}/${uploadingFile.name}`, // URL temporaire
      taille: uploadingFile.size,
      date_expiration: documentData.date_expiration ? new Date(documentData.date_expiration).toISOString().split('T')[0] : null,
      date_emission: documentData.date_emission ? new Date(documentData.date_emission).toISOString().split('T')[0] : null,
      organisme_emetteur: documentData.organisme_emetteur || null,
      numero_document: documentData.numero_document || null,
      alerte_expiration_jours: documentData.alerte_expiration_jours,
      statut: 'en_attente'
    };

    createDocumentMutation.mutate(documentToCreate);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'expire': return 'bg-red-100 text-red-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlerteColor = (niveau: string) => {
    switch (niveau) {
      case 'Document expiré': return 'text-red-600';
      case 'Document expire bientôt': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Vérifier les permissions
  const peutModifier = userRole === 'administratif' || userRole === 'admin';
  const peutVoir = true; // Tous les rôles peuvent voir les documents

  if (!peutVoir) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
            <Button onClick={onClose} className="mt-4 w-full">
              Fermer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents administratifs
              </CardTitle>
              <CardDescription>
                Véhicule: {vehicule.numero} - {vehicule.immatriculation || 'Immatriculation manquante'}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Indicateur de conformité */}
            {conformite && (
              <Alert className={conformite.conforme ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {conformite.conforme ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={conformite.conforme ? 'text-green-700' : 'text-red-700'}>
                    {conformite.conforme 
                      ? 'Tous les documents requis sont présents et valides.'
                      : `Documents manquants: ${conformite.documentsManquants.length}, Documents expirés: ${conformite.documentsExpires.length}`
                    }
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Alertes de documents */}
            {alertes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Alertes documents
                </h3>
                <div className="grid gap-2">
                  {alertes.map((alerte) => (
                    <Alert key={alerte.document_id} className="border-yellow-200 bg-yellow-50">
                      <AlertDescription className={getAlerteColor(alerte.niveau_alerte!)}>
                        <span className="font-medium">{alerte.document_nom}</span> - {alerte.niveau_alerte}
                        {alerte.date_expiration && (
                          <span className="text-sm"> (expire le {formatDate(alerte.date_expiration)})</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <Tabs defaultValue="view" className="w-full">
              <TabsList>
                <TabsTrigger value="view">Consulter les documents</TabsTrigger>
                {peutModifier && <TabsTrigger value="add">Ajouter un document</TabsTrigger>}
              </TabsList>

              <TabsContent value="view" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p>Chargement des documents...</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {documentsAdministratifsService.DOCUMENTS_REQUIS.map((typeDoc) => {
                      const documents = documentsParType[typeDoc.code] || [];
                      const documentValide = documents.find(doc => 
                        doc.statut === 'valide' && 
                        (doc.date_expiration === null || new Date(doc.date_expiration) >= new Date())
                      );

                      return (
                        <Card key={typeDoc.code} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {typeDoc.libelle}
                                {typeDoc.obligatoire && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                {documentValide ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : documents.length > 0 ? (
                                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            {documents.length === 0 ? (
                              <p className="text-muted-foreground text-sm">Aucun document de ce type</p>
                            ) : (
                              <div className="space-y-3">
                                {documents.map((document) => (
                                  <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{document.nom}</span>
                                        <Badge className={getStatutColor(document.statut)}>
                                          {document.statut}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                        {document.numero_document && (
                                          <p>N° {document.numero_document}</p>
                                        )}
                                        {document.organisme_emetteur && (
                                          <p>Émetteur: {document.organisme_emetteur}</p>
                                        )}
                                        <p>Expiration: {formatDate(document.date_expiration)}</p>
                                        {document.validateur_nom && document.date_validation && (
                                          <p>Validé par {document.validateur_nom} le {formatDate(document.date_validation)}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {peutModifier && document.statut === 'en_attente' && (
                                        <Button 
                                          size="sm"
                                          onClick={() => validateDocumentMutation.mutate({ id: document.id })}
                                          disabled={validateDocumentMutation.isPending}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {peutModifier && (
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => deleteDocumentMutation.mutate(document.id)}
                                          disabled={deleteDocumentMutation.isPending}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {peutModifier && (
                <TabsContent value="add" className="space-y-4">
                  <form onSubmit={handleSubmitDocument} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type_document">Type de document *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={activeDocumentType}
                          onChange={(e) => setActiveDocumentType(e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un type</option>
                          {documentsAdministratifsService.DOCUMENTS_REQUIS.map((type) => (
                            <option key={type.code} value={type.code}>
                              {type.libelle}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fichier">Fichier *</Label>
                        <Input
                          id="fichier"
                          type="file"
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numero_document">Numéro du document</Label>
                        <Input
                          id="numero_document"
                          value={documentData.numero_document}
                          onChange={(e) => setDocumentData(prev => ({ ...prev, numero_document: e.target.value }))}
                          placeholder="Ex: AB123456"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organisme_emetteur">Organisme émetteur</Label>
                        <Input
                          id="organisme_emetteur"
                          value={documentData.organisme_emetteur}
                          onChange={(e) => setDocumentData(prev => ({ ...prev, organisme_emetteur: e.target.value }))}
                          placeholder="Ex: Préfecture, Assureur..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_emission">Date d'émission</Label>
                        <Input
                          id="date_emission"
                          type="date"
                          value={documentData.date_emission}
                          onChange={(e) => setDocumentData(prev => ({ ...prev, date_emission: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_expiration">Date d'expiration</Label>
                        <Input
                          id="date_expiration"
                          type="date"
                          value={documentData.date_expiration}
                          onChange={(e) => setDocumentData(prev => ({ ...prev, date_expiration: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        disabled={createDocumentMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {createDocumentMutation.isPending ? 'Ajout en cours...' : 'Ajouter le document'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};