
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Mission = Database['public']['Tables']['missions']['Row']
type MissionInsert = Database['public']['Tables']['missions']['Insert']
type MissionUpdate = Database['public']['Tables']['missions']['Update']

export const missionsService = {
  // Récupérer toutes les missions avec timeout
  async getAll(): Promise<Mission[]> {
    try {
      console.log('Chargement des missions...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('missions')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any

      if (error) {
        console.error('Erreur lors du chargement des missions:', error)
        return []
      }

      console.log('Missions chargées:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale missions:', error)
      return []
    }
  },

  // Récupérer une mission par ID
  async getById(id: string): Promise<Mission | null> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur récupération mission:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la récupération de la mission:', error)
      return null
    }
  },

  // Créer une nouvelle mission
  async create(missionData: MissionInsert): Promise<Mission | null> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .insert([missionData])
        .select()
        .single()

      if (error) {
        console.error('Erreur création mission:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }
  },

  // Mettre à jour une mission
  async update(id: string, missionData: MissionUpdate): Promise<Mission | null> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .update({ ...missionData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur mise à jour mission:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error)
      throw error
    }
  },

  // Supprimer une mission
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erreur suppression mission:', error)
        throw error
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission:', error)
      throw error
    }
  },

  // Récupérer les statistiques des missions
  async getStats() {
    try {
      const { data: missions, error } = await Promise.race([
        supabase.from('missions').select('statut, type_transport, volume_poids, created_at'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any

      if (error) {
        console.error('Erreur stats missions:', error)
        return {
          total: 0,
          en_attente: 0,
          en_cours: 0,
          terminees: 0,
          annulees: 0,
          ce_mois: 0,
          hydrocarbures: 0,
          bauxite: 0,
          volume_total: 0
        }
      }

      const today = new Date()
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const stats = {
        total: missions?.length || 0,
        en_attente: missions?.filter(m => m.statut === 'en_attente').length || 0,
        en_cours: missions?.filter(m => m.statut === 'en_cours').length || 0,
        terminees: missions?.filter(m => m.statut === 'terminee').length || 0,
        annulees: missions?.filter(m => m.statut === 'annulee').length || 0,
        ce_mois: missions?.filter(m => new Date(m.created_at) >= thisMonth).length || 0,
        hydrocarbures: missions?.filter(m => m.type_transport === 'hydrocarbures').length || 0,
        bauxite: missions?.filter(m => m.type_transport === 'bauxite').length || 0,
        volume_total: missions?.reduce((sum, m) => sum + (m.volume_poids || 0), 0) || 0
      }

      return stats
    } catch (error) {
      console.error('Erreur générale stats missions:', error)
      return {
        total: 0,
        en_attente: 0,
        en_cours: 0,
        terminees: 0,
        annulees: 0,
        ce_mois: 0,
        hydrocarbures: 0,
        bauxite: 0,
        volume_total: 0
      }
    }
  },

  // Récupérer les véhicules disponibles
  async getAvailableVehicles(typeTransport: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('type_transport', typeTransport)
        .eq('statut', 'disponible')
        .order('numero')

      if (error) {
        console.error('Erreur véhicules disponibles:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules disponibles:', error)
      return []
    }
  },

  // Récupérer les chauffeurs actifs
  async getActiveChauffeurs(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('statut', 'actif')
        .order('nom', { ascending: true })

      if (error) {
        console.error('Erreur chauffeurs actifs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des chauffeurs actifs:', error)
      return []
    }
  }
}
