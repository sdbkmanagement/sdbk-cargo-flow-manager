
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
  // Cache optimisé pour éviter les requêtes répétées
  _cache: new Map<string, { data: any; timestamp: number }>(),
  
  _getCached(key: string, maxAge: number = 10000) { // Réduit à 10 secondes
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  },

  _setCache(key: string, data: any) {
    this._cache.set(key, { data, timestamp: Date.now() });
    // Limiter la taille du cache
    if (this._cache.size > 100) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
  },

  // Optimisation: Récupérer les workflows avec pagination légère
  async getWorkflowsPaginated(page: number = 1, limit: number = 20) {
    const cacheKey = `workflows_${page}_${limit}`;
    const cached = this._getCached(cacheKey, 5000); // Cache plus court
    if (cached) return cached;

    console.log(`Chargement rapide workflows page ${page}, limite ${limit}`);
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('validation_workflows')
      .select(`
        id,
        vehicule_id,
        statut_global,
        created_at,
        updated_at,
        etapes:validation_etapes(
          id,
          workflow_id,
          etape,
          statut,
          commentaire,
          date_validation,
          validateur_nom,
          validateur_role,
          created_at,
          updated_at
        )
      `, { count: 'exact' })
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const transformedData = data?.map(workflow => ({
      ...workflow,
      etapes: workflow.etapes?.map((etape: any) => ({
        id: etape.id,
        workflow_id: etape.workflow_id,
        etape: etape.etape as EtapeType,
        statut: etape.statut as StatutEtape,
        commentaire: etape.commentaire,
        date_validation: etape.date_validation,
        validateur_nom: etape.validateur_nom,
        validateur_role: etape.validateur_role,
        created_at: etape.created_at,
        updated_at: etape.updated_at
      })) || []
    })) as ValidationWorkflowWithEtapes[];
    
    const result = {
      workflows: transformedData,
      totalCount: count || 0,
      hasMore: (count || 0) > end + 1
    };
    
    this._setCache(cacheKey, result);
    return result;
  },

  // Optimisation: Récupérer un workflow spécifique avec cache court
  async getWorkflowByVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes | null> {
    const cacheKey = `workflow_${vehiculeId}`;
    const cached = this._getCached(cacheKey, 5000); // Cache plus court
    if (cached) return cached;

    console.log(`Chargement rapide workflow pour véhicule ${vehiculeId}`);

    const { data, error } = await supabase
      .from('validation_workflows')
      .select(`
        id,
        vehicule_id,
        statut_global,
        created_at,
        updated_at,
        etapes:validation_etapes(
          id,
          workflow_id,
          etape,
          statut,
          commentaire,
          date_validation,
          validateur_nom,
          validateur_role,
          created_at,
          updated_at
        )
      `)
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Créer un nouveau workflow si aucun n'existe
      return await this.createWorkflowForVehicule(vehiculeId);
    }

    const transformedData = {
      ...data,
      etapes: data.etapes?.map((etape: any) => ({
        id: etape.id,
        workflow_id: etape.workflow_id,
        etape: etape.etape as EtapeType,
        statut: etape.statut as StatutEtape,
        commentaire: etape.commentaire,
        date_validation: etape.date_validation,
        validateur_nom: etape.validateur_nom,
        validateur_role: etape.validateur_role,
        created_at: etape.created_at,
        updated_at: etape.updated_at
      })) || []
    } as ValidationWorkflowWithEtapes;

    this._setCache(cacheKey, transformedData);
    return transformedData;
  },

  // Optimisation: Créer un workflow plus rapidement avec moins de vérifications
  async createWorkflowForVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes> {
    console.log(`Création rapide workflow pour véhicule ${vehiculeId}`);

    // Transaction plus simple
    const { data: workflow, error: workflowError } = await supabase
      .from('validation_workflows')
      .insert({
        vehicule_id: vehiculeId,
        statut_global: 'en_validation'
      })
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Créer les 4 étapes en batch
    const etapes = [
      { workflow_id: workflow.id, etape: 'maintenance', statut: 'en_attente' },
      { workflow_id: workflow.id, etape: 'administratif', statut: 'en_attente' },
      { workflow_id: workflow.id, etape: 'hsecq', statut: 'en_attente' },
      { workflow_id: workflow.id, etape: 'obc', statut: 'en_attente' }
    ];

    const { data: etapesCreated, error: etapesError } = await supabase
      .from('validation_etapes')
      .insert(etapes)
      .select();

    if (etapesError) throw etapesError;

    const result = {
      ...workflow,
      etapes: etapesCreated?.map((etape: any) => ({
        id: etape.id,
        workflow_id: etape.workflow_id,
        etape: etape.etape as EtapeType,
        statut: etape.statut as StatutEtape,
        commentaire: etape.commentaire,
        date_validation: etape.date_validation,
        validateur_nom: etape.validateur_nom,
        validateur_role: etape.validateur_role,
        created_at: etape.created_at,
        updated_at: etape.updated_at
      })) || []
    } as ValidationWorkflowWithEtapes;

    // Invalider seulement le cache spécifique
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
    console.log(`Mise à jour rapide étape ${etapeId} vers ${statut}`);

    const updateData = {
      statut,
      commentaire,
      validateur_nom: validateurNom,
      validateur_role: validateurRole,
      date_validation: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('validation_etapes')
      .update(updateData)
      .eq('id', etapeId)
      .select('workflow_id')
      .single();

    if (error) throw error;

    // Invalider seulement les caches pertinents
    const workflowId = data.workflow_id;
    for (const [key] of this._cache) {
      if (key.includes(`workflow_`) || key.includes('stats')) {
        this._cache.delete(key);
      }
    }

    return data;
  },

  // Historique simplifié
  async getHistorique(workflowId: string) {
    const cacheKey = `historique_${workflowId}`;
    const cached = this._getCached(cacheKey, 30000);
    if (cached) return cached;

    console.log(`Chargement historique pour workflow ${workflowId}`);

    const { data, error } = await supabase
      .from('validation_historique')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(50); // Limiter les résultats

    if (error) throw error;
    
    this._setCache(cacheKey, data || []);
    return data || [];
  },

  // Statistiques optimisées avec cache plus long
  async getStatistiquesGlobales() {
    const cacheKey = 'stats_globales';
    const cached = this._getCached(cacheKey, 30000); // Cache 30 secondes
    if (cached) return cached;

    console.log('Chargement rapide des statistiques globales');

    // Requête optimisée avec compteurs directs
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

  // Nettoyage de cache intelligent
  clearCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this._cache) {
        if (key.includes(pattern)) {
          this._cache.delete(key);
        }
      }
    } else {
      this._cache.clear();
    }
    console.log('Cache de validation nettoyé');
  }
};
