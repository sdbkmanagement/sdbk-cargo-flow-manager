
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export const documentsService = {
  // Récupérer les documents d'un chauffeur
  async getByChauffeursId(chauffeurId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('chauffeur_id', chauffeurId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }

    return data || []
  },

  // Créer un nouveau document
  async create(documentData: DocumentInsert): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du document:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un document
  async update(id: string, documentData: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(documentData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du document:', error)
      throw error
    }

    return data
  },

  // Supprimer un document
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du document:', error)
      throw error
    }
  },

  // Upload d'un fichier dans le storage
  async uploadFile(file: File, chauffeurId: string, documentType: string): Promise<string> {
    const fileName = `${chauffeurId}/${documentType}_${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  },

  // Supprimer un fichier du storage
  async deleteFile(filePath: string): Promise<void> {
    // Extraire le chemin relatif depuis l'URL complète
    const pathParts = filePath.split('/documents/')
    const relativePath = pathParts[1] || filePath

    const { error } = await supabase.storage
      .from('documents')
      .remove([relativePath])

    if (error) {
      console.error('Erreur lors de la suppression du fichier:', error)
      throw error
    }
  },

  // Vérifier les documents qui expirent bientôt
  async getExpiringDocuments(days: number = 30): Promise<Document[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .lte('created_at', futureDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des documents expirant:', error)
      throw error
    }

    return data || []
  }
}
