
import { supabase } from '@/integrations/supabase/client';

export interface Affectation {
  id: string;
  vehicule_id: string;
  chauffeur_id: string;
  date_debut: string;
  date_fin?: string;
  statut: string; // Changed from 'active' | 'inactive' to string for flexibility
  motif_changement?: string;
  autorise_par?: string;
  created_at: string;
  updated_at: string;
  chauffeur?: {
    nom: string;
    prenom: string;
    photo_url?: string;
    telephone: string;
    statut: string;
    matricule?: string;
  };
}

export interface CreateAffectationData {
  vehicule_id: string;
  chauffeur_id: string;
  date_debut: string;
  statut: 'active';
  motif_changement: string;
}

const affectationsService = {
  // Récupérer toutes les affectations d'un véhicule
  async getAffectationsVehicule(vehiculeId: string): Promise<Affectation[]> {
    try {
      console.log('Chargement des affectations pour le véhicule:', vehiculeId);
      
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select(`
          *,
          chauffeur:chauffeurs(
            nom,
            prenom,
            photo_url,
            telephone,
            statut,
            matricule
          )
        `)
        .eq('vehicule_id', vehiculeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des affectations:', error);
        return [];
      }

      console.log(`${data?.length || 0} affectations chargées`);
      return (data || []) as Affectation[];
    } catch (error) {
      console.error('Erreur générale affectations:', error);
      return [];
    }
  },

  // Récupérer toutes les affectations d'un chauffeur
  async getAffectationsChauffeur(chauffeurId: string): Promise<Affectation[]> {
    try {
      console.log('Chargement des affectations pour le chauffeur:', chauffeurId);
      
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select(`
          *,
          vehicule:vehicules(
            numero,
            immatriculation,
            marque,
            modele,
            type_vehicule
          )
        `)
        .eq('chauffeur_id', chauffeurId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des affectations:', error);
        return [];
      }

      console.log(`${data?.length || 0} affectations chargées`);
      return (data || []) as Affectation[];
    } catch (error) {
      console.error('Erreur générale affectations:', error);
      return [];
    }
  },

  // Créer une nouvelle affectation
  async create(affectationData: CreateAffectationData): Promise<Affectation | null> {
    try {
      console.log('Création affectation avec données:', affectationData);
      
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .insert([affectationData])
        .select(`
          *,
          chauffeur:chauffeurs(
            nom,
            prenom,
            photo_url,
            telephone,
            statut,
            matricule
          )
        `)
        .single();

      if (error) {
        console.error('Erreur création affectation:', error);
        throw error;
      }

      console.log('Affectation créée avec succès:', data);
      return data as Affectation;
    } catch (error) {
      console.error('Erreur lors de la création de l\'affectation:', error);
      throw error;
    }
  },

  // Désactiver une affectation (fin d'assignation)
  async desactiver(affectationId: string, motif?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('affectations_chauffeurs')
        .update({
          statut: 'inactive',
          date_fin: new Date().toISOString().split('T')[0],
          motif_changement: motif || 'Fin d\'assignation',
          updated_at: new Date().toISOString()
        })
        .eq('id', affectationId);

      if (error) {
        console.error('Erreur désactivation affectation:', error);
        throw error;
      }

      console.log('Affectation désactivée avec succès');
    } catch (error) {
      console.error('Erreur lors de la désactivation de l\'affectation:', error);
      throw error;
    }
  },

  // Récupérer les chauffeurs assignés à un véhicule (actifs uniquement)
  async getChauffeursAssignes(vehiculeId: string) {
    try {
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select(`
          chauffeur:chauffeurs(
            id,
            nom,
            prenom,
            photo_url,
            telephone,
            statut,
            matricule
          )
        `)
        .eq('vehicule_id', vehiculeId)
        .eq('statut', 'active');

      if (error) {
        console.error('Erreur lors du chargement des chauffeurs assignés:', error);
        return [];
      }

      return data?.map(item => item.chauffeur).filter(Boolean) || [];
    } catch (error) {
      console.error('Erreur générale chauffeurs assignés:', error);
      return [];
    }
  },

  // Vérifier si un chauffeur est déjà assigné à un véhicule
  async isAssigned(chauffeurId: string, vehiculeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select('id')
        .eq('chauffeur_id', chauffeurId)
        .eq('vehicule_id', vehiculeId)
        .eq('statut', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur vérification assignation:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erreur vérification assignation:', error);
      return false;
    }
  }
};

export { affectationsService };
export default affectationsService;
