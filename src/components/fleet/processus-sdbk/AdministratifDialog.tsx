import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processusSDBKService } from '@/services/processus-sdbk';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface AdministratifDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculeId: string;
  onSuccess: () => void;
}

interface Document {
  id: string;
  nom: string;
  type: string;
  date_expiration: string | null;
  jours_avant_expiration: number | null;
  statut: string;
}

export const AdministratifDialog = ({ open, onOpenChange, vehiculeId, onSuccess }: AdministratifDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsOK, setDocumentsOK] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, vehiculeId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_id', vehiculeId)
        .eq('entity_type', 'vehicule')
        .order('type');

      if (error) throw error;
      setDocuments(data || []);
      
      // Initialiser les états de validation
      const initialState: Record<string, boolean> = {};
      data?.forEach(doc => {
        initialState[doc.id] = doc.statut === 'valide' && (doc.jours_avant_expiration || 0) > 0;
      });
      setDocumentsOK(initialState);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive'
      });
    }
  };

  const getDocumentStatus = (doc: Document) => {
    if (!doc.date_expiration) {
      return { type: 'info', text: 'Pas d\'expiration' };
    }
    
    const jours = doc.jours_avant_expiration || 0;
    if (jours < 0) {
      return { type: 'error', text: 'Expiré' };
    } else if (jours <= 7) {
      return { type: 'warning', text: `Expire dans ${jours}j` };
    } else if (jours <= 30) {
      return { type: 'warning', text: `Expire dans ${jours}j` };
    } else {
      return { type: 'success', text: `Valide ${jours}j` };
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Vérifier si tous les documents obligatoires sont OK
      const documentsKO = documents.filter(doc => !documentsOK[doc.id]);
      const conforme = documentsKO.length === 0;

      await processusSDBKService.terminerVerificationAdministrative(vehiculeId, conforme);
      
      if (!conforme) {
        toast({
          title: 'Vérification terminée',
          description: `Véhicule bloqué - ${documentsKO.length} document(s) non conforme(s)`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Vérification réussie',
          description: 'Tous les documents sont conformes'
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de terminer la vérification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const tousDocumentsOK = documents.length > 0 && documents.every(doc => documentsOK[doc.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vérification Administrative des Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Vérifiez que tous les documents du véhicule sont valides et à jour.
          </div>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun document trouvé pour ce véhicule</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ajoutez les documents requis avant de continuer
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => {
                const status = getDocumentStatus(doc);
                return (
                  <Card key={doc.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{doc.nom}</CardTitle>
                        <Badge 
                          className={
                            status.type === 'error' ? 'bg-red-100 text-red-800' :
                            status.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            status.type === 'success' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {status.text}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Type: {doc.type}</p>
                          {doc.date_expiration && (
                            <p className="text-sm text-muted-foreground">
                              Expire le: {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`doc-${doc.id}`}
                            checked={documentsOK[doc.id] || false}
                            onCheckedChange={(checked) => 
                              setDocumentsOK(prev => ({ ...prev, [doc.id]: !!checked }))
                            }
                          />
                          <label 
                            htmlFor={`doc-${doc.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Document conforme
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Résumé */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {tousDocumentsOK ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Tous les documents sont conformes
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-600 font-medium">
                      {documents.filter(doc => !documentsOK[doc.id]).length} document(s) non conforme(s)
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || documents.length === 0}
              className={tousDocumentsOK ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              {loading ? 'Validation...' : 
               tousDocumentsOK ? 'Valider et Continuer' : 'Marquer Non Conforme'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};