import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Chargement = Database['public']['Tables']['chargements']['Row']
type ChargementInsert = Omit<Database['public']['Tables']['chargements']['Insert'], 'numero'> & {
  numero?: string;
}
type ChargementUpdate = Database['public']['Tables']['chargements']['Update']
type ChargementHistorique = Database['public']['Tables']['chargements_historique']['Row']

export const chargementsService = {
  // Récupérer tous les chargements avec les informations des missions, véhicules et chauffeurs
  async getAll(): Promise<Chargement[]> {
    const { data, error } = await supabase
      .from('chargements')
      .select(`
        *,
        mission:missions(numero, statut, site_depart, site_arrivee),
        vehicule:vehicules(numero, marque, modele, immatriculation),
        chauffeur:chauffeurs(nom, prenom, telephone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des chargements:', error)
      throw error
    }

    return data || []
  },

  // Récupérer un chargement par ID
  async getById(id: string): Promise<Chargement | null> {
    const { data, error } = await supabase
      .from('chargements')
      .select(`
        *,
        mission:missions(numero, statut, site_depart, site_arrivee),
        vehicule:vehicules(numero, marque, modele, immatriculation),
        chauffeur:chauffeurs(nom, prenom, telephone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération du chargement:', error)
      throw error
    }

    return data
  },

  // Créer un nouveau chargement
  async create(chargementData: ChargementInsert): Promise<Chargement> {
    const { data, error } = await supabase
      .from('chargements')
      .insert([chargementData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du chargement:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un chargement
  async update(id: string, chargementData: ChargementUpdate): Promise<Chargement> {
    const { data, error } = await supabase
      .from('chargements')
      .update({ ...chargementData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du chargement:', error)
      throw error
    }

    return data
  },

  // Supprimer un chargement
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('chargements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du chargement:', error)
      throw error
    }
  },

  // Récupérer l'historique d'un chargement
  async getHistorique(chargementId: string): Promise<ChargementHistorique[]> {
    const { data, error } = await supabase
      .from('chargements_historique')
      .select('*')
      .eq('chargement_id', chargementId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les missions actives pour les chargements
  async getActiveMissions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(numero, marque, modele, immatriculation, type_transport),
        chauffeur:chauffeurs(nom, prenom)
      `)
      .in('statut', ['en_attente', 'en_cours'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des missions actives:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les statistiques des chargements
  async getStats() {
    const { data: chargements, error } = await supabase
      .from('chargements')
      .select('statut, type_chargement, volume_poids, created_at')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const stats = {
      total: chargements?.length || 0,
      charges: chargements?.filter(c => c.statut === 'charge').length || 0,
      livres: chargements?.filter(c => c.statut === 'livre').length || 0,
      annules: chargements?.filter(c => c.statut === 'annule').length || 0,
      ce_mois: chargements?.filter(c => new Date(c.created_at) >= thisMonth).length || 0,
      hydrocarbures: chargements?.filter(c => c.type_chargement === 'hydrocarbures').length || 0,
      bauxite: chargements?.filter(c => c.type_chargement === 'bauxite').length || 0,
      volume_total: chargements?.reduce((sum, c) => sum + (c.volume_poids || 0), 0) || 0
    }

    return stats
  }
}
