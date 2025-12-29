import { supabase } from '@/integrations/supabase/client';
import { 
  SafeToLoadControl, 
  SafeToLoadItem, 
  NonConformite, 
  NCHistorique,
  HSEQStats,
  SAFE_TO_LOAD_CATEGORIES 
} from '@/types/hseq';

export const hseqService = {
  // =====================================================
  // SAFE TO LOAD CONTROLS
  // =====================================================
  
  async getControls(filters?: {
    vehiculeId?: string;
    chauffeurId?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
  }): Promise<SafeToLoadControl[]> {
    let query = supabase
      .from('safe_to_load_controls')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom),
        controleur:users!controleur_id(id, first_name, last_name),
        items:safe_to_load_items(*)
      `)
      .order('date_controle', { ascending: false });

    if (filters?.vehiculeId) {
      query = query.eq('vehicule_id', filters.vehiculeId);
    }
    if (filters?.chauffeurId) {
      query = query.eq('chauffeur_id', filters.chauffeurId);
    }
    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters?.dateDebut) {
      query = query.gte('date_controle', filters.dateDebut);
    }
    if (filters?.dateFin) {
      query = query.lte('date_controle', filters.dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as SafeToLoadControl[];
  },

  async getControlById(id: string): Promise<SafeToLoadControl | null> {
    const { data, error } = await supabase
      .from('safe_to_load_controls')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom),
        controleur:users!controleur_id(id, first_name, last_name),
        items:safe_to_load_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as SafeToLoadControl;
  },

  async createControl(data: {
    vehicule_id: string;
    chauffeur_id: string;
    lieu_controle?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<SafeToLoadControl> {
    // Récupérer l'utilisateur actuel comme contrôleur
    const { data: { user } } = await supabase.auth.getUser();

    // Créer le contrôle
    const { data: control, error: controlError } = await supabase
      .from('safe_to_load_controls')
      .insert({
        vehicule_id: data.vehicule_id,
        chauffeur_id: data.chauffeur_id,
        controleur_id: user?.id,
        lieu_controle: data.lieu_controle,
        latitude: data.latitude,
        longitude: data.longitude,
        statut: 'en_cours',
      })
      .select()
      .single();

    if (controlError) throw controlError;

    // Créer tous les items de contrôle
    const items = SAFE_TO_LOAD_CATEGORIES.flatMap(category =>
      category.checkpoints.map(checkpoint => ({
        control_id: control.id,
        categorie: category.libelle,
        code_point: checkpoint.code,
        libelle: checkpoint.libelle,
        is_critical: checkpoint.critical,
        is_conforme: null,
        photos: [],
      }))
    );

    const { error: itemsError } = await supabase
      .from('safe_to_load_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return control as SafeToLoadControl;
  },

  async updateControlItem(
    itemId: string, 
    updates: {
      is_conforme?: boolean;
      commentaire?: string;
      photos?: string[];
    }
  ): Promise<SafeToLoadItem> {
    const { data, error } = await supabase
      .from('safe_to_load_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as SafeToLoadItem;
  },

  async signControl(
    controlId: string,
    type: 'controleur' | 'chauffeur',
    signatureUrl?: string
  ): Promise<void> {
    const updates = type === 'controleur' 
      ? {
          signature_controleur_url: signatureUrl,
          signature_controleur_date: new Date().toISOString(),
          confirmation_controleur: true,
        }
      : {
          signature_chauffeur_url: signatureUrl,
          signature_chauffeur_date: new Date().toISOString(),
          confirmation_chauffeur: true,
        };

    const { error } = await supabase
      .from('safe_to_load_controls')
      .update(updates)
      .eq('id', controlId);

    if (error) throw error;
  },

  async finalizeControl(controlId: string, observations?: string): Promise<void> {
    const { error } = await supabase
      .from('safe_to_load_controls')
      .update({ observations })
      .eq('id', controlId);

    if (error) throw error;
  },

  async checkVehiculeHasValidSTL(vehiculeId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_valid_safe_to_load', {
      p_vehicule_id: vehiculeId
    });

    if (error) {
      console.error('Erreur vérification STL:', error);
      return false;
    }

    return data === true;
  },

  // =====================================================
  // NON-CONFORMITÉS
  // =====================================================

  async getNonConformites(filters?: {
    vehiculeId?: string;
    type_nc?: string;
    statut?: string;
  }): Promise<NonConformite[]> {
    let query = supabase
      .from('non_conformites')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom)
      `)
      .order('date_detection', { ascending: false });

    if (filters?.vehiculeId) {
      query = query.eq('vehicule_id', filters.vehiculeId);
    }
    if (filters?.type_nc) {
      query = query.eq('type_nc', filters.type_nc);
    }
    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as NonConformite[];
  },

  async getNonConformiteById(id: string): Promise<NonConformite | null> {
    const { data, error } = await supabase
      .from('non_conformites')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as NonConformite;
  },

  async createNonConformite(nc: {
    safe_to_load_id?: string;
    vehicule_id?: string;
    chauffeur_id?: string;
    type_nc: string;
    categorie?: string;
    description: string;
    service_responsable?: string;
    date_echeance?: string;
    photos?: string[];
  }): Promise<NonConformite> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('non_conformites')
      .insert({
        ...nc,
        numero: '', // Auto-généré par trigger
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as NonConformite;
  },

  async updateNonConformite(
    id: string, 
    updates: Partial<NonConformite>
  ): Promise<NonConformite> {
    const { data, error } = await supabase
      .from('non_conformites')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as NonConformite;
  },

  async getNonConformiteHistorique(ncId: string): Promise<NCHistorique[]> {
    const { data, error } = await supabase
      .from('non_conformites_historique')
      .select('*')
      .eq('non_conformite_id', ncId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as NCHistorique[];
  },

  // =====================================================
  // STATISTIQUES
  // =====================================================

  async getStats(dateDebut?: string, dateFin?: string): Promise<HSEQStats> {
    let controlsQuery = supabase
      .from('safe_to_load_controls')
      .select('statut');

    let ncQuery = supabase
      .from('non_conformites')
      .select('type_nc, statut');

    if (dateDebut) {
      controlsQuery = controlsQuery.gte('date_controle', dateDebut);
      ncQuery = ncQuery.gte('date_detection', dateDebut);
    }
    if (dateFin) {
      controlsQuery = controlsQuery.lte('date_controle', dateFin);
      ncQuery = ncQuery.lte('date_detection', dateFin);
    }

    const [controlsResult, ncResult] = await Promise.all([
      controlsQuery,
      ncQuery,
    ]);

    if (controlsResult.error) throw controlsResult.error;
    if (ncResult.error) throw ncResult.error;

    const controls = controlsResult.data || [];
    const ncs = ncResult.data || [];

    const totalControles = controls.length;
    const conformes = controls.filter(c => c.statut === 'conforme').length;
    const nonConformes = controls.filter(c => c.statut === 'non_conforme').length;
    const refuses = controls.filter(c => c.statut === 'refuse').length;
    
    const ncOuvertes = ncs.filter(nc => nc.statut === 'ouverte').length;
    const ncCritiques = ncs.filter(nc => nc.type_nc === 'critique' && nc.statut !== 'fermee').length;
    const ncEnCours = ncs.filter(nc => nc.statut === 'en_cours').length;

    return {
      totalControles,
      conformes,
      nonConformes,
      refuses,
      tauxConformite: totalControles > 0 ? (conformes / totalControles) * 100 : 0,
      ncOuvertes,
      ncCritiques,
      ncEnCours,
    };
  },

  // =====================================================
  // UPLOAD FICHIERS
  // =====================================================

  async uploadSignature(
    controlId: string, 
    type: 'controleur' | 'chauffeur',
    blob: Blob
  ): Promise<string> {
    const fileName = `signatures/${controlId}/${type}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('hseq-documents')
      .upload(fileName, blob, { contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('hseq-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async uploadPhoto(controlId: string, file: File): Promise<string> {
    const fileName = `photos/${controlId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('hseq-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('hseq-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // =====================================================
  // GÉOLOCALISATION
  // =====================================================

  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },

  // =====================================================
  // STOCKAGE LOCAL (MODE HORS-LIGNE)
  // =====================================================

  saveControlLocally(control: SafeToLoadControl): void {
    const pendingControls = this.getPendingControls();
    pendingControls.push({ ...control, sync_status: 'pending' });
    localStorage.setItem('hseq_pending_controls', JSON.stringify(pendingControls));
  },

  getPendingControls(): SafeToLoadControl[] {
    const stored = localStorage.getItem('hseq_pending_controls');
    return stored ? JSON.parse(stored) : [];
  },

  async syncPendingControls(): Promise<number> {
    const pending = this.getPendingControls();
    let synced = 0;

    for (const control of pending) {
      try {
        await this.createControl({
          vehicule_id: control.vehicule_id,
          chauffeur_id: control.chauffeur_id,
          lieu_controle: control.lieu_controle,
          latitude: control.latitude,
          longitude: control.longitude,
        });
        synced++;
      } catch (error) {
        console.error('Erreur sync contrôle:', error);
      }
    }

    if (synced === pending.length) {
      localStorage.removeItem('hseq_pending_controls');
    } else {
      const remaining = pending.slice(synced);
      localStorage.setItem('hseq_pending_controls', JSON.stringify(remaining));
    }

    return synced;
  },

  isOnline(): boolean {
    return navigator.onLine;
  },
};
