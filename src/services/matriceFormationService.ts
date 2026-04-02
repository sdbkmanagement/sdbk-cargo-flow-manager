import { supabase } from '@/integrations/supabase/client';

export const MODULES_ADMINISTRATION = [
  'Management Stratégique et Opérationnel',
  'Power BI',
  'Rédaction Administrative et Professionnelle',
  'SAGE 100 (Gescom, Paie, Compta)',
  'Management RH',
  'Fiscalité',
  'Sécurité Incendie',
  'Transport Logistique',
  'SST (ISO45001, 9001, 14001)',
  'PowerPoint',
  'Premiers Secours',
  'EPI',
];

export const MODULES_MECANICIENS = [
  'EPI',
  'Maintenance Préventive',
  'Sécurité Incendie',
  'Premiers Secours',
];

export const MODULES_CONDUCTEURS = [
  'EPI',
  'Éco-Conduite',
  'Code de la Route',
  'Matières Dangereuses',
  'Sécurité Incendie',
  'Électricité (Statique et Dynamique)',
  'Contrôle Avant Départ',
  'Conduite Défensive',
  'Travail en Hauteur',
  'Chargement',
  'Dépotage',
  'Premiers Secours',
  'Manuel du Chauffeur Livreur',
  'Livret Comportemental Chauffeur',
  'Inspection de Pneu',
];

export interface MatriceEntry {
  id: string;
  person_type: 'employe' | 'chauffeur';
  person_id: string;
  categorie: string;
  module_nom: string;
  completed: boolean;
  date_completion: string | null;
}

export const matriceFormationService = {
  async getByCategorie(categorie: string): Promise<MatriceEntry[]> {
    const { data, error } = await supabase
      .from('formations_matrice' as any)
      .select('*')
      .eq('categorie', categorie);
    if (error) throw error;
    return (data || []) as any;
  },

  async toggleModule(
    personType: 'employe' | 'chauffeur',
    personId: string,
    categorie: string,
    moduleNom: string,
    completed: boolean
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
            date_completion: new Date().toISOString().split('T')[0],
          },
          { onConflict: 'person_id,categorie,module_nom' }
        );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('formations_matrice' as any)
        .delete()
        .eq('person_id', personId)
        .eq('categorie', categorie)
        .eq('module_nom', moduleNom);
      if (error) throw error;
    }
  },
};
