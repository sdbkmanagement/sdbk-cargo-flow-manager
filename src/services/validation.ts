
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ValidationWorkflow = Database['public']['Tables']['validation_workflows']['Row']
type ValidationEtape = Database['public']['Tables']['validation_etapes']['Row']
type ValidationHistorique = Database['public']['Tables']['validation_historique']['Row']

export type EtapeType = 'maintenance' | 'administratif' | 'hsecq' | 'obc'
export type StatutEtape = 'en_attente' | 'valide' | 'rejete'
export type StatutWorkflow = 'en_validation' | 'valide' | 'rejete'

export interface ValidationWorkflowWithEtapes extends ValidationWorkflow {
  etapes: ValidationEtape[]
}

export const validationService = {
  // Créer un workflow de validation pour un véhicule
  async createWorkflow(vehiculeId: string): Promise<ValidationWorkflow> {
    const { data, error } = await supabase
      .from('validation_workflows')
      .insert([{ vehicule_id: vehiculeId }])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du workflow:', error)
      throw error
    }

    return data
  },

  // Récupérer le workflow d'un véhicule avec ses étapes
  async getWorkflowByVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes | null> {
    const { data: workflow, error: workflowError } = await supabase
      .from('validation_workflows')
      .select(`
        *,
        etapes:validation_etapes(*)
      `)
      .eq('vehicule_id', vehiculeId)
      .single()

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        // Pas de workflow trouvé, créer un nouveau
        const newWorkflow = await this.createWorkflow(vehiculeId)
        return this.getWorkflowByVehicule(vehiculeId)
      }
      console.error('Erreur lors de la récupération du workflow:', workflowError)
      throw workflowError
    }

    return workflow as ValidationWorkflowWithEtapes
  },

  // Mettre à jour le statut d'une étape
  async updateEtapeStatut(
    etapeId: string, 
    statut: StatutEtape, 
    commentaire?: string,
    validateurNom?: string,
    validateurRole?: string
  ): Promise<ValidationEtape> {
    const updateData: any = {
      statut,
      date_validation: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (commentaire) updateData.commentaire = commentaire
    if (validateurNom) updateData.validateur_nom = validateurNom
    if (validateurRole) updateData.validateur_role = validateurRole

    const { data, error } = await supabase
      .from('validation_etapes')
      .update(updateData)
      .eq('id', etapeId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error)
      throw error
    }

    // Ajouter à l'historique
    await this.addToHistorique(data.workflow_id, data.etape, statut, commentaire, validateurNom, validateurRole)

    return data
  },

  // Ajouter une entrée à l'historique
  async addToHistorique(
    workflowId: string,
    etape: string,
    nouveauStatut: string,
    commentaire?: string,
    validateurNom?: string,
    validateurRole?: string
  ): Promise<void> {
    await supabase
      .from('validation_historique')
      .insert([{
        workflow_id: workflowId,
        etape,
        nouveau_statut: nouveauStatut,
        commentaire,
        validateur_nom: validateurNom,
        validateur_role: validateurRole
      }])
  },

  // Récupérer l'historique d'un workflow
  async getHistorique(workflowId: string): Promise<ValidationHistorique[]> {
    const { data, error } = await supabase
      .from('validation_historique')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }

    return data || []
  },

  // Obtenir les statistiques globales
  async getStatistiquesGlobales() {
    const { data, error } = await supabase
      .from('validation_workflows')
      .select('statut_global')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      en_validation: data?.filter(w => w.statut_global === 'en_validation').length || 0,
      valides: data?.filter(w => w.statut_global === 'valide').length || 0,
      rejetes: data?.filter(w => w.statut_global === 'rejete').length || 0
    }

    return stats
  }
}
