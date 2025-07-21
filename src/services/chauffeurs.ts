import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row']
type ChauffeurInsert = Database['public']['Tables']['chauffeurs']['Insert']
type ChauffeurUpdate = Database['public']['Tables']['chauffeurs']['Update']

export const chauffeursService = {
  // Récupérer tous les chauffeurs avec leurs véhicules assignés
  async getAll(): Promise<Chauffeur[]> {
    try {
      console.log('Chargement des chauffeurs...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('chauffeurs')
          .select(`
            *,
            affectations_chauffeurs(
              vehicule_id,
              vehicules(numero)
            )
          `)
          .eq('affectations_chauffeurs.statut', 'active')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any

      if (error) {
        console.error('Erreur lors du chargement des chauffeurs:', error)
        // Fallback vers la requête simple
        return await this.getAllSimple()
      }

      console.log('Chauffeurs avec assignations chargés:', data?.length || 0)
      
      // Traiter les données pour ajouter le véhicule assigné
      const chauffeursWithVehicles = data?.map(chauffeur => ({
        ...chauffeur,
        vehicule_assigne: chauffeur.affectations_chauffeurs?.[0]?.vehicules?.numero || null
      })) || []

      return chauffeursWithVehicles
    } catch (error) {
      console.error('Erreur générale chauffeurs:', error)
      // Fallback vers la requête simple
      return await this.getAllSimple()
    }
  },

  // Méthode fallback pour récupérer les chauffeurs sans jointure
  async getAllSimple(): Promise<Chauffeur[]> {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement simple des chauffeurs:', error)
        return []
      }

      console.log('Chauffeurs (méthode simple) chargés:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur méthode simple chauffeurs:', error)
      return []
    }
  },

  // Créer un nouveau chauffeur
  async create(chauffeurData: ChauffeurInsert): Promise<Chauffeur | null> {
    try {
      console.log('Création chauffeur avec données:', chauffeurData)
      
      const { data, error } = await supabase
        .from('chauffeurs')
        .insert([chauffeurData])
        .select()
        .single()

      if (error) {
        console.error('Erreur création chauffeur:', error)
        throw error
      }

      console.log('Chauffeur créé avec succès:', data)
      return data
    } catch (error) {
      console.error('Erreur lors de la création du chauffeur:', error)
      throw error
    }
  },

  // Mettre à jour un chauffeur
  async update(id: string, chauffeurData: ChauffeurUpdate): Promise<Chauffeur | null> {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .update({ ...chauffeurData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur mise à jour chauffeur:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chauffeur:', error)
      throw error
    }
  },

  // Supprimer un chauffeur
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erreur suppression chauffeur:', error)
        throw error
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du chauffeur:', error)
      throw error
    }
  },

  // Sauvegarder les documents d'un chauffeur
  async saveDocuments(chauffeurId: string, documents: any[]): Promise<void> {
    try {
      // Supprimer les anciens documents
      await supabase
        .from('documents')
        .delete()
        .eq('entity_id', chauffeurId)
        .eq('entity_type', 'chauffeur');

      // Ajouter les nouveaux documents
      if (documents.length > 0) {
        const documentsToInsert = documents.map(doc => ({
          ...doc,
          entity_id: chauffeurId,
          entity_type: 'chauffeur'
        }));

        const { error } = await supabase
          .from('documents')
          .insert(documentsToInsert);

        if (error) {
          console.error('Erreur sauvegarde documents:', error)
          throw error
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des documents:', error)
      throw error
    }
  },

  // Upload d'un fichier
  async uploadFile(file: File, chauffeurId: string, type: 'photo' | 'contrat'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${chauffeurId}_${type}_${Date.now()}.${fileExt}`
      const filePath = `chauffeurs/${fileName}`

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Erreur upload fichier:', error)
        throw error
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  }
}
