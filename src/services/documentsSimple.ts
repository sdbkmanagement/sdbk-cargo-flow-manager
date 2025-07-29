
import { supabase } from '@/integrations/supabase/client';

export const documentsSimpleService = {
  async getByEntity(entityType: string, entityId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents:', error);
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Erreur getByEntity:', error);
      throw error;
    }
  },

  async create(documentData: any) {
    try {
      console.log('Création document:', documentData);
      
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création document:', error);
        throw new Error(`Erreur lors de la création: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Erreur create:', error);
      throw error;
    }
  },

  async update(id: string, documentData: any) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(documentData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour document:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Erreur update:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression document:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur delete:', error);
      throw error;
    }
  },

  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    try {
      console.log('Upload fichier:', { fileName: file.name, size: file.size, entityType, entityId, documentType });
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Le fichier est trop volumineux (maximum 10MB)');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(fileExt)) {
        throw new Error('Type de fichier non supporté. Utilisez: PDF, JPG, PNG, DOC, DOCX');
      }

      const fileName = `${entityType}/${entityId}/${documentType}/${Date.now()}.${fileExt}`;
      
      console.log('Nom fichier:', fileName);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload storage:', error);
        throw new Error(`Erreur upload: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      console.log('URL publique:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Erreur uploadFile:', error);
      throw error;
    }
  },

  async deleteFile(url: string) {
    try {
      const fileName = url.split('/documents/')[1];
      if (fileName) {
        console.log('Suppression fichier:', fileName);
        const { error } = await supabase.storage
          .from('documents')
          .remove([fileName]);
        
        if (error) {
          console.error('Erreur suppression fichier:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }
  }
};
