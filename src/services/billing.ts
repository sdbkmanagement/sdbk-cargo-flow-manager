
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

export interface Facture {
  id: string;
  numero: string;
  client_nom: string;
  client_societe?: string;
  client_contact?: string;
  client_email?: string;
  mission_numero?: string;
  date_emission: string;
  date_echeance: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'en_attente' | 'paye' | 'en_retard';
  chauffeur?: string;
  vehicule?: string;
  type_transport?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface FactureLigne {
  id: string;
  facture_id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
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

export interface CreateFactureData {
  numero: string;
  client_nom: string;
  client_societe?: string;
  client_contact?: string;
  client_email?: string;
  mission_numero?: string;
  date_emission: string;
  date_echeance: string;
  chauffeur?: string;
  vehicule?: string;
  type_transport?: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: string;
  observations?: string;
}

export const billingService = {
  // Missions terminées pour facturation
  async getMissionsTerminees(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          vehicule:vehicules(numero, immatriculation),
          chauffeur:chauffeurs(nom, prenom),
          bons_livraison(
            id,
            numero,
            destination,
            lieu_arrivee,
            quantite_prevue,
            quantite_livree,
            prix_unitaire,
            montant_total,
            produit,
            facture
          )
        `)
        .eq('statut', 'terminee')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération missions terminées:', error);
        throw new Error(`Erreur lors de la récupération des missions terminées: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service getMissionsTerminees:', error);
      throw error;
    }
  },

  // Méthodes pour les devis
  async createDevis(data: CreateDevisData): Promise<Devis> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const numero = `DEV${year}${month}${day}-${random}`;

      const montant_tva = data.montant_ht * 0.18;
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

      return result as Devis;
    } catch (error) {
      console.error('Erreur service billing:', error);
      throw error;
    }
  },

  async getDevis(): Promise<Devis[]> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération devis:', error);
        throw new Error(`Erreur lors de la récupération des devis: ${error.message}`);
      }

      return (data || []) as Devis[];
    } catch (error) {
      console.error('Erreur service billing getDevis:', error);
      throw error;
    }
  },

  async getDevisById(id: string): Promise<Devis | null> {
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

      return data as Devis;
    } catch (error) {
      console.error('Erreur service billing getDevisById:', error);
      return null;
    }
  },

  async updateDevis(id: string, updates: Partial<Devis>): Promise<Devis | null> {
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

      return data as Devis;
    } catch (error) {
      console.error('Erreur service billing updateDevis:', error);
      throw error;
    }
  },

  async updateDevisStatus(id: string, statut: string): Promise<Devis | null> {
    return this.updateDevis(id, { statut: statut as any });
  },

  async deleteDevis(id: string): Promise<boolean> {
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
      console.error('Erreur service billing deleteDevis:', error);
      throw error;
    }
  },

  // Méthodes pour les factures
  async createFacture(factureData: CreateFactureData, lignes: any[]): Promise<Facture> {
    try {
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert([factureData])
        .select()
        .single();

      if (factureError) {
        console.error('Erreur création facture:', factureError);
        throw new Error(`Erreur lors de la création de la facture: ${factureError.message}`);
      }

      // Créer les lignes de facture
      if (lignes && lignes.length > 0) {
        const lignesWithFactureId = lignes.map(ligne => ({
          ...ligne,
          facture_id: facture.id
        }));

        const { error: lignesError } = await supabase
          .from('facture_lignes')
          .insert(lignesWithFactureId);

        if (lignesError) {
          console.error('Erreur création lignes facture:', lignesError);
        }
      }

      return facture as Facture;
    } catch (error) {
      console.error('Erreur service createFacture:', error);
      throw error;
    }
  },

  async getFactures(): Promise<Facture[]> {
    try {
      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération factures:', error);
        throw new Error(`Erreur lors de la récupération des factures: ${error.message}`);
      }

      return (data || []) as Facture[];
    } catch (error) {
      console.error('Erreur service getFactures:', error);
      throw error;
    }
  },

  async getFacture(id: string): Promise<(Facture & { facture_lignes: FactureLigne[] }) | null> {
    try {
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .select('*')
        .eq('id', id)
        .single();

      if (factureError) {
        console.error('Erreur récupération facture:', factureError);
        return null;
      }

      const { data: lignes, error: lignesError } = await supabase
        .from('facture_lignes')
        .select('*')
        .eq('facture_id', id);

      if (lignesError) {
        console.error('Erreur récupération lignes:', lignesError);
      }

      return {
        ...facture,
        facture_lignes: lignes || []
      } as Facture & { facture_lignes: FactureLigne[] };
    } catch (error) {
      console.error('Erreur service getFacture:', error);
      return null;
    }
  },

  async updateFacture(id: string, updates: Partial<Facture>): Promise<Facture | null> {
    try {
      const { data, error } = await supabase
        .from('factures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour facture:', error);
        throw new Error(`Erreur lors de la mise à jour de la facture: ${error.message}`);
      }

      return data as Facture;
    } catch (error) {
      console.error('Erreur service updateFacture:', error);
      throw error;
    }
  },

  async deleteFacture(id: string): Promise<boolean> {
    try {
      // Supprimer d'abord les lignes
      await supabase
        .from('facture_lignes')
        .delete()
        .eq('facture_id', id);

      // Puis la facture
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression facture:', error);
        throw new Error(`Erreur lors de la suppression de la facture: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur service deleteFacture:', error);
      throw error;
    }
  },

  async getStats(): Promise<any> {
    try {
      const { data: factures } = await supabase.from('factures').select('*');
      const { data: devis } = await supabase.from('devis').select('*');

      const stats = {
        totalFacture: factures?.reduce((sum, f) => sum + Number(f.montant_ttc), 0) || 0,
        facturesEnAttente: factures?.filter(f => f.statut === 'en_attente').length || 0,
        facturesEnRetard: factures?.filter(f => f.statut === 'en_retard').length || 0,
        facturesReglees: factures?.filter(f => f.statut === 'paye').length || 0,
        totalDevis: devis?.length || 0,
        chiffreAffaireMois: factures?.reduce((sum, f) => sum + Number(f.montant_ttc), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return {
        totalFacture: 0,
        facturesEnAttente: 0,
        facturesEnRetard: 0,
        facturesReglees: 0,
        totalDevis: 0,
        chiffreAffaireMois: 0
      };
    }
  },

  // Marquer un bon de livraison comme facturé
  async markBLAsFactured(blId: string) {
    try {
      const { error } = await supabase
        .from('bons_livraison')
        .update({ facture: true })
        .eq('id', blId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du marquage du BL:', error);
      throw error;
    }
  }
};

export default billingService;
