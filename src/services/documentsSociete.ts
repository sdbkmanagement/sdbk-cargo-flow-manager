import { supabase } from '@/integrations/supabase/client';

export interface Societe {
  id: string;
  nom: string;
  siret?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  logo_url?: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentSocieteCategorie {
  id: string;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
  ordre: number;
  created_at: string;
}

export interface DocumentSociete {
  id: string;
  societe_id?: string;
  categorie_id?: string;
  nom: string;
  type_document: string;
  description?: string;
  date_creation: string;
  date_delivrance?: string;
  date_expiration?: string;
  autorite_emettrice?: string;
  numero_reference?: string;
  commentaires?: string;
  statut: 'valide' | 'expire' | 'en_renouvellement' | 'archive';
  alerte_30j_envoyee: boolean;
  alerte_15j_envoyee: boolean;
  alerte_7j_envoyee: boolean;
  version_actuelle: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  societe?: Societe;
  categorie?: DocumentSocieteCategorie;
  fichiers?: DocumentSocieteFichier[];
}

export interface DocumentSocieteFichier {
  id: string;
  document_id: string;
  nom_fichier: string;
  nom_original?: string;
  url: string;
  type_mime?: string;
  taille?: number;
  ordre: number;
  created_at: string;
}

export interface DocumentSocieteVersion {
  id: string;
  document_id: string;
  numero_version: number;
  nom?: string;
  description?: string;
  fichiers?: any;
  date_modification: string;
  modifie_par?: string;
  modifie_par_nom?: string;
  motif_modification?: string;
}

export interface DocumentSocieteAudit {
  id: string;
  document_id?: string;
  societe_id?: string;
  action: string;
  details?: any;
  utilisateur_id?: string;
  utilisateur_nom?: string;
  ip_address?: unknown;
  created_at: string;
}

export const documentsSocieteService = {
  // ========== SOCIETES ==========
  async getSocietes(): Promise<Societe[]> {
    const { data, error } = await supabase
      .from('societes')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data || [];
  },

  async createSociete(societe: { nom: string } & Partial<Societe>): Promise<Societe> {
    const { data, error } = await supabase
      .from('societes')
      .insert([societe])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSociete(id: string, societe: Partial<Societe>): Promise<Societe> {
    const { data, error } = await supabase
      .from('societes')
      .update(societe)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== CATEGORIES ==========
  async getCategories(): Promise<DocumentSocieteCategorie[]> {
    const { data, error } = await supabase
      .from('documents_societe_categories')
      .select('*')
      .order('ordre');
    
    if (error) throw error;
    return data || [];
  },

  async createCategorie(categorie: { nom: string } & Partial<DocumentSocieteCategorie>): Promise<DocumentSocieteCategorie> {
    const { data, error } = await supabase
      .from('documents_societe_categories')
      .insert([categorie])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== DOCUMENTS ==========
  async getDocuments(filters?: {
    societe_id?: string;
    categorie_id?: string;
    statut?: string;
    search?: string;
  }): Promise<DocumentSociete[]> {
    let query = supabase
      .from('documents_societe')
      .select(`
        *,
        societe:societes(*),
        categorie:documents_societe_categories(*),
        fichiers:documents_societe_fichiers(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.societe_id) {
      query = query.eq('societe_id', filters.societe_id);
    }
    if (filters?.categorie_id) {
      query = query.eq('categorie_id', filters.categorie_id);
    }
    if (filters?.statut && ['valide', 'expire', 'en_renouvellement', 'archive'].includes(filters.statut)) {
      query = query.eq('statut', filters.statut as 'valide' | 'expire' | 'en_renouvellement' | 'archive');
    }
    if (filters?.search) {
      query = query.ilike('nom', `%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as unknown as DocumentSociete[];
  },

  async getDocument(id: string): Promise<DocumentSociete | null> {
    const { data, error } = await supabase
      .from('documents_societe')
      .select(`
        *,
        societe:societes(*),
        categorie:documents_societe_categories(*),
        fichiers:documents_societe_fichiers(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as unknown as DocumentSociete;
  },

  async createDocument(document: { nom: string; type_document: string } & Partial<DocumentSociete>, userId?: string): Promise<DocumentSociete> {
    const { data, error } = await supabase
      .from('documents_societe')
      .insert([{
        nom: document.nom,
        type_document: document.type_document,
        societe_id: document.societe_id,
        categorie_id: document.categorie_id,
        description: document.description,
        date_delivrance: document.date_delivrance,
        date_expiration: document.date_expiration,
        autorite_emettrice: document.autorite_emettrice,
        numero_reference: document.numero_reference,
        commentaires: document.commentaires,
        created_by: userId,
        updated_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Log audit
    await this.logAudit('creation', data.id, document.societe_id, { nom: document.nom }, userId);

    return data;
  },

  async updateDocument(id: string, document: Partial<DocumentSociete>, userId?: string, motif?: string): Promise<DocumentSociete> {
    // Récupérer l'ancienne version pour l'historique
    const oldDoc = await this.getDocument(id);
    
    if (oldDoc) {
      // Sauvegarder la version actuelle
      await supabase
        .from('documents_societe_versions')
        .insert([{
          document_id: id,
          numero_version: oldDoc.version_actuelle,
          nom: oldDoc.nom,
          description: oldDoc.description,
          fichiers: oldDoc.fichiers,
          modifie_par: userId,
          motif_modification: motif || 'Mise à jour'
        }]);
    }

    const { data, error } = await supabase
      .from('documents_societe')
      .update({
        ...document,
        updated_by: userId,
        version_actuelle: (oldDoc?.version_actuelle || 1) + 1
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Log audit
    await this.logAudit('modification', id, document.societe_id, { nom: document.nom, motif }, userId);

    return data;
  },

  async deleteDocument(id: string, userId?: string): Promise<void> {
    const doc = await this.getDocument(id);

    // Supprimer les fichiers du storage
    if (doc?.fichiers) {
      for (const fichier of doc.fichiers) {
        await this.deleteFile(fichier.url);
      }
    }

    const { error } = await supabase
      .from('documents_societe')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Log audit
    await this.logAudit('suppression', id, doc?.societe_id, { nom: doc?.nom }, userId);
  },

  // ========== FICHIERS ==========
  async uploadFile(
    file: File,
    documentId: string,
    ordre: number = 0
  ): Promise<DocumentSocieteFichier> {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `societe-documents/${documentId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('documents_societe_fichiers')
      .insert([{
        document_id: documentId,
        nom_fichier: fileName,
        nom_original: file.name,
        url: publicUrl,
        type_mime: file.type,
        taille: file.size,
        ordre
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFichier(fichierId: string): Promise<void> {
    const { data: fichier } = await supabase
      .from('documents_societe_fichiers')
      .select('*')
      .eq('id', fichierId)
      .single();

    if (fichier) {
      await this.deleteFile(fichier.url);
    }

    const { error } = await supabase
      .from('documents_societe_fichiers')
      .delete()
      .eq('id', fichierId);

    if (error) throw error;
  },

  async deleteFile(url: string): Promise<void> {
    try {
      const fileName = url.split('/documents/')[1];
      if (fileName) {
        await supabase.storage.from('documents').remove([fileName]);
      }
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
    }
  },

  // ========== VERSIONS ==========
  async getVersions(documentId: string): Promise<DocumentSocieteVersion[]> {
    const { data, error } = await supabase
      .from('documents_societe_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('numero_version', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ========== AUDIT ==========
  async logAudit(action: string, documentId?: string, societeId?: string, details?: any, userId?: string): Promise<void> {
    try {
      await supabase
        .from('documents_societe_audit')
        .insert([{
          action,
          document_id: documentId,
          societe_id: societeId,
          details,
          utilisateur_id: userId
        }]);
    } catch (error) {
      console.error('Erreur log audit:', error);
    }
  },

  async getAuditLogs(filters?: {
    document_id?: string;
    societe_id?: string;
  }): Promise<DocumentSocieteAudit[]> {
    let query = supabase
      .from('documents_societe_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.document_id) {
      query = query.eq('document_id', filters.document_id);
    }
    if (filters?.societe_id) {
      query = query.eq('societe_id', filters.societe_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DocumentSocieteAudit[];
  },

  // ========== ALERTES ==========
  async getDocumentsExpirant(jours: number = 30): Promise<DocumentSociete[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() + jours);

    const { data, error } = await supabase
      .from('documents_societe')
      .select(`
        *,
        societe:societes(*),
        categorie:documents_societe_categories(*)
      `)
      .not('date_expiration', 'is', null)
      .lte('date_expiration', dateLimit.toISOString().split('T')[0])
      .gte('date_expiration', new Date().toISOString().split('T')[0])
      .order('date_expiration');

    if (error) throw error;
    return (data || []) as unknown as DocumentSociete[];
  },

  async getDocumentsExpires(): Promise<DocumentSociete[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('documents_societe')
      .select(`
        *,
        societe:societes(*),
        categorie:documents_societe_categories(*)
      `)
      .lt('date_expiration', today)
      .order('date_expiration');

    if (error) throw error;
    return (data || []) as unknown as DocumentSociete[];
  },

  // ========== STATS ==========
  async getStats(): Promise<{
    total: number;
    valides: number;
    expires: number;
    aRenouveler: number;
    parCategorie: { categorie: string; count: number }[];
  }> {
    const { data: documents } = await supabase
      .from('documents_societe')
      .select('statut, categorie:documents_societe_categories(nom)');

    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const { data: expirant } = await supabase
      .from('documents_societe')
      .select('id')
      .not('date_expiration', 'is', null)
      .lte('date_expiration', in30Days.toISOString().split('T')[0])
      .gte('date_expiration', today.toISOString().split('T')[0]);

    const stats = {
      total: documents?.length || 0,
      valides: documents?.filter(d => d.statut === 'valide').length || 0,
      expires: documents?.filter(d => d.statut === 'expire').length || 0,
      aRenouveler: expirant?.length || 0,
      parCategorie: [] as { categorie: string; count: number }[]
    };

    // Grouper par catégorie
    const categorieMap = new Map<string, number>();
    documents?.forEach(d => {
      const cat = (d.categorie as any)?.nom || 'Sans catégorie';
      categorieMap.set(cat, (categorieMap.get(cat) || 0) + 1);
    });

    stats.parCategorie = Array.from(categorieMap.entries()).map(([categorie, count]) => ({
      categorie,
      count
    }));

    return stats;
  }
};
