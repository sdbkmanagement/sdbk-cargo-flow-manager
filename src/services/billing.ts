
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Facture = Tables<'factures'>;
export type Devis = Tables<'devis'>;
export type Client = Tables<'clients'>;
export type FactureLigne = Tables<'facture_lignes'>;

export const billingService = {
  // Factures
  async createFacture(factureData: TablesInsert<'factures'>, lignes: Omit<TablesInsert<'facture_lignes'>, 'facture_id'>[]) {
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .insert(factureData)
      .select()
      .single();

    if (factureError) throw factureError;

    if (lignes.length > 0) {
      const lignesWithFactureId = lignes.map(ligne => ({
        ...ligne,
        facture_id: facture.id
      }));

      const { error: lignesError } = await supabase
        .from('facture_lignes')
        .insert(lignesWithFactureId);

      if (lignesError) throw lignesError;
    }

    return facture;
  },

  async getFactures() {
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getFacture(id: string) {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_lignes (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateFacture(id: string, factureData: TablesUpdate<'factures'>) {
    const { data, error } = await supabase
      .from('factures')
      .update(factureData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFacture(id: string) {
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Devis
  async createDevis(devisData: TablesInsert<'devis'>) {
    const { data, error } = await supabase
      .from('devis')
      .insert(devisData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDevis() {
    const { data, error } = await supabase
      .from('devis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateDevis(id: string, devisData: TablesUpdate<'devis'>) {
    const { data, error } = await supabase
      .from('devis')
      .update(devisData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDevisStatus(id: string, statut: string) {
    const { data, error } = await supabase
      .from('devis')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDevis(id: string) {
    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Clients
  async createClient(clientData: TablesInsert<'clients'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nom');

    if (error) throw error;
    return data;
  },

  // Statistiques
  async getStats() {
    const [facturesResult, devisResult] = await Promise.all([
      supabase.from('factures').select('montant_ttc, statut'),
      supabase.from('devis').select('montant_ttc, statut')
    ]);

    if (facturesResult.error) throw facturesResult.error;
    if (devisResult.error) throw devisResult.error;

    const factures = facturesResult.data;
    const devis = devisResult.data;

    const totalFacture = factures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    const facturesEnAttente = factures.filter(f => f.statut === 'en_attente').length;
    const facturesEnRetard = factures.filter(f => f.statut === 'en_retard').length;
    const facturesReglees = factures.filter(f => f.statut === 'paye').length;
    const totalDevis = devis.length;

    return {
      totalFacture,
      facturesEnAttente,
      facturesEnRetard,
      facturesReglees,
      totalDevis,
      chiffreAffaireMois: totalFacture // Simplification pour l'instant
    };
  }
};
