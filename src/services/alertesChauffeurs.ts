
import { supabase } from '@/integrations/supabase/client';

export interface AlerteChauffeur {
  id: string;
  chauffeur_id: string;
  chauffeur_nom: string;
  document_nom: string;
  document_type: string;
  date_expiration: string;
  jours_restants: number;
  statut: string;
  niveau_alerte: string;
}

export const alertesChauffeursService = {
  async getAlertesChauffeurs(): Promise<AlerteChauffeur[]> {
    try {
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*')
        .order('jours_restants', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des alertes chauffeurs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale alertes chauffeurs:', error);
      return [];
    }
  },

  async getDocumentsChauffeur(chauffeurId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur')
        .eq('entity_id', chauffeurId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale documents chauffeur:', error);
      return [];
    }
  },

  async uploadDocument(file: File, chauffeurId: string, documentType: string): Promise<string> {
    try {
      const fileName = `chauffeurs/${chauffeurId}/${documentType}_${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload fichier:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  },

  async saveDocument(chauffeurId: string, documentData: {
    nom: string;
    type: string;
    url: string;
    dateExpiration?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          entity_id: chauffeurId,
          entity_type: 'chauffeur',
          nom: documentData.nom,
          type: documentData.type,
          url: documentData.url,
          date_expiration: documentData.dateExpiration || null,
          statut: documentData.dateExpiration ? 
            (new Date(documentData.dateExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'a_renouveler' : 'valide') : 
            'valide',
          taille: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  },

  async deleteDocument(documentId: string) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Erreur suppression document:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
};
