import { supabase } from '@/integrations/supabase/client';

export interface ThemeFormation {
  id: string;
  nom: string;
  description: string | null;
  duree_validite: number;
  obligatoire: boolean;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  chauffeur_id: string;
  theme_id: string;
  date_formation: string;
  date_recyclage: string | null;
  formateur_nom: string | null;
  signature_chauffeur: string | null;
  signature_formateur: string | null;
  commentaire: string | null;
  note_obtenue: number | null;
  statut: 'valide' | 'a_renouveler' | 'expire';
  created_at: string;
  updated_at: string;
  // Joined
  themes_formation?: ThemeFormation;
  chauffeurs?: { id: string; nom: string; prenom: string; matricule: string | null; telephone: string; statut: string | null };
}

export const formationsService = {
  // Thèmes
  async getThemes(): Promise<ThemeFormation[]> {
    const { data, error } = await supabase
      .from('themes_formation' as any)
      .select('*')
      .eq('actif', true)
      .order('nom');
    if (error) throw error;
    return (data || []) as any;
  },

  async createTheme(theme: Partial<ThemeFormation>): Promise<ThemeFormation> {
    const { data, error } = await supabase
      .from('themes_formation' as any)
      .insert([theme])
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async updateTheme(id: string, updates: Partial<ThemeFormation>): Promise<ThemeFormation> {
    const { data, error } = await supabase
      .from('themes_formation' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async deleteTheme(id: string): Promise<void> {
    const { error } = await supabase
      .from('themes_formation' as any)
      .update({ actif: false })
      .eq('id', id);
    if (error) throw error;
  },

  // Formations
  async getAll(): Promise<Formation[]> {
    const { data, error } = await supabase
      .from('formations' as any)
      .select(`
        *,
        themes_formation(*),
        chauffeurs(id, nom, prenom, matricule, telephone, statut)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any;
  },

  async getByChauffeur(chauffeurId: string): Promise<Formation[]> {
    const { data, error } = await supabase
      .from('formations' as any)
      .select(`
        *,
        themes_formation(*)
      `)
      .eq('chauffeur_id', chauffeurId)
      .order('date_formation', { ascending: false });
    if (error) throw error;
    return (data || []) as any;
  },

  async create(formation: {
    chauffeur_id: string;
    theme_id: string;
    date_formation: string;
    formateur_nom?: string;
    signature_chauffeur?: string;
    signature_formateur?: string;
    commentaire?: string;
    note_obtenue?: number;
  }): Promise<Formation> {
    const { data, error } = await supabase
      .from('formations' as any)
      .insert([formation])
      .select(`*, themes_formation(*)`)
      .single();
    if (error) throw error;
    return data as any;
  },

  async update(id: string, updates: Partial<Formation>): Promise<Formation> {
    const { data, error } = await supabase
      .from('formations' as any)
      .update(updates)
      .eq('id', id)
      .select(`*, themes_formation(*)`)
      .single();
    if (error) throw error;
    return data as any;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('formations' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Vérifier la conformité d'un chauffeur (formations obligatoires valides)
  async checkConformite(chauffeurId: string): Promise<{ conforme: boolean; formationsManquantes: string[]; score: number }> {
    const [themes, formations] = await Promise.all([
      this.getThemes(),
      this.getByChauffeur(chauffeurId)
    ]);

    const themesObligatoires = themes.filter(t => t.obligatoire);
    const formationsManquantes: string[] = [];

    for (const theme of themesObligatoires) {
      const formation = formations.find(f => f.theme_id === theme.id);
      if (!formation || formation.statut === 'expire') {
        formationsManquantes.push(theme.nom);
      }
    }

    const totalThemes = themes.length;
    const formationsValides = formations.filter(f => f.statut === 'valide').length;
    const score = totalThemes > 0 ? Math.round((formationsValides / totalThemes) * 100) : 0;

    return {
      conforme: formationsManquantes.length === 0,
      formationsManquantes,
      score
    };
  },

  // Stats globales
  async getStats(): Promise<{
    totalFormations: number;
    valides: number;
    aRenouveler: number;
    expirees: number;
    tauxConformite: number;
  }> {
    const formations = await this.getAll();
    const valides = formations.filter(f => f.statut === 'valide').length;
    const aRenouveler = formations.filter(f => f.statut === 'a_renouveler').length;
    const expirees = formations.filter(f => f.statut === 'expire').length;

    return {
      totalFormations: formations.length,
      valides,
      aRenouveler,
      expirees,
      tauxConformite: formations.length > 0 ? Math.round((valides / formations.length) * 100) : 100
    };
  }
};
