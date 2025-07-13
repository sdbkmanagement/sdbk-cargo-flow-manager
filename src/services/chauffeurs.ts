
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row']
type ChauffeurInsert = Database['public']['Tables']['chauffeurs']['Insert']
type ChauffeurUpdate = Database['public']['Tables']['chauffeurs']['Update']

export const chauffeursService = {
  // Récupérer tous les chauffeurs avec timeout
  async getAll(): Promise<Chauffeur[]> {
    try {
      console.log('Chargement des chauffeurs...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('chauffeurs')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any

      if (error) {
        console.error('Erreur lors du chargement des chauffeurs:', error)
        return []
      }

      console.log('Chauffeurs chargés:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale chauffeurs:', error)
      return []
    }
  },

  // Créer un nouveau chauffeur
  async create(chauffeurData: ChauffeurInsert): Promise<Chauffeur | null> {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .insert([chauffeurData])
        .select()
        .single()

      if (error) {
        console.error('Erreur création chauffeur:', error)
        throw error
      }

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

  // Upload d'un fichier
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, {
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
