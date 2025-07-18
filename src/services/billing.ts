
import { supabase } from '@/integrations/supabase/client';

export interface Devis {
  id: string;
  numero: string;
  client_nom: string;
  client_societe?: string;
  client_email?: string;
  description: string;
  date_creation: string;
  date_validite: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'en_attente' | 'accepte' | 'refuse' | 'expire';
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDevisData {
  client_nom: string;
  client_societe?: string;
  client_email?: string;
  description: string;
  date_validite: string;
  montant_ht: number;
  observations?: string;
}

const billingService = {
  async createDevis(data: CreateDevisData): Promise<Devis> {
    try {
      // Generate numero
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const numero = `DEV${year}${month}${day}-${random}`;

      // Calculate TVA and TTC
      const montant_tva = data.montant_ht * 0.18; // 18% TVA
      const montant_ttc = data.montant_ht + montant_tva;

      const devisData = {
        numero,
        client_nom: data.client_nom,
        client_societe: data.client_societe || null,
        client_email: data.client_email || null,
        description: data.description,
        date_creation: today.toISOString().split('T')[0],
        date_validite: data.date_validite,
        montant_ht: data.montant_ht,
        montant_tva,
        montant_ttc,
        statut: 'en_attente' as const,
        observations: data.observations || null,
      };

      const { data: result, error } = await supabase
        .from('devis')
        .insert([devisData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création devis:', error);
        throw new Error(`Erreur lors de la création du devis: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Erreur service billing:', error);
      throw error;
    }
  },

  async getAll(): Promise<Devis[]> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération devis:', error);
        throw new Error(`Erreur lors de la récupération des devis: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service billing getAll:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Devis | null> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur récupération devis par ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur service billing getById:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Devis>): Promise<Devis | null> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour devis:', error);
        throw new Error(`Erreur lors de la mise à jour du devis: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur service billing update:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression devis:', error);
        throw new Error(`Erreur lors de la suppression du devis: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur service billing delete:', error);
      throw error;
    }
  }
};

export default billingService;
