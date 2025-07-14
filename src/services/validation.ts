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

  // Correction principale de la mise à jour avec gestion d'erreur robuste
  async updateEtapeStatut(
    etapeId: string,
    statut: StatutEtape,
    commentaire: string,
    validateurNom: string,
    validateurRole: string
  ) {
    console.log(`🔄 Mise à jour étape ${etapeId} vers ${statut}`);
    console.log(`👤 Validateur: ${validateurNom} (${validateurRole})`);
    console.log(`💬 Commentaire: ${commentaire}`);

    try {
      // Vérifier que l'étape existe d'abord
      const { data: etapeExiste, error: checkError } = await supabase
        .from('validation_etapes')
        .select('id, workflow_id, etape, statut')
        .eq('id', etapeId)
        .single();

      if (checkError) {
        console.error('❌ Erreur lors de la vérification de l\'étape:', checkError);
        throw new Error(`Étape non trouvée: ${checkError.message}`);
      }

      if (!etapeExiste) {
        throw new Error('Étape non trouvée dans la base de données');
      }

      console.log(`✅ Étape trouvée: ${etapeExiste.etape} (statut actuel: ${etapeExiste.statut})`);

      // Préparer les données de mise à jour
      const updateData = {
        statut,
        commentaire: commentaire?.trim() || null,
        validateur_nom: validateurNom,
        validateur_role: validateurRole,
        date_validation: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Données de mise à jour:', updateData);

      // Effectuer la mise à jour avec une requête plus robuste
      const { data, error } = await supabase
        .from('validation_etapes')
        .update(updateData)
        .eq('id', etapeId)
        .select('workflow_id, etape, statut')
        .single();

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', error);
        console.error('🔍 Code d\'erreur:', error.code);
        console.error('🔍 Message détaillé:', error.message);
        
        // Messages d'erreur plus spécifiques
        if (error.code === '23505') {
          throw new Error('Conflit de données: cette validation a peut-être déjà été mise à jour');
        } else if (error.code === '23503') {
          throw new Error('Référence invalide: workflow ou étape non trouvé');
        } else if (error.message.includes('permission')) {
          throw new Error('Permissions insuffisantes pour cette opération');
        } else if (error.message.includes('constraint')) {
          throw new Error('Contrainte de données violée: vérifiez les valeurs saisies');
        } else {
          throw new Error(`Erreur de base de données: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la mise à jour');
      }

      console.log('✅ Mise à jour réussie:', data);

      // Invalider les caches pertinents
      this.clearCache('workflow_');
      this.clearCache('stats');

      return data;
    } catch (error) {
      console.error('💥 Erreur complète dans updateEtapeStatut:', error);
      
      // Re-lancer l'erreur avec un message plus clair
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erreur inconnue lors de la mise à jour de la validation');
      }
    }
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

  // Nettoyage de cache intelligent amélioré
  clearCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this._cache) {
        if (key.includes(pattern)) {
          this._cache.delete(key);
        }
      }
      console.log(`🧹 Cache nettoyé pour le pattern: ${pattern}`);
    } else {
      this._cache.clear();
      console.log('🧹 Cache complètement nettoyé');
    }
  }
};
