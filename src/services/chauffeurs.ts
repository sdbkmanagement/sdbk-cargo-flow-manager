
import { supabase } from '@/lib/supabase'
import type { Chauffeur } from '@/lib/supabase'

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
  async create(chauffeurData: Omit<Chauffeur, 'id' | 'created_at' | 'updated_at'>): Promise<Chauffeur> {
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
  async update(id: string, chauffeurData: Partial<Chauffeur>): Promise<Chauffeur> {
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
      .upload(path, file)

    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }
}
