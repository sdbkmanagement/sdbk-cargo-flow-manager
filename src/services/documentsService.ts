
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

  // Upload d'un fichier avec gestion d'erreurs améliorée
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    try {
      console.log('Upload fichier:', { 
        fileName: file.name, 
        size: file.size, 
        type: file.type,
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

      // Types de fichiers acceptés
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Type de fichier non supporté: ${file.type}. Types acceptés: PDF, JPG, PNG, GIF, DOC, DOCX`)
      }

      // Générer un nom de fichier unique et sécurisé
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Nettoyer le nom de fichier
      const fileName = `${entityType}_${entityId}_${documentType}_${timestamp}_${randomString}.${fileExt}`
      const filePath = `${entityType}s/${fileName}`

      console.log('Upload vers:', filePath)

      // Créer un nouveau blob pour s'assurer que le fichier est valide
      const fileBuffer = await file.arrayBuffer()
      const blob = new Blob([fileBuffer], { type: file.type })

      // Upload du fichier avec retry logic
      let uploadError = null
      let uploadData = null
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Tentative d'upload ${attempt}/3`)
          
          const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            })

          if (error) {
            uploadError = error
            console.warn(`Tentative ${attempt} échouée:`, error)
            
            if (attempt < 3) {
              // Attendre avant de réessayer
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
          } else {
            uploadData = data
            uploadError = null
            break
          }
        } catch (err) {
          uploadError = err
          console.warn(`Tentative ${attempt} échouée avec exception:`, err)
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      if (uploadError || !uploadData) {
        console.error('Erreur upload storage après 3 tentatives:', uploadError)
        throw new Error(`Erreur d'upload: ${uploadError?.message || 'Upload échoué'}`)
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

  // Supprimer un fichier du storage avec gestion d'erreurs
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
      } else {
        console.log('Fichier supprimé du storage avec succès')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error)
      // Ne pas lancer d'erreur pour ne pas bloquer la suppression du document
    }
  },

  // Vérifier si un fichier existe dans le storage
  async fileExists(url: string): Promise<boolean> {
    try {
      const urlParts = url.split('/storage/v1/object/public/documents/')
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]
      const { data, error } = await supabase.storage
        .from('documents')
        .list(filePath.split('/').slice(0, -1).join('/'))

      if (error) return false

      const fileName = filePath.split('/').pop()
      return data?.some(file => file.name === fileName) || false
    } catch (error) {
      console.error('Erreur lors de la vérification du fichier:', error)
      return false
    }
  }
}
