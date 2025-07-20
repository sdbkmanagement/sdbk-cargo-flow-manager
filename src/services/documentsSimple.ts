
import { supabase } from '@/integrations/supabase/client';

export const documentsSimpleService = {
  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(documentData: any) {
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, documentData: any) {
    const { data, error } = await supabase
      .from('documents')
      .update(documentData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${entityType}/${entityId}/${documentType}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async deleteFile(url: string) {
    try {
      const fileName = url.split('/documents/')[1];
      if (fileName) {
        await supabase.storage
          .from('documents')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }
  }
};
