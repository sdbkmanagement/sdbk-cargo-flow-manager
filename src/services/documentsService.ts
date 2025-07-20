
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export const documentsService = {
  // Récupérer les documents par entité
  async getByEntity(entityType: string, entityId: string): Promise<Document[]> {
    try {
      console.log('Chargement documents pour:', entityType, entityId)
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des documents:', error)
        throw error
      }

      console.log('Documents chargés:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale documents:', error)
      throw error
    }
  },

  // Créer un document
  async create(documentData: DocumentInsert): Promise<Document> {
    try {
      console.log('Création document avec données:', documentData)
      
      // S'assurer que les champs requis sont présents
      const dataToInsert = {
        ...documentData,
        taille: documentData.taille || 0,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) {
        console.error('Erreur création document:', error)
        throw error
      }

      console.log('Document créé avec succès:', data)
      return data
    } catch (error) {
      console.error('Erreur lors de la création du document:', error)
      throw error
    }
  },

  // Mettre à jour un document
  async update(id: string, documentData: DocumentUpdate): Promise<Document> {
    try {
      console.log('Mise à jour document:', id, documentData)
      
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...documentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur mise à jour document:', error)
        throw error
      }

      console.log('Document mis à jour avec succès:', data)
      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error)
      throw error
    }
  },

  // Supprimer un document
  async delete(id: string): Promise<void> {
    try {
      console.log('Suppression document:', id)
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erreur suppression document:', error)
        throw error
      }

      console.log('Document supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error)
      throw error
    }
  },

  // Upload d'un fichier
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    try {
      console.log('Upload fichier:', { 
        fileName: file.name, 
        size: file.size, 
        entityType, 
        entityId, 
        documentType 
      })

      // Validation du fichier
      if (!file) {
        throw new Error('Aucun fichier sélectionné')
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB max
        throw new Error('Le fichier est trop volumineux (max 10MB)')
      }

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const fileName = `${entityType}_${entityId}_${documentType}_${timestamp}_${randomString}.${fileExt}`
      const filePath = `${entityType}s/${fileName}`

      console.log('Upload vers:', filePath)

      // Upload du fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Erreur upload storage:', uploadError)
        throw new Error(`Erreur d'upload: ${uploadError.message}`)
      }

      console.log('Fichier uploadé avec succès:', uploadData)

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      if (!urlData?.publicUrl) {
        throw new Error('Impossible d\'obtenir l\'URL du fichier')
      }

      console.log('URL publique générée:', urlData.publicUrl)
      return urlData.publicUrl

    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  },

  // Supprimer un fichier du storage
  async deleteFile(url: string): Promise<void> {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = url.split('/storage/v1/object/public/documents/')
      if (urlParts.length < 2) {
        console.warn('URL de fichier invalide:', url)
        return
      }

      const filePath = urlParts[1]
      console.log('Suppression fichier storage:', filePath)

      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (error) {
        console.error('Erreur suppression fichier storage:', error)
        // Ne pas lancer d'erreur car le document peut être supprimé même si le fichier n'existe plus
      }

      console.log('Fichier supprimé du storage avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error)
      // Ne pas lancer d'erreur pour ne pas bloquer la suppression du document
    }
  }
}
