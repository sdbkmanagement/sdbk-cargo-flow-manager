
import { supabase } from '@/integrations/supabase/client';

export const documentsService = {
  // Récupérer les documents par entité
  async getByEntity(entityType: string, entityId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service documents getByEntity:', error);
      throw error;
    }
  },

  // Créer un nouveau document
  async create(documentData: any) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur service documents create:', error);
      throw error;
    }
  },

  // Mettre à jour un document
  async update(documentId: string, documentData: any) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...documentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur service documents update:', error);
      throw error;
    }
  },

  // Supprimer un document
  async delete(documentId: string) {
    try {
      // D'abord, récupérer le document pour obtenir l'URL du fichier
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('url')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du document:', fetchError);
        throw fetchError;
      }

      // Supprimer le fichier du storage si l'URL existe
      if (document?.url) {
        try {
          const urlParts = document.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `chauffeurs/${fileName}`;
          
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);

          if (storageError) {
            console.warn('Erreur lors de la suppression du fichier:', storageError);
            // On continue même si la suppression du fichier échoue
          }
        } catch (storageError) {
          console.warn('Erreur lors de la suppression du fichier:', storageError);
        }
      }

      // Supprimer l'enregistrement de la base de données
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        console.error('Erreur lors de la suppression du document:', deleteError);
        throw deleteError;
      }

      return true;
    } catch (error) {
      console.error('Erreur service documents delete:', error);
      throw error;
    }
  },

  // Upload d'un fichier
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${entityType}s/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur lors de l\'upload:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur service documents uploadFile:', error);
      throw error;
    }
  }
};
