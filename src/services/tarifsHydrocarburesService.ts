import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TarifHydrocarbure {
  id: string;
  numero_ordre: number;
  lieu_depart: string;
  destination: string;
  tarif_au_litre: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export const tarifsHydrocarburesService = {
  // Récupérer tous les tarifs hydrocarbures
  async getTarifs(): Promise<TarifHydrocarbure[]> {
    try {
      const { data, error } = await supabase
        .from('tarifs_hydrocarbures')
        .select('*')
        .order('lieu_depart', { ascending: true })
        .order('numero_ordre', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des tarifs hydrocarbures:', error);
        toast.error('Erreur lors du chargement des tarifs hydrocarbures');
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des tarifs hydrocarbures');
      return [];
    }
  },

  // Récupérer les lieux de départ disponibles
  async getLieuxDepart(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('tarifs_hydrocarbures')
        .select('lieu_depart')
        .order('lieu_depart', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des lieux de départ:', error);
        return [];
      }

      // Retourner les lieux uniques
      const lieuxUniques = [...new Set(data?.map(item => item.lieu_depart) || [])];
      return lieuxUniques;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Récupérer les destinations pour un lieu de départ donné
  async getDestinations(lieuDepart: string): Promise<TarifHydrocarbure[]> {
    try {
      const { data, error } = await supabase
        .from('tarifs_hydrocarbures')
        .select('*')
        .eq('lieu_depart', lieuDepart)
        .order('numero_ordre', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des destinations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Récupérer un tarif spécifique par lieu de départ et destination
  async getTarif(lieuDepart: string, destination: string): Promise<TarifHydrocarbure | null> {
    try {
      const { data, error } = await supabase
        .from('tarifs_hydrocarbures')
        .select('*')
        .eq('lieu_depart', lieuDepart)
        .eq('destination', destination)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du tarif:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  },

  // Créer un nouveau tarif
  async createTarif(tarif: Omit<TarifHydrocarbure, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tarifs_hydrocarbures')
        .insert([tarif]);

      if (error) {
        console.error('Erreur lors de la création du tarif:', error);
        toast.error('Erreur lors de la création du tarif');
        return false;
      }

      toast.success('Tarif créé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création du tarif');
      return false;
    }
  },

  // Mettre à jour un tarif
  async updateTarif(id: string, tarif: Partial<TarifHydrocarbure>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tarifs_hydrocarbures')
        .update(tarif)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du tarif:', error);
        toast.error('Erreur lors de la mise à jour du tarif');
        return false;
      }

      toast.success('Tarif mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
      return false;
    }
  },

  // Supprimer un tarif
  async deleteTarif(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tarifs_hydrocarbures')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du tarif:', error);
        toast.error('Erreur lors de la suppression du tarif');
        return false;
      }

      toast.success('Tarif supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression du tarif');
      return false;
    }
  }
};