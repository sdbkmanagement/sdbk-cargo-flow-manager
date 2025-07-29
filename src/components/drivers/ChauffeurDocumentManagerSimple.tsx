
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const uploadDocument = async (file: File, documentType: string) => {
    try {
      setUploading(documentType);
      
      // Upload du fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${chauffeur.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Calculer la date d'expiration si nécessaire
      let dateExpiration = null;
      const docConfig = CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
      if (docConfig && docConfig.duree_mois) {
        const now = new Date();
        dateExpiration = new Date(now.setMonth(now.getMonth() + docConfig.duree_mois)).toISOString().split('T')[0];
      }

      // Sauvegarder en base
      const { error: saveError } = await supabase
        .from('documents')
        .upsert({
          entity_type: 'chauffeur',
          entity_id: chauffeur.id,
          type: documentType,
          nom: docConfig?.label || documentType,
          url: urlData.publicUrl,
          date_expiration: dateExpiration,
          statut: 'valide'
        });

      if (saveError) throw saveError;

      toast({
        title: 'Succès',
        description: 'Document téléchargé avec succès'
      });

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
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) uploadDocument(file, type);
                          };
                          input.click();
                        }}
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
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) uploadDocument(file, type);
                      };
                      input.click();
                    }}
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
  );
};
