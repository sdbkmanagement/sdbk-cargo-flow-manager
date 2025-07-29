
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Mission = Database['public']['Tables']['missions']['Row'];
type MissionInsert = Database['public']['Tables']['missions']['Insert'];

export const missionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        vehicule:vehicules(*),
        chauffeur:chauffeurs(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStats() {
    const { data: missions, error } = await supabase
      .from('missions')
      .select('statut');

    if (error) throw error;

    const stats = {
      total: missions.length,
      en_attente: missions.filter(m => m.statut === 'en_attente').length,
      en_cours: missions.filter(m => m.statut === 'en_cours').length,
      terminees: missions.filter(m => m.statut === 'terminee').length,
      annulees: missions.filter(m => m.statut === 'annulee').length
    };

    return stats;
  },

  async create(mission: MissionInsert) {
    // Vérifier que le véhicule est validé avant de créer la mission
    const { data: vehicule, error: vehiculeError } = await supabase
      .from('vehicules')
      .select('statut, validation_requise')
      .eq('id', mission.vehicule_id)
      .single();

    if (vehiculeError) {
      throw new Error(`Erreur lors de la vérification du véhicule: ${vehiculeError.message}`);
    }

    if (!vehicule) {
      throw new Error('Véhicule non trouvé');
    }

    // Vérifier que le véhicule est disponible et validé
    if (vehicule.validation_requise || vehicule.statut !== 'disponible') {
      throw new Error('Le véhicule doit passer par le workflow de validation avant de pouvoir partir en mission');
    }

    // Vérifier le workflow de validation
    const { data: workflow, error: workflowError } = await supabase
      .from('validation_workflows')
      .select('statut_global')
      .eq('vehicule_id', mission.vehicule_id)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow de validation non trouvé pour ce véhicule');
    }

    if (workflow.statut_global !== 'valide') {
      throw new Error('Le véhicule doit avoir un workflow de validation complet et validé');
    }

    const { data, error } = await supabase
      .from('missions')
      .insert(mission)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le statut du véhicule en "en_mission"
    await supabase
      .from('vehicules')
      .update({ statut: 'en_mission' })
      .eq('id', mission.vehicule_id);

    return data;
  },

  async update(id: string, updates: Partial<Mission>) {
    const { data: currentMission, error: fetchError } = await supabase
      .from('missions')
      .select('statut, vehicule_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Si la mission passe à "terminee", marquer le véhicule pour revalidation
    if (currentMission.statut !== 'terminee' && updates.statut === 'terminee') {
      await this.markVehicleForRevalidation(currentMission.vehicule_id);
    }

    return data;
  },

  async markVehicleForRevalidation(vehiculeId: string) {
    console.log(`🔄 Marquage du véhicule ${vehiculeId} pour revalidation après mission`);

    try {
      // Marquer le véhicule comme nécessitant une revalidation
      await supabase
        .from('vehicules')
        .update({ 
          validation_requise: true,
          statut: 'validation_requise'
        })
        .eq('id', vehiculeId);

      // Remettre toutes les étapes du workflow en attente
      const { data: workflow } = await supabase
        .from('validation_workflows')
        .select('id')
        .eq('vehicule_id', vehiculeId)
        .single();

      if (workflow) {
        // Réinitialiser les étapes de validation
        await supabase
          .from('validation_etapes')
          .update({
            statut: 'en_attente',
            date_validation: null,
            commentaire: null,
            validateur_nom: null,
            validateur_role: null
          })
          .eq('workflow_id', workflow.id);

        // Mettre à jour le statut global du workflow
        await supabase
          .from('validation_workflows')
          .update({ statut_global: 'en_validation' })
          .eq('id', workflow.id);
      }

      console.log('✅ Véhicule marqué pour revalidation avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du marquage pour revalidation:', error);
      throw error;
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async canCreateMission(vehiculeId: string): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      // Vérifier le statut du véhicule
      const { data: vehicule, error: vehiculeError } = await supabase
        .from('vehicules')
        .select('statut, validation_requise')
        .eq('id', vehiculeId)
        .single();

      if (vehiculeError || !vehicule) {
        return { canCreate: false, reason: 'Véhicule non trouvé' };
      }

      if (vehicule.validation_requise) {
        return { canCreate: false, reason: 'Le véhicule nécessite une validation avant de partir en mission' };
      }

      if (vehicule.statut !== 'disponible') {
        return { canCreate: false, reason: `Le véhicule n'est pas disponible (statut: ${vehicule.statut})` };
      }

      // Vérifier le workflow de validation
      const { data: workflow, error: workflowError } = await supabase
        .from('validation_workflows')
        .select('statut_global')
        .eq('vehicule_id', vehiculeId)
        .single();

      if (workflowError || !workflow) {
        return { canCreate: false, reason: 'Workflow de validation non trouvé' };
      }

      if (workflow.statut_global !== 'valide') {
        return { canCreate: false, reason: 'Le workflow de validation doit être complet et validé' };
      }

      return { canCreate: true };
    } catch (error) {
      return { canCreate: false, reason: 'Erreur lors de la vérification des permissions' };
    }
  }
};

export default missionsService;
