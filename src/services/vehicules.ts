
import { supabase } from '@/integrations/supabase/client';

export interface Vehicule {
  id: string;
  numero: string;
  marque?: string;
  modele?: string;
  immatriculation?: string;
  type_transport: string;
  statut: string;
  type_vehicule: string;
  validation_requise?: boolean;
  created_at: string;
  updated_at: string;
  chauffeur_assigne?: string;
  derniere_maintenance?: string;
  prochaine_maintenance?: string;
  // Propriétés additionnelles
  capacite_max?: number;
  unite_capacite?: string;
  annee_fabrication?: number;
  numero_chassis?: string;
  base?: string;
  integration?: string;
  associe_id?: string;
  kilometrage?: number;
  consommation_moyenne?: number;
  // Tracteur
  tracteur_immatriculation?: string;
  tracteur_marque?: string;
  tracteur_modele?: string;
  tracteur_configuration?: string;
  tracteur_numero_chassis?: string;
  tracteur_annee_fabrication?: number;
  tracteur_date_mise_circulation?: string;
  // Remorque
  remorque_immatriculation?: string;
  remorque_marque?: string;
  remorque_modele?: string;
  remorque_configuration?: string;
  remorque_numero_chassis?: string;
  remorque_volume_litres?: number;
  remorque_annee_fabrication?: number;
  remorque_date_mise_circulation?: string;
}

const vehiculesService = {
  async getAll(): Promise<Vehicule[]> {
    try {
      console.log('Chargement des véhicules...');
      
      // Requête simplifiée avec timeout
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des véhicules:', error);
        return [];
      }

      console.log(`${data?.length || 0} véhicules chargés`);
      return data || [];
    } catch (error) {
      console.error('Erreur générale véhicules:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Vehicule | null> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du véhicule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error);
      return null;
    }
  },

  async create(vehicule: Omit<Vehicule, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicule | null> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .insert([vehicule])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du véhicule:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Vehicule>): Promise<Vehicule | null> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du véhicule:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vehicules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du véhicule:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      throw error;
    }
  },

  async getForValidation(): Promise<Vehicule[]> {
    try {
      console.log('Chargement optimisé des véhicules pour validation');
      
      const { data, error } = await supabase
        .from('vehicules')
        .select('id, numero, marque, modele, immatriculation, statut, validation_requise, type_transport')
        .eq('validation_requise', true)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur véhicules validation:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur véhicules validation:', error);
      return [];
    }
  }
};

export default vehiculesService;
