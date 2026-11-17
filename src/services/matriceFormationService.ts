import { supabase } from '@/integrations/supabase/client';

export interface MatriceModule {
  id: string;
  annee: number;
  categorie: string;
  module_nom: string;
  position: number;
  actif: boolean;
}

export interface MatriceEntry {
  id: string;
  person_type: 'employe' | 'chauffeur';
  person_id: string;
  categorie: string;
  module_nom: string;
  completed: boolean;
  date_completion: string | null;
  annee: number;
}

export const matriceFormationService = {
  async getModules(annee: number, offset = 0): Promise<MatriceModule[]> {
    const { data, error } = await supabase.from('formations_matrice_modules')
      .select('*').eq('annee', annee).order('position').order('id').range(offset, offset + 999);
    if (error) throw error;
    const rows = data || [];
    return rows.length === 1000 ? [...rows, ...await this.getModules(annee, offset + 1000)] : rows;
  },

  async createModule(annee: number, categories: string[], nom: string, position: number): Promise<void> {
    const { error } = await supabase.from('formations_matrice_modules').insert(
      categories.map(categorie => ({ annee, categorie, module_nom: nom.trim(), position }))
    );
    if (error) throw error;
  },

  async setModuleActive(id: string, actif: boolean): Promise<void> {
    const { error } = await supabase.from('formations_matrice_modules').update({ actif }).eq('id', id);
    if (error) throw error;
  },

  async getByCategorie(categorie: string, annee: number, offset = 0): Promise<MatriceEntry[]> {
    const { data, error } = await supabase
      .from('formations_matrice' as any)
      .select('*')
      .eq('categorie', categorie)
      .eq('annee', annee)
      .order('id')
      .range(offset, offset + 999);
    if (error) throw error;
    const rows = (data || []) as unknown as MatriceEntry[];
    return rows.length === 1000 ? [...rows, ...await this.getByCategorie(categorie, annee, offset + 1000)] : rows;
  },

  async toggleModule(
    personType: 'employe' | 'chauffeur',
    personId: string,
    categorie: string,
    moduleNom: string,
    completed: boolean,
    annee: number
  ): Promise<void> {
    if (completed) {
      const { error } = await supabase
        .from('formations_matrice' as any)
        .upsert(
          {
            person_type: personType,
            person_id: personId,
            categorie,
            module_nom: moduleNom,
            completed: true,
            annee,
            date_completion: new Date().toISOString().split('T')[0],
          },
          { onConflict: 'person_id,categorie,module_nom,annee' }
        );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('formations_matrice' as any)
        .delete()
        .eq('person_id', personId)
        .eq('categorie', categorie)
        .eq('annee', annee)
        .eq('module_nom', moduleNom);
      if (error) throw error;
    }
  },
};
