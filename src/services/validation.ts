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
  
  _getCached(key: string, maxAge: number = 10000) {
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

  // Fonction pour vérifier si l'utilisateur peut créer des workflows
  async canCreateWorkflow(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userData, error } = await supabase
        .from('users')
        .select('roles, status')
        .eq('id', user.id)
        .single();

      if (error || !userData) return false;

      const validRoles = ['admin', 'maintenance', 'hsecq', 'obc', 'administratif'];
      return userData.status === 'active' && 
             userData.roles.some((role: string) => validRoles.includes(role));
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  },

  // Optimisation: Récupérer les workflows avec pagination légère
  async getWorkflowsPaginated(page: number = 1, limit: number = 20) {
    const cacheKey = `workflows_${page}_${limit}`;
    const cached = this._getCached(cacheKey, 5000);
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

  // Récupérer un workflow spécifique avec gestion améliorée des erreurs
  async getWorkflowByVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes | null> {
    const cacheKey = `workflow_${vehiculeId}`;
    const cached = this._getCached(cacheKey, 5000);
    if (cached) return cached;

    console.log(`Chargement workflow pour véhicule ${vehiculeId}`);

    try {
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

      if (error) {
        console.error('Erreur lors de la récupération du workflow:', error);
        throw error;
      }

      if (!data) {
        console.log(`Aucun workflow trouvé pour le véhicule ${vehiculeId}, création automatique...`);
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
    } catch (error) {
      console.error('Erreur complète lors de la récupération du workflow:', error);
      throw error;
    }
  },

  // Créer un workflow avec gestion des permissions améliorée
  async createWorkflowForVehicule(vehiculeId: string): Promise<ValidationWorkflowWithEtapes> {
    console.log(`Création workflow pour véhicule ${vehiculeId}`);

    // Vérifier les permissions avant la création
    const canCreate = await this.canCreateWorkflow();
    if (!canCreate) {
      throw new Error('Permissions insuffisantes pour créer un workflow de validation');
    }

    try {
      // Vérifier si le véhicule existe
      const { data: vehicule, error: vehiculeError } = await supabase
        .from('vehicules')
        .select('id')
        .eq('id', vehiculeId)
        .single();

      if (vehiculeError || !vehicule) {
        throw new Error(`Véhicule avec l'ID ${vehiculeId} non trouvé`);
      }

      // Créer le workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('validation_workflows')
        .insert({
          vehicule_id: vehiculeId,
          statut_global: 'en_validation'
        })
        .select()
        .single();

      if (workflowError) {
        console.error('Erreur lors de la création du workflow:', workflowError);
        throw new Error(`Erreur lors de la création du workflow: ${workflowError.message}`);
      }

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

      if (etapesError) {
        console.error('Erreur lors de la création des étapes:', etapesError);
        // Nettoyer le workflow créé en cas d'erreur
        await supabase.from('validation_workflows').delete().eq('id', workflow.id);
        throw new Error(`Erreur lors de la création des étapes: ${etapesError.message}`);
      }

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

      console.log('✅ Workflow créé avec succès:', result);
      
      // Invalider le cache
      this._cache.delete(`workflow_${vehiculeId}`);
      
      return result;
    } catch (error) {
      console.error('💥 Erreur lors de la création du workflow:', error);
      throw error;
    }
  },

  // Fonction améliorée pour la mise à jour avec gestion du statut véhicule
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
      // Récupérer l'état actuel de l'étape pour l'historique
      const { data: etapeActuelle, error: checkError } = await supabase
        .from('validation_etapes')
        .select('id, workflow_id, etape, statut, commentaire, validateur_nom, validateur_role')
        .eq('id', etapeId)
        .single();

      if (checkError) {
        console.error('❌ Erreur lors de la vérification de l\'étape:', checkError);
        throw new Error(`Étape non trouvée: ${checkError.message}`);
      }

      if (!etapeActuelle) {
        throw new Error('Étape non trouvée dans la base de données');
      }

      console.log(`✅ Étape trouvée: ${etapeActuelle.etape} (statut actuel: ${etapeActuelle.statut})`);

      // Ajouter à l'historique avant la mise à jour
      const historiqueData = {
        workflow_id: etapeActuelle.workflow_id,
        etape: etapeActuelle.etape,
        ancien_statut: etapeActuelle.statut,
        nouveau_statut: statut,
        commentaire: commentaire?.trim() || null,
        validateur_nom: validateurNom,
        validateur_role: validateurRole
      };

      console.log('📝 Ajout à l\'historique:', historiqueData);

      const { error: historiqueError } = await supabase
        .from('validation_historique')
        .insert(historiqueData);

      if (historiqueError) {
        console.error('❌ Erreur lors de l\'ajout à l\'historique:', historiqueError);
        throw new Error(`Erreur historique: ${historiqueError.message}`);
      }

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

      // Effectuer la mise à jour
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

      // Vérifier si toutes les étapes du workflow sont validées
      await this.checkAndUpdateVehicleStatus(data.workflow_id);

      // Invalider les caches pertinents
      this.clearCache('workflow_');
      this.clearCache('stats');

      return data;
    } catch (error) {
      console.error('💥 Erreur complète dans updateEtapeStatut:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erreur inconnue lors de la mise à jour de la validation');
      }
    }
  },

  // Nouvelle méthode pour vérifier et mettre à jour le statut du véhicule
  async checkAndUpdateVehicleStatus(workflowId: string) {
    console.log(`🔍 Vérification du statut global pour workflow ${workflowId}`);

    try {
      // Récupérer le workflow avec ses étapes
      const { data: workflow, error: workflowError } = await supabase
        .from('validation_workflows')
        .select(`
          id,
          vehicule_id,
          statut_global,
          etapes:validation_etapes(
            id,
            etape,
            statut
          )
        `)
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflow) {
        console.error('❌ Erreur lors de la récupération du workflow:', workflowError);
        return;
      }

      console.log(`📊 Workflow trouvé avec ${workflow.etapes.length} étapes`);

      // Vérifier si toutes les étapes sont validées
      const etapesValidees = workflow.etapes.filter(etape => etape.statut === 'valide');
      const etapesRejetees = workflow.etapes.filter(etape => etape.statut === 'rejete');
      
      console.log(`✅ ${etapesValidees.length} étapes validées`);
      console.log(`❌ ${etapesRejetees.length} étapes rejetées`);

      let nouveauStatutGlobal = 'en_validation';
      let nouveauStatutVehicule = 'validation_requise';

      // Déterminer le nouveau statut
      if (etapesRejetees.length > 0) {
        nouveauStatutGlobal = 'rejete';
        nouveauStatutVehicule = 'indisponible';
      } else if (etapesValidees.length === workflow.etapes.length) {
        nouveauStatutGlobal = 'valide';
        nouveauStatutVehicule = 'disponible';
      }

      console.log(`🎯 Nouveau statut global: ${nouveauStatutGlobal}`);
      console.log(`🚗 Nouveau statut véhicule: ${nouveauStatutVehicule}`);

      // Mettre à jour le workflow si nécessaire
      if (workflow.statut_global !== nouveauStatutGlobal) {
        const { error: updateWorkflowError } = await supabase
          .from('validation_workflows')
          .update({ 
            statut_global: nouveauStatutGlobal,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId);

        if (updateWorkflowError) {
          console.error('❌ Erreur lors de la mise à jour du workflow:', updateWorkflowError);
        } else {
          console.log('✅ Workflow mis à jour avec succès');
        }
      }

      // Mettre à jour le statut du véhicule
      const { error: updateVehiculeError } = await supabase
        .from('vehicules')
        .update({ 
          statut: nouveauStatutVehicule,
          validation_requise: nouveauStatutVehicule === 'validation_requise',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.vehicule_id);

      if (updateVehiculeError) {
        console.error('❌ Erreur lors de la mise à jour du véhicule:', updateVehiculeError);
      } else {
        console.log(`✅ Véhicule ${workflow.vehicule_id} mis à jour vers statut: ${nouveauStatutVehicule}`);
      }

      // Invalider les caches des véhicules
      this.clearCache('vehicules');
      
    } catch (error) {
      console.error('💥 Erreur lors de la vérification du statut:', error);
    }
  },

  // Historique amélioré avec plus de détails
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
      .limit(100);

    if (error) throw error;
    
    this._setCache(cacheKey, data || []);
    return data || [];
  },

  // Statistiques basées sur les workflows de validation (source de vérité)
  async getStatistiquesGlobales() {
    console.log('🔄 Chargement des statistiques globales de validation...');

    try {
      // Récupérer TOUS les workflows de validation
      const { data: workflows, error: workflowsError } = await supabase
        .from('validation_workflows')
        .select('id, vehicule_id, statut_global');

      if (workflowsError) {
        console.error('❌ Erreur lors de la récupération des workflows:', workflowsError);
        throw workflowsError;
      }

      console.log(`📊 ${workflows?.length || 0} workflows trouvés au total`);
      
      // Compter les véhicules par statut de workflow (source de vérité)
      let enValidation = 0;
      let valides = 0;
      let rejetes = 0;

      workflows?.forEach(workflow => {
        console.log(`📋 Workflow ${workflow.id}: statut_global=${workflow.statut_global}`);
        
        if (workflow.statut_global === 'en_validation') {
          enValidation++;
        } else if (workflow.statut_global === 'valide') {
          valides++;
        } else if (workflow.statut_global === 'rejete') {
          rejetes++;
        }
      });

      // Le total comprend tous les workflows
      const total = workflows?.length || 0;

      const stats = {
        total: total,
        en_validation: enValidation,
        valides: valides,
        rejetes: rejetes
      };

      console.log('✅ Statistiques finales calculées:', stats);
      console.log(`🔍 Détail final: Total=${stats.total}, En validation=${stats.en_validation}, Validés=${stats.valides}, Rejetés=${stats.rejetes}`);
      
      this._setCache('stats_globales', stats);
      return stats;

    } catch (error) {
      console.error('💥 Erreur lors du calcul des statistiques:', error);
      
      // Retourner des statistiques par défaut en cas d'erreur
      return { total: 0, en_validation: 0, valides: 0, rejetes: 0 };
    }
  },

  // Nettoyage de cache intelligent
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
