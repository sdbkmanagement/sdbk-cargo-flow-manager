
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export interface DocumentFilter {
  entityType?: string;
  entityId?: string;
  type?: string;
  statut?: string;
}

export const documentService = {
  // Récupérer tous les documents avec filtres
  async getAll(filters?: DocumentFilter): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }

    return data || [];
  },

  // Récupérer les documents d'une entité spécifique
  async getByEntity(entityType: string, entityId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }

    return data || [];
  },

  // Créer un nouveau document
  async create(documentData: DocumentInsert): Promise<Document> {
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
  },

  // Mettre à jour un document
  async update(id: string, documentData: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(documentData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      throw error;
    }

    return data;
  },

  // Supprimer un document
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  },

  // Upload d'un fichier dans le storage
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    const fileName = `${entityType}/${entityId}/${documentType}_${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  // Supprimer un fichier du storage
  async deleteFile(filePath: string): Promise<void> {
    // Extraire le chemin relatif depuis l'URL complète
    const pathParts = filePath.split('/documents/');
    const relativePath = pathParts[1] || filePath;

    const { error } = await supabase.storage
      .from('documents')
      .remove([relativePath]);

    if (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  },

  // Vérifier les documents qui expirent bientôt
  async getExpiringDocuments(days: number = 30): Promise<Document[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .not('date_expiration', 'is', null)
      .lte('date_expiration', futureDate.toISOString().split('T')[0])
      .order('date_expiration', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des documents expirant:', error);
      throw error;
    }

    return data || [];
  },

  // Statistiques des documents - version simplifiée pour éviter la récursion
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    expiringCount: number;
  }> {
    const { data: allDocs, error } = await supabase
      .from('documents')
      .select('type, statut, date_expiration');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }

    const docs = allDocs || [];
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const stats = {
      total: docs.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      expiringCount: 0
    };

    docs.forEach(doc => {
      // Compter par type
      if (doc.type) {
        stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      }
      
      // Compter par statut
      if (doc.statut) {
        stats.byStatus[doc.statut] = (stats.byStatus[doc.statut] || 0) + 1;
      }
      
      // Compter les documents qui expirent
      if (doc.date_expiration) {
        const expirationDate = new Date(doc.date_expiration);
        if (expirationDate <= in30Days && expirationDate >= today) {
          stats.expiringCount++;
        }
      }
    });

    return stats;
  },

  // Récupérer les alertes de documents véhicules
  async getAlertesVehicules(): Promise<any[]> {
    const { data, error } = await supabase
      .from('alertes_documents_vehicules')
      .select('*')
      .order('date_expiration', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des alertes véhicules:', error);
      throw error;
    }

    return data || [];
  },

  // Récupérer les alertes de documents chauffeurs
  async getAlertesChauffeurs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('alertes_documents_chauffeurs')
      .select('*')
      .order('date_expiration', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des alertes chauffeurs:', error);
      throw error;
    }

    return data || [];
  }
};
