
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row']
type ChauffeurInsert = Database['public']['Tables']['chauffeurs']['Insert']
type ChauffeurUpdate = Database['public']['Tables']['chauffeurs']['Update']

export const chauffeursService = {
  // Récupérer tous les chauffeurs
  async getAll(): Promise<Chauffeur[]> {
    const { data, error } = await supabase
      .from('chauffeurs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des chauffeurs:', error)
      throw error
    }

    return data || []
  },

  // Créer un nouveau chauffeur
  async create(chauffeurData: ChauffeurInsert): Promise<Chauffeur> {
    const { data, error } = await supabase
      .from('chauffeurs')
      .insert([chauffeurData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du chauffeur:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un chauffeur
  async update(id: string, chauffeurData: ChauffeurUpdate): Promise<Chauffeur> {
    const { data, error } = await supabase
      .from('chauffeurs')
      .update({ ...chauffeurData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du chauffeur:', error)
      throw error
    }

    return data
  },

  // Supprimer un chauffeur
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('chauffeurs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du chauffeur:', error)
      throw error
    }
  },

  // Upload d'un fichier
  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  },

  // Enregistrer les documents uploadés dans l'étape documents
  async saveDocuments(chauffeurId: string, documents: any[]): Promise<void> {
    if (documents.length === 0) return;

    const documentRecords = documents.map(doc => ({
      chauffeur_id: chauffeurId,
      nom: doc.name,
      type: doc.type || 'autre',
      url: doc.url,
      taille: doc.size
    }));

    const { error } = await supabase
      .from('documents')
      .insert(documentRecords);

    if (error) {
      console.error('Erreur lors de la sauvegarde des documents:', error);
      throw error;
    }
  }
}
