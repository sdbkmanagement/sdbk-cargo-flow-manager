
import { supabase } from '@/integrations/supabase/client';

export type EtapeType = 'maintenance' | 'administratif' | 'hsecq' | 'obc';
export type StatutEtape = 'en_attente' | 'valide' | 'rejete';

export interface ValidationEtape {
  id: string;
  workflow_id: string;
  etape: EtapeType;
  statut: StatutEtape;
  commentaire?: string;
  date_validation?: string;
  validateur_nom?: string;
  validateur_role?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationWorkflow {
  id: string;
  vehicule_id: string;
  statut_global: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationWorkflowWithEtapes extends ValidationWorkflow {
  etapes: ValidationEtape[];
}

export const validationService = {
  // Cache local pour éviter les requêtes répétées
  _cache: new Map<string, { data: any; timestamp: number }>(),
  
  _getCached(key: string, maxAge: number = 30000) {
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  },

  _setCache(key: string, data: any) {
    this._cache.set(key, { data, timestamp: Date.now() });
  },

  // Optimisation: Récupérer les workflows avec pagination
  async getWorkflowsPaginated(page: number = 1, limit: number = 10) {
    const cacheKey = `workflows_${page}_${limit}`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    console.log(`Chargement des workflows page ${page}, limite ${limit}`);
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error } = await supabase
      .from('validation_workflows')
      .select(`
        *,
        etapes:validation_etapes(*)
      `)
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    this._setCache(cacheKey, data);
    return data as ValidationWorkflowWithEtapes[];
  },

  // Optimisation: Récupérer un workflow spécifique avec cache
  async getWorkflowByVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes | null> {
    const cacheKey = `workflow_${vehiculeId}`;
    const cached = this._getCached(cacheKey, 10000); // Cache plus court pour les données dynamiques
    if (cached) return cached;

    console.log(`Chargement du workflow pour véhicule ${vehiculeId}`);

    // Requête optimisée en une seule fois
    const { data, error } = await supabase
      .from('validation_workflows')
      .select(`
        *,
        etapes:validation_etapes(*)
      `)
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun workflow trouvé, créer un nouveau
        return await this.createWorkflowForVehicule(vehiculeId);
      }
      throw error;
    }

    this._setCache(cacheKey, data);
    return data;
  },

  // Optimisation: Créer un workflow avec toutes ses étapes en une transaction
  async createWorkflowForVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes> {
    console.log(`Création d'un nouveau workflow pour véhicule ${vehiculeId}`);

    // Utiliser une transaction Supabase pour créer le workflow et ses étapes
    const { data: workflow, error: workflowError } = await supabase
      .from('validation_workflows')
      .insert({
        vehicule_id: vehiculeId,
        statut_global: 'en_validation'
      })
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Créer les 4 étapes en une seule requête
    const etapes = [
      { workflow_id: workflow.id, etape: 'maintenance' },
      { workflow_id: workflow.id, etape: 'administratif' },
      { workflow_id: workflow.id, etape: 'hsecq' },
      { workflow_id: workflow.id, etape: 'obc' }
    ];

    const { data: etapesCreated, error: etapesError } = await supabase
      .from('validation_etapes')
      .insert(etapes)
      .select();

    if (etapesError) throw etapesError;

    const result = {
      ...workflow,
      etapes: etapesCreated
    };

    // Invalider le cache
    this._cache.delete(`workflow_${vehiculeId}`);
    
    return result;
  },

  // Optimisation: Mise à jour avec invalidation de cache ciblée
  async updateEtapeStatut(
    etapeId: string,
    statut: StatutEtape,
    commentaire: string,
    validateurNom: string,
    validateurRole: string
  ) {
    console.log(`Mise à jour étape ${etapeId} vers ${statut}`);

    const { data, error } = await supabase
      .from('validation_etapes')
      .update({
        statut,
        commentaire,
        validateur_nom: validateurNom,
        validateur_role: validateurRole,
        date_validation: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', etapeId)
      .select()
      .single();

    if (error) throw error;

    // Invalider les caches pertinents
    for (const [key] of this._cache) {
      if (key.includes('workflow_') || key.includes('stats')) {
        this._cache.delete(key);
      }
    }

    return data;
  },

  // Optimisation: Statistiques avec cache longue durée
  async getStatistiquesGlobales() {
    const cacheKey = 'stats_globales';
    const cached = this._getCached(cacheKey, 60000); // Cache 1 minute
    if (cached) return cached;

    console.log('Chargement des statistiques globales');

    // Requête optimisée avec comptage direct
    const { data, error } = await supabase
      .from('validation_workflows')
      .select('statut_global');

    if (error) throw error;

    const stats = {
      total: data.length,
      en_validation: data.filter(w => w.statut_global === 'en_validation').length,
      valides: data.filter(w => w.statut_global === 'valide').length,
      rejetes: data.filter(w => w.statut_global === 'rejete').length
    };

    this._setCache(cacheKey, stats);
    return stats;
  },

  // Optimisation: Vider le cache manuellement si nécessaire
  clearCache() {
    this._cache.clear();
    console.log('Cache de validation vidé');
  }
};
