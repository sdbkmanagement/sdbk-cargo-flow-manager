// Service temporaire en attendant que les nouveaux types Supabase soient générés
import { supabase } from '@/integrations/supabase/client'

export const maintenanceTemporaireService = {
  // Créer un enregistrement dans maintenance_vehicules existant
  async createMaintenance(vehiculeId: string, data: any) {
    const { data: result, error } = await supabase
      .from('maintenance_vehicules')
      .insert({
        vehicule_id: vehiculeId,
        type_maintenance: data.type_panne || 'Diagnostic',
        description: data.description,
        date_maintenance: data.date_diagnostic,
        cout: data.cout_reparation || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création maintenance:', error)
      throw error
    }

    return result
  },

  // Récupérer les maintenances d'un véhicule
  async getMaintenancesByVehicle(vehiculeId: string) {
    const { data, error } = await supabase
      .from('maintenance_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('date_maintenance', { ascending: false })

    if (error) {
      console.error('Erreur récupération maintenances:', error)
      return []
    }

    return data || []
  },

  // Mettre à jour le statut d'un véhicule
  async updateVehicleStatus(vehiculeId: string, status: string) {
    const { error } = await supabase
      .from('vehicules')
      .update({ statut: status })
      .eq('id', vehiculeId)

    if (error) {
      console.error('Erreur mise à jour statut véhicule:', error)
      throw error
    }
  },

  // Types de pannes prédéfinis
  getTypesPannes() {
    return [
      { id: '1', libelle: 'Panne moteur', description: 'Problème moteur' },
      { id: '2', libelle: 'Panne électrique', description: 'Problème électrique' },
      { id: '3', libelle: 'Panne hydraulique', description: 'Problème hydraulique' },
      { id: '4', libelle: 'Usure pneus', description: 'Usure des pneus' },
      { id: '5', libelle: 'Autre', description: 'Autre type de panne' }
    ]
  }
}