
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Mission = Database['public']['Tables']['missions']['Row']
type MissionInsert = Database['public']['Tables']['missions']['Insert']
type MissionUpdate = Database['public']['Tables']['missions']['Update']
type MissionHistorique = Database['public']['Tables']['missions_historique']['Row']

export const missionsService = {
  // Récupérer toutes les missions avec les informations du véhicule et chauffeur
  async getAll(): Promise<Mission[]> {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(numero, marque, modele, immatriculation, type_transport),
        chauffeur:chauffeurs(nom, prenom, telephone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des missions:', error)
      throw error
    }

    return data || []
  },

  // Récupérer une mission par ID
  async getById(id: string): Promise<Mission | null> {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(numero, marque, modele, immatriculation, type_transport),
        chauffeur:chauffeurs(nom, prenom, telephone)
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
  async create(missionData: MissionInsert): Promise<Mission> {
    const { data, error } = await supabase
      .from('missions')
      .insert([missionData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }

    return data
  },

  // Mettre à jour une mission
  async update(id: string, missionData: MissionUpdate): Promise<Mission> {
    const { data, error } = await supabase
      .from('missions')
      .update({ ...missionData, updated_at: new Date().toISOString() })
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

  // Vérifier la disponibilité des ressources
  async checkResourceAvailability(
    vehiculeId: string,
    chauffeurId: string,
    dateDebut: string,
    dateFin: string,
    missionId?: string
  ) {
    const { data, error } = await supabase.rpc('check_resource_availability', {
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

    return data?.[0] || { vehicule_disponible: false, chauffeur_disponible: false, message: 'Erreur de vérification' }
  },

  // Récupérer les véhicules disponibles pour un type de transport
  async getAvailableVehicles(typeTransport: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vehicules')
      .select('*')
      .eq('type_transport', typeTransport)
      .eq('statut', 'disponible')
      .order('numero')

    if (error) {
      console.error('Erreur lors de la récupération des véhicules disponibles:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les chauffeurs actifs
  async getActiveChauffeurs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('chauffeurs')
      .select('*')
      .eq('statut', 'actif')
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des chauffeurs actifs:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les statistiques des missions
  async getStats() {
    const { data: missions, error } = await supabase
      .from('missions')
      .select('statut, type_transport, volume_poids, created_at')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
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
  }
}
