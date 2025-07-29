
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChauffeurDetailView } from './ChauffeurDetailView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChauffeurDetailDialogProps {
  chauffeur: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChauffeurDetailDialog = ({ chauffeur, open, onOpenChange }: ChauffeurDetailDialogProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadDocuments = async () => {
    if (!chauffeur?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_id', chauffeur.id)
        .eq('entity_type', 'chauffeur')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents",
          variant: "destructive"
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && chauffeur) {
      loadDocuments();
    }
  }, [open, chauffeur]);

  if (!chauffeur) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {chauffeur.prenom} {chauffeur.nom}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="informations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="statut">Statut</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="permis">Permis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="informations" className="mt-6">
            <ChauffeurDetailView 
              chauffeur={chauffeur} 
              documents={documents}
              onRefresh={loadDocuments}
            />
          </TabsContent>
          
          <TabsContent value="statut" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              Gestion du statut à venir
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <ChauffeurDetailView 
              chauffeur={chauffeur} 
              documents={documents}
              onRefresh={loadDocuments}
            />
          </TabsContent>
          
          <TabsContent value="permis" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              Gestion des permis à venir
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
