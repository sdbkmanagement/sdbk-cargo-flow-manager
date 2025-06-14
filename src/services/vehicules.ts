
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Vehicule = Database['public']['Tables']['vehicules']['Row']
type VehiculeInsert = Database['public']['Tables']['vehicules']['Insert']
type VehiculeUpdate = Database['public']['Tables']['vehicules']['Update']
type DocumentVehicule = Database['public']['Tables']['documents_vehicules']['Row']
type MaintenanceVehicule = Database['public']['Tables']['maintenance_vehicules']['Row']

export const vehiculesService = {
  // Récupérer tous les véhicules avec les informations du chauffeur
  async getAll(): Promise<Vehicule[]> {
    const { data, error } = await supabase
      .from('vehicules')
      .select(`
        *,
        chauffeur:chauffeurs(nom, prenom)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des véhicules:', error)
      throw error
    }

    return data || []
  },

  // Créer un nouveau véhicule
  async create(vehiculeData: VehiculeInsert): Promise<Vehicule> {
    const { data, error } = await supabase
      .from('vehicules')
      .insert([vehiculeData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du véhicule:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un véhicule
  async update(id: string, vehiculeData: VehiculeUpdate): Promise<Vehicule> {
    const { data, error } = await supabase
      .from('vehicules')
      .update({ ...vehiculeData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error)
      throw error
    }

    return data
  },

  // Supprimer un véhicule
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du véhicule:', error)
      throw error
    }
  },

  // Récupérer les documents d'un véhicule
  async getDocuments(vehiculeId: string): Promise<DocumentVehicule[]> {
    const { data, error } = await supabase
      .from('documents_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }

    return data || []
  },

  // Récupérer l'historique de maintenance d'un véhicule
  async getMaintenance(vehiculeId: string): Promise<MaintenanceVehicule[]> {
    const { data, error } = await supabase
      .from('maintenance_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('date_maintenance', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de la maintenance:', error)
      throw error
    }

    return data || []
  },

  // Ajouter une maintenance
  async addMaintenance(maintenanceData: Database['public']['Tables']['maintenance_vehicules']['Insert']): Promise<MaintenanceVehicule> {
    const { data, error } = await supabase
      .from('maintenance_vehicules')
      .insert([maintenanceData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de l\'ajout de la maintenance:', error)
      throw error
    }

    return data
  },

  // Récupérer les statistiques de la flotte
  async getFleetStats() {
    const { data: vehicules, error } = await supabase
      .from('vehicules')
      .select('statut, type_transport, prochaine_maintenance')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    const stats = {
      total: vehicules?.length || 0,
      disponibles: vehicules?.filter(v => v.statut === 'disponible').length || 0,
      en_mission: vehicules?.filter(v => v.statut === 'en_mission').length || 0,
      maintenance: vehicules?.filter(v => v.statut === 'maintenance').length || 0,
      hydrocarbures: vehicules?.filter(v => v.type_transport === 'hydrocarbures').length || 0,
      bauxite: vehicules?.filter(v => v.type_transport === 'bauxite').length || 0,
      maintenance_urgente: vehicules?.filter(v => 
        v.prochaine_maintenance && 
        new Date(v.prochaine_maintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length || 0
    }

    return stats
  }
}
