import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type DiagnosticMaintenance = Database['public']['Tables']['diagnostics_maintenance']['Row']
type DiagnosticMaintenanceInsert = Database['public']['Tables']['diagnostics_maintenance']['Insert']
type DiagnosticMaintenanceUpdate = Database['public']['Tables']['diagnostics_maintenance']['Update']
type TypePanne = Database['public']['Tables']['types_pannes']['Row']

export const diagnosticMaintenanceService = {
  // Récupérer tous les diagnostics d'un véhicule
  async getByVehicle(vehiculeId: string): Promise<DiagnosticMaintenance[]> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('date_diagnostic', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des diagnostics:', error)
      throw error
    }

    return data || []
  },

  // Créer un nouveau diagnostic
  async create(diagnosticData: DiagnosticMaintenanceInsert): Promise<DiagnosticMaintenance> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .insert([diagnosticData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du diagnostic:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un diagnostic
  async update(id: string, diagnosticData: DiagnosticMaintenanceUpdate): Promise<DiagnosticMaintenance> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .update({ ...diagnosticData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du diagnostic:', error)
      throw error
    }

    return data
  },

  // Supprimer un diagnostic
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('diagnostics_maintenance')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du diagnostic:', error)
      throw error
    }
  },

  // Récupérer les types de pannes
  async getTypesPannes(): Promise<TypePanne[]> {
    const { data, error } = await supabase
      .from('types_pannes')
      .select('*')
      .eq('actif', true)
      .order('libelle')

    if (error) {
      console.error('Erreur lors de la récupération des types de pannes:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les diagnostics en cours pour le dashboard
  async getDiagnosticsEnCours(): Promise<DiagnosticMaintenance[]> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .select(`
        *,
        vehicule:vehicules(numero, immatriculation, type_vehicule)
      `)
      .in('statut', ['en_attente', 'en_cours'])
      .order('date_diagnostic', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des diagnostics en cours:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les statistiques de maintenance
  async getMaintenanceStats() {
    const { data: diagnostics, error } = await supabase
      .from('diagnostics_maintenance')
      .select('statut, duree_reelle_heures, cout_reparation, date_diagnostic')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    const stats = {
      total: diagnostics?.length || 0,
      en_attente: diagnostics?.filter(d => d.statut === 'en_attente').length || 0,
      en_cours: diagnostics?.filter(d => d.statut === 'en_cours').length || 0,
      termines: diagnostics?.filter(d => d.statut === 'termine').length || 0,
      cout_total: diagnostics?.reduce((sum, d) => sum + (d.cout_reparation || 0), 0) || 0,
      duree_moyenne: diagnostics?.filter(d => d.duree_reelle_heures)
        .reduce((sum, d, _, arr) => sum + (d.duree_reelle_heures! / arr.length), 0) || 0,
      ce_mois: diagnostics?.filter(d => 
        new Date(d.date_diagnostic).getMonth() === new Date().getMonth() &&
        new Date(d.date_diagnostic).getFullYear() === new Date().getFullYear()
      ).length || 0
    }

    return stats
  }
}