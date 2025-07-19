
import { supabase } from '@/integrations/supabase/client';

export interface DocumentCreate {
  entity_type: string;
  entity_id: string;
  nom: string;
  type: string;
  url: string;
  taille: number;
  date_delivrance?: string | null;
  date_expiration?: string | null;
  statut?: string;
  commentaire?: string;
}

export const documentsService = {
  // Créer un document
  async create(documentData: DocumentCreate) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw error;
    }
  },

  // Récupérer les documents d'une entité
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
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  },

  // Upload d'un fichier vers Supabase Storage
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}/${entityId}/${documentType}_${Date.now()}.${fileExt}`;

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
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  },

  // Supprimer un document
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression document:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  },

  // Mettre à jour un document
  async update(id: string, updateData: Partial<DocumentCreate>) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      throw error;
    }
  },

  // Récupérer les alertes de documents expirants
  async getExpiringDocuments(entityType: string, daysBeforeExpiry: number = 30) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + daysBeforeExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('Erreur récupération documents expirants:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents expirants:', error);
      throw error;
    }
  }
};
