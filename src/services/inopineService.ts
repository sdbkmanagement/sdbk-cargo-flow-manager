import { supabase } from '@/integrations/supabase/client';
import { 
  ControleInopine, 
  ControleInopineItem, 
  InopineStats,
  INOPINE_CATEGORIES 
} from '@/types/inopine';

export const inopineService = {
  // =====================================================
  // CONTRÔLES INOPINÉS
  // =====================================================
  
  async getControls(filters?: {
    vehiculeId?: string;
    chauffeurId?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
  }): Promise<ControleInopine[]> {
    let query = supabase
      .from('controles_inopines')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom),
        controleur:users!controleur_id(id, first_name, last_name),
        items:controles_inopines_items(*)
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
    return data as unknown as ControleInopine[];
  },

  async getControlById(id: string): Promise<ControleInopine | null> {
    const { data, error } = await supabase
      .from('controles_inopines')
      .select(`
        *,
        vehicule:vehicules(id, numero, immatriculation),
        chauffeur:chauffeurs(id, nom, prenom),
        controleur:users!controleur_id(id, first_name, last_name),
        items:controles_inopines_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as ControleInopine;
  },

  async createControl(data: {
    vehicule_id: string;
    chauffeur_id: string;
    lieu_controle?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<ControleInopine> {
    // Récupérer l'utilisateur actuel comme contrôleur
    const { data: { user } } = await supabase.auth.getUser();

    // Créer le contrôle
    const { data: control, error: controlError } = await supabase
      .from('controles_inopines')
      .insert({
        vehicule_id: data.vehicule_id,
        chauffeur_id: data.chauffeur_id,
        controleur_id: user?.id,
        lieu_controle: data.lieu_controle,
        latitude: data.latitude,
        longitude: data.longitude,
        type_controle: 'INOPINE',
        statut: 'en_cours',
      })
      .select()
      .single();

    if (controlError) throw controlError;

    // Créer tous les items de contrôle
    const items = INOPINE_CATEGORIES.flatMap(category =>
      category.checkpoints.map(checkpoint => ({
        control_id: control.id,
        categorie: category.libelle,
        code_point: checkpoint.code,
        libelle: checkpoint.libelle,
        is_critical: checkpoint.critical,
        is_conforme: null,
        medias: [],
      }))
    );

    const { error: itemsError } = await supabase
      .from('controles_inopines_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return control as ControleInopine;
  },

  async updateControlItem(
    itemId: string, 
    updates: {
      is_conforme?: boolean;
      commentaire?: string;
      medias?: string[];
    }
  ): Promise<ControleInopineItem> {
    const { data, error } = await supabase
      .from('controles_inopines_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as ControleInopineItem;
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
      .from('controles_inopines')
      .update(updates)
      .eq('id', controlId);

    if (error) throw error;
  },

  async finalizeControl(controlId: string, observations?: string): Promise<void> {
    const { error } = await supabase
      .from('controles_inopines')
      .update({ observations })
      .eq('id', controlId);

    if (error) throw error;
  },

  // =====================================================
  // STATISTIQUES
  // =====================================================

  async getStats(dateDebut?: string, dateFin?: string): Promise<InopineStats> {
    let query = supabase
      .from('controles_inopines')
      .select('statut');

    if (dateDebut) {
      query = query.gte('date_controle', dateDebut);
    }
    if (dateFin) {
      query = query.lte('date_controle', dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;

    const controls = data || [];
    const totalControles = controls.length;
    const conformes = controls.filter(c => c.statut === 'conforme').length;
    const conformesAvecReserve = controls.filter(c => c.statut === 'conforme_avec_reserve').length;
    const nonConformes = controls.filter(c => c.statut === 'non_conforme').length;
    
    return {
      totalControles,
      conformes,
      conformesAvecReserve,
      nonConformes,
      tauxConformite: totalControles > 0 ? ((conformes + conformesAvecReserve) / totalControles) * 100 : 0,
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
    const fileName = `inopine/signatures/${controlId}/${type}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('hseq-documents')
      .upload(fileName, blob, { contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('hseq-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async uploadMedia(controlId: string, file: File): Promise<string> {
    const fileName = `inopine/medias/${controlId}/${Date.now()}_${file.name}`;
    
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
};
