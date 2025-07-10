import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type HistoriqueVehicule = Database['public']['Tables']['historique_vehicules']['Row']
type HistoriqueVehiculeInsert = Database['public']['Tables']['historique_vehicules']['Insert']

export const historiqueVehiculesService = {
  // Récupérer l'historique complet d'un véhicule
  async getByVehicule(vehiculeId: string): Promise<HistoriqueVehicule[]> {
    const { data, error } = await supabase
      .from('historique_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }

    return data || []
  },

  // Récupérer l'historique par type d'action
  async getByType(vehiculeId: string, typeAction: 'maintenance' | 'administratif' | 'operationnel'): Promise<HistoriqueVehicule[]> {
    const { data, error } = await supabase
      .from('historique_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .eq('type_action', typeAction)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique par type:', error)
      throw error
    }

    return data || []
  },

  // Ajouter une entrée à l'historique
  async ajouterEntree(entreeData: HistoriqueVehiculeInsert): Promise<HistoriqueVehicule> {
    const { data, error } = await supabase
      .from('historique_vehicules')
      .insert([entreeData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error)
      throw error
    }

    return data
  },

  // Récupérer l'historique récent (toutes actions confondues)
  async getHistoriqueRecent(limite: number = 50): Promise<HistoriqueVehicule[]> {
    const { data, error } = await supabase
      .from('historique_vehicules')
      .select(`
        *,
        vehicule:vehicules(numero, immatriculation, type_vehicule)
      `)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique récent:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les statistiques d'activité
  async getStatistiquesActivite(dateDebut?: string, dateFin?: string) {
    let query = supabase
      .from('historique_vehicules')
      .select('type_action, action, created_at')

    if (dateDebut) {
      query = query.gte('created_at', dateDebut)
    }
    if (dateFin) {
      query = query.lte('created_at', dateFin)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      maintenance: data?.filter(h => h.type_action === 'maintenance').length || 0,
      administratif: data?.filter(h => h.type_action === 'administratif').length || 0,
      operationnel: data?.filter(h => h.type_action === 'operationnel').length || 0,
      aujourd_hui: data?.filter(h => 
        new Date(h.created_at).toDateString() === new Date().toDateString()
      ).length || 0,
      cette_semaine: data?.filter(h => {
        const dateAction = new Date(h.created_at)
        const maintenant = new Date()
        const debutSemaine = new Date(maintenant.setDate(maintenant.getDate() - maintenant.getDay()))
        return dateAction >= debutSemaine
      }).length || 0
    }

    return stats
  },

  // Formater les détails d'une action pour l'affichage
  formatDetailsAction(historique: HistoriqueVehicule): string {
    try {
      if (historique.details && typeof historique.details === 'object') {
        const details = historique.details as any
        
        switch (historique.action) {
          case 'diagnostic_maintenance_cree':
            return `Diagnostic créé: ${details.type_panne} - ${details.description}`
          
          case 'reparation_terminee':
            return `Réparation terminée - Durée: ${details.duree_reelle_heures}h - Coût: ${details.cout_reparation}€`
          
          case 'verification_documents':
            return `Vérification document: ${details.document_type} (${details.operation})`
          
          case 'changement_statut':
            return `Statut changé: ${historique.ancien_statut} → ${historique.nouveau_statut}`
          
          default:
            return Object.entries(details)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
        }
      }
      return 'Aucun détail disponible'
    } catch (error) {
      console.error('Erreur lors du formatage des détails:', error)
      return 'Erreur dans les détails'
    }
  },

  // Récupérer les actions par utilisateur
  async getActionsByUtilisateur(utilisateurId: string, limite: number = 20): Promise<HistoriqueVehicule[]> {
    const { data, error } = await supabase
      .from('historique_vehicules')
      .select(`
        *,
        vehicule:vehicules(numero, immatriculation)
      `)
      .eq('utilisateur_id', utilisateurId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Erreur lors de la récupération des actions utilisateur:', error)
      throw error
    }

    return data || []
  }
}