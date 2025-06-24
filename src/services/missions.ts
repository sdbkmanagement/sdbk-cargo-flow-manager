
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Mission = Database['public']['Tables']['missions']['Row']
type MissionInsert = Database['public']['Tables']['missions']['Insert']
type MissionUpdate = Database['public']['Tables']['missions']['Update']
type MissionHistorique = Database['public']['Tables']['missions_historique']['Row']

export interface MissionWithDetails extends Mission {
  vehicule?: {
    id: string
    numero: string
    immatriculation: string
    marque: string
    modele: string
  }
  chauffeur?: {
    id: string
    nom: string
    prenom: string
    telephone: string
  }
}

export interface ResourceAvailability {
  vehicule_disponible: boolean
  chauffeur_disponible: boolean
  message: string
}

export const missionsService = {
  // Récupérer toutes les missions avec détails
  async getAll(): Promise<MissionWithDetails[]> {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation, marque, modele),
        chauffeur:chauffeurs(id, nom, prenom, telephone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des missions:', error)
      throw error
    }

    return data || []
  },

  // Récupérer une mission par ID
  async getById(id: string): Promise<MissionWithDetails | null> {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation, marque, modele),
        chauffeur:chauffeurs(id, nom, prenom, telephone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération de la mission:', error)
      throw error
    }

    return data
  },

  // Créer une nouvelle mission
  async create(mission: MissionInsert): Promise<Mission> {
    const { data, error } = await supabase
      .from('missions')
      .insert([mission])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }

    return data
  },

  // Mettre à jour une mission
  async update(id: string, updates: MissionUpdate): Promise<Mission> {
    const { data, error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error)
      throw error
    }

    return data
  },

  // Supprimer une mission
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression de la mission:', error)
      throw error
    }
  },

  // Vérifier la disponibilité des ressources
  async checkAvailability(
    vehiculeId: string,
    chauffeurId: string,
    dateDebut: string,
    dateFin: string,
    missionId?: string
  ): Promise<ResourceAvailability> {
    const { data, error } = await supabase
      .rpc('check_resource_availability', {
        p_vehicule_id: vehiculeId,
        p_chauffeur_id: chauffeurId,
        p_date_debut: dateDebut,
        p_date_fin: dateFin,
        p_mission_id: missionId || null
      })

    if (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error)
      throw error
    }

    return data?.[0] || { vehicule_disponible: false, chauffeur_disponible: false, message: 'Erreur inconnue' }
  },

  // Récupérer l'historique d'une mission
  async getHistorique(missionId: string): Promise<MissionHistorique[]> {
    const { data, error } = await supabase
      .from('missions_historique')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les véhicules disponibles
  async getAvailableVehicules() {
    const { data, error } = await supabase
      .from('vehicules')
      .select('id, numero, immatriculation, marque, modele, type_transport')
      .eq('statut', 'disponible')
      .order('numero')

    if (error) {
      console.error('Erreur lors de la récupération des véhicules disponibles:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les chauffeurs disponibles
  async getAvailableChauffeurs() {
    const { data, error } = await supabase
      .from('chauffeurs')
      .select('id, nom, prenom, telephone, type_permis')
      .eq('statut', 'actif')
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des chauffeurs disponibles:', error)
      throw error
    }

    return data || []
  }
}
