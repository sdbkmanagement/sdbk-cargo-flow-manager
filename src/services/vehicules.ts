
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Vehicule = Database['public']['Tables']['vehicules']['Row']
type VehiculeInsert = Database['public']['Tables']['vehicules']['Insert']
type VehiculeUpdate = Database['public']['Tables']['vehicules']['Update']
type MaintenanceVehicule = Database['public']['Tables']['maintenance_vehicules']['Row']
type MaintenanceVehiculeInsert = Database['public']['Tables']['maintenance_vehicules']['Insert']

export const vehiculesService = {
  // Récupérer tous les véhicules avec timeout
  async getAll(): Promise<Vehicule[]> {
    try {
      console.log('Chargement des véhicules...')
      
      const { data, error } = await Promise.race([
        supabase
          .from('vehicules')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as any

      if (error) {
        console.error('Erreur lors du chargement des véhicules:', error)
        return []
      }

      console.log('Véhicules chargés:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erreur générale véhicules:', error)
      return []
    }
  },

  // Créer un nouveau véhicule
  async create(vehiculeData: VehiculeInsert): Promise<Vehicule | null> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .insert([vehiculeData])
        .select()
        .single()

      if (error) {
        console.error('Erreur création véhicule:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error)
      throw error
    }
  },

  // Mettre à jour un véhicule
  async update(id: string, vehiculeData: VehiculeUpdate): Promise<Vehicule | null> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .update({ ...vehiculeData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur mise à jour véhicule:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error)
      throw error
    }
  },

  // Supprimer un véhicule
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicules')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erreur suppression véhicule:', error)
        throw error
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error)
      throw error
    }
  },

  // Récupérer les maintenances d'un véhicule
  async getMaintenance(vehiculeId: string): Promise<MaintenanceVehicule[]> {
    try {
      const { data, error } = await supabase
        .from('maintenance_vehicules')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('date_maintenance', { ascending: false });

      if (error) {
        console.error('Erreur récupération maintenances:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des maintenances:', error)
      return []
    }
  },

  // Ajouter une maintenance
  async addMaintenance(maintenanceData: MaintenanceVehiculeInsert): Promise<MaintenanceVehicule | null> {
    try {
      const { data, error } = await supabase
        .from('maintenance_vehicules')
        .insert([maintenanceData])
        .select()
        .single()

      if (error) {
        console.error('Erreur ajout maintenance:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la maintenance:', error)
      throw error
    }
  },

  // Récupérer les documents d'un véhicule
  async getDocuments(vehiculeId: string) {
    try {
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      return []
    }
  },

  // Récupérer les statistiques de la flotte
  async getFleetStats() {
    try {
      const { data: vehicules, error } = await Promise.race([
        supabase.from('vehicules').select('statut, type_transport, type_vehicule'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any

      if (error) {
        console.error('Erreur stats véhicules:', error)
        return {
          total: 0,
          disponibles: 0,
          en_mission: 0,
          maintenance: 0,
          hydrocarbures: 0,
          bauxite: 0,
          porteurs: 0,
          tracteur_remorques: 0,
          maintenance_urgente: 0
        }
      }

      const stats = {
        total: vehicules?.length || 0,
        disponibles: vehicules?.filter(v => v.statut === 'disponible').length || 0,
        en_mission: vehicules?.filter(v => v.statut === 'en_mission').length || 0,
        maintenance: vehicules?.filter(v => v.statut === 'maintenance').length || 0,
        hydrocarbures: vehicules?.filter(v => v.type_transport === 'hydrocarbures').length || 0,
        bauxite: vehicules?.filter(v => v.type_transport === 'bauxite').length || 0,
        porteurs: vehicules?.filter(v => v.type_vehicule === 'porteur').length || 0,
        tracteur_remorques: vehicules?.filter(v => v.type_vehicule === 'tracteur_remorque').length || 0,
        maintenance_urgente: 0
      }

      return stats
    } catch (error) {
      console.error('Erreur générale stats véhicules:', error)
      return {
        total: 0,
        disponibles: 0,
        en_mission: 0,
        maintenance: 0,
        hydrocarbures: 0,
        bauxite: 0,
        porteurs: 0,
        tracteur_remorques: 0,
        maintenance_urgente: 0
      }
    }
  },

  // Récupérer les bases uniques
  async getBases(): Promise<string[]> {
    try {
      const { data: vehicules, error } = await supabase
        .from('vehicules')
        .select('base')

      if (error) {
        console.error('Erreur bases véhicules:', error)
        return []
      }

      const bases = vehicules
        ?.map(v => v.base)
        .filter((base): base is string => Boolean(base))
        .filter((base, index, arr) => arr.indexOf(base) === index)
        .sort() || []

      return bases
    } catch (error) {
      console.error('Erreur récupération bases:', error)
      return []
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
