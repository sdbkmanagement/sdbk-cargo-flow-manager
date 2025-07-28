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
  // Nouveaux champs propriétaire
  proprietaire_nom?: string;
  proprietaire_prenom?: string;
  // Nouveau champ volume pour porteurs
  volume_tonnes?: number;
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

export interface FleetStatsData {
  total: number;
  disponibles: number;
  en_mission: number;
  maintenance: number;
  validation_requise: number;
  hydrocarbures: number;
  bauxite: number;
  maintenance_urgente: number;
  bases: Array<{ nom: string; count: number }>;
  types_transport: Array<{ nom: string; count: number }>;
}

const vehiculesService = {
  async getAll(): Promise<Vehicule[]> {
    try {
      console.log('Chargement des véhicules...');
      
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
      console.log('Chargement des véhicules pour validation');
      
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
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
  },

  async getFleetStats(): Promise<FleetStatsData> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicules')
        .select('statut, base, type_transport');

      if (error) {
        console.error('Erreur lors du chargement des stats:', error);
        return {
          total: 0,
          disponibles: 0,
          en_mission: 0,
          maintenance: 0,
          validation_requise: 0,
          hydrocarbures: 0,
          bauxite: 0,
          maintenance_urgente: 0,
          bases: [],
          types_transport: []
        };
      }

      const total = vehicles?.length || 0;
      const disponibles = vehicles?.filter(v => v.statut === 'disponible').length || 0;
      const en_mission = vehicles?.filter(v => v.statut === 'en_mission').length || 0;
      const maintenance = vehicles?.filter(v => v.statut === 'maintenance').length || 0;
      const validation_requise = vehicles?.filter(v => v.statut === 'validation_requise').length || 0;
      const hydrocarbures = vehicles?.filter(v => v.type_transport === 'hydrocarbures').length || 0;
      const bauxite = vehicles?.filter(v => v.type_transport === 'marchandise').length || 0;
      const maintenance_urgente = 0; // TODO: Calculate based on maintenance dates

      // Calcul des statistiques par base
      const basesCount = vehicles?.reduce((acc: { [key: string]: number }, vehicle) => {
        if (vehicle.base) {
          acc[vehicle.base] = (acc[vehicle.base] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const bases = Object.entries(basesCount).map(([nom, count]) => ({
        nom,
        count: count as number
      }));

      // Calcul des statistiques par type de transport
      const typesCount = vehicles?.reduce((acc: { [key: string]: number }, vehicle) => {
        acc[vehicle.type_transport] = (acc[vehicle.type_transport] || 0) + 1;
        return acc;
      }, {}) || {};

      const types_transport = Object.entries(typesCount).map(([nom, count]) => ({
        nom,
        count: count as number
      }));

      return {
        total,
        disponibles,
        en_mission,
        maintenance,
        validation_requise,
        hydrocarbures,
        bauxite,
        maintenance_urgente,
        bases,
        types_transport
      };
    } catch (error) {
      console.error('Erreur lors du calcul des stats:', error);
      return {
        total: 0,
        disponibles: 0,
        en_mission: 0,
        maintenance: 0,
        validation_requise: 0,
        hydrocarbures: 0,
        bauxite: 0,
        maintenance_urgente: 0,
        bases: [],
        types_transport: []
      };
    }
  },

  async getBases(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .select('base')
        .not('base', 'is', null);

      if (error) {
        console.error('Erreur lors du chargement des bases:', error);
        return [];
      }

      const bases = [...new Set(data?.map(v => v.base).filter(Boolean) || [])];
      return bases;
    } catch (error) {
      console.error('Erreur lors du chargement des bases:', error);
      return [];
    }
  },

  async getDocuments(vehiculeId: string) {
    try {
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      return [];
    }
  },

  async getMaintenance(vehiculeId: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_vehicules')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('date_maintenance', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement de la maintenance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement de la maintenance:', error);
      return [];
    }
  },

  async addMaintenance(maintenanceData: any) {
    try {
      const { data, error } = await supabase
        .from('maintenance_vehicules')
        .insert([maintenanceData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout de la maintenance:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la maintenance:', error);
      throw error;
    }
  },

  async importVehicles(file: File): Promise<{ success: boolean; message: string; imported: number; errors: string[] }> {
    try {
      // Simuler l'import pour le moment
      return {
        success: true,
        message: "Import simulé - fonctionnalité à implémenter",
        imported: 0,
        errors: []
      };
    } catch (error) {
      console.error('Erreur import véhicules:', error);
      return {
        success: false,
        message: "Erreur lors de l'import",
        imported: 0,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"]
      };
    }
  },

  async importTracteurRemorque(file: File): Promise<{ success: boolean; message: string; imported: number; errors: string[] }> {
    try {
      // Simuler l'import pour le moment
      return {
        success: true,
        message: "Import simulé - fonctionnalité à implémenter",
        imported: 0,
        errors: []
      };
    } catch (error) {
      console.error('Erreur import tracteur-remorque:', error);
      return {
        success: false,
        message: "Erreur lors de l'import",
        imported: 0,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"]
      };
    }
  }
};

export { vehiculesService };
export default vehiculesService;
