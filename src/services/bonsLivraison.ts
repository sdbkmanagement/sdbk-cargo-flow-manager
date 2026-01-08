
import { supabase } from '@/integrations/supabase/client';
import { BonLivraison } from '@/types/bl';

export const bonsLivraisonService = {
  // Récupérer tous les bons de livraison
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des BL:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale BL:', error);
      throw error;
    }
  },

  // Récupérer les BL par mission_id
  async getByMissionId(missionId: string) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des BL par mission:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale BL par mission:', error);
      throw error;
    }
  },

  // Créer un bon de livraison
  async create(blData: Omit<BonLivraison, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .insert([blData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création BL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du BL:', error);
      throw error;
    }
  },

  // Mettre à jour un bon de livraison
  async update(id: string, blData: Partial<BonLivraison>) {
    try {
      const { data, error } = await supabase
        .from('bons_livraison')
        .update({ ...blData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour BL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du BL:', error);
      throw error;
    }
  },

  // Supprimer un bon de livraison
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('bons_livraison')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression BL:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du BL:', error);
      throw error;
    }
  },

  // Recalculer et mettre à jour le prix d'un BL
  async recalculerPrix(blId: string) {
    try {
      // Récupérer le BL
      const { data: bl, error: blError } = await supabase
        .from('bons_livraison')
        .select('*')
        .eq('id', blId)
        .single();

      if (blError || !bl) {
        throw new Error('BL non trouvé');
      }

      // Chercher le tarif correspondant
      const destination = bl.lieu_arrivee || bl.destination;
      if (!destination) {
        throw new Error('Destination non définie pour ce BL');
      }

      // Normaliser la destination pour la recherche (enlever tirets, espaces multiples)
      const normalizeStr = (str: string) => str.toLowerCase()
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const destinationNormalized = normalizeStr(destination);
      const destinationWords = destinationNormalized.split(' ').filter(w => w.length > 2);

      // Recherche flexible du tarif - récupérer tous les tarifs du lieu de départ
      const { data: tarifs, error: tarifError } = await supabase
        .from('tarifs_hydrocarbures')
        .select('*')
        .eq('lieu_depart', bl.lieu_depart || 'Conakry');

      if (tarifError) {
        throw tarifError;
      }

      // Trouver le meilleur match avec scoring
      let tarifMatch = null;
      let bestScore = 0;

      for (const tarif of tarifs || []) {
        const tarifNormalized = normalizeStr(tarif.destination);
        
        // Calculer le score basé sur les mots en commun
        let score = 0;
        for (const word of destinationWords) {
          if (tarifNormalized.includes(word)) {
            score += word.length; // Les mots plus longs comptent plus
          }
        }
        
        // Bonus si correspondance exacte partielle
        if (tarifNormalized.includes(destinationNormalized) || destinationNormalized.includes(tarifNormalized)) {
          score += 100;
        }

        if (score > bestScore) {
          bestScore = score;
          tarifMatch = tarif;
        }
      }

      if (!tarifMatch) {
        throw new Error(`Aucun tarif trouvé pour la destination: ${destination}`);
      }

      // Calculer le montant
      const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
      const prixUnitaire = tarifMatch.tarif_au_litre;
      const montantTotal = quantite * prixUnitaire;

      // Mettre à jour le BL
      const { data: updatedBL, error: updateError } = await supabase
        .from('bons_livraison')
        .update({
          destination: tarifMatch.destination,
          prix_unitaire: prixUnitaire,
          montant_total: montantTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', blId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return {
        bl: updatedBL,
        tarif: tarifMatch,
        calcul: {
          quantite,
          prixUnitaire,
          montantTotal
        }
      };
    } catch (error) {
      console.error('Erreur lors du recalcul du prix:', error);
      throw error;
    }
  },

  // Recalculer les prix pour plusieurs BL par numéros de tournée
  async recalculerPrixParTournees(numerosTournees: string[]) {
    try {
      const { data: bls, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .in('numero_tournee', numerosTournees);

      if (error) throw error;

      const resultats = [];
      for (const bl of bls || []) {
        try {
          const resultat = await this.recalculerPrix(bl.id);
          resultats.push({ success: true, bl: resultat.bl, calcul: resultat.calcul });
        } catch (err) {
          resultats.push({ success: false, blId: bl.id, numero: bl.numero, error: err });
        }
      }

      return resultats;
    } catch (error) {
      console.error('Erreur lors du recalcul par tournées:', error);
      throw error;
    }
  },

  // Recalculer tous les BL des missions terminées sans prix
  async recalculerTousBLSansPrix() {
    try {
      // Récupérer tous les BL sans prix pour les missions terminées
      const { data: bls, error } = await supabase
        .from('bons_livraison')
        .select(`
          id,
          numero,
          lieu_depart,
          lieu_arrivee,
          destination,
          quantite_prevue,
          quantite_livree,
          prix_unitaire,
          montant_total,
          mission_id
        `)
        .or('prix_unitaire.is.null,prix_unitaire.eq.0,montant_total.is.null,montant_total.eq.0');

      if (error) throw error;

      // Filtrer pour ne garder que ceux des missions terminées
      const blsToUpdate = bls || [];
      
      const resultats = {
        total: blsToUpdate.length,
        succes: 0,
        erreurs: 0,
        details: [] as Array<{ numero: string; success: boolean; montant?: number; error?: string }>
      };

      for (const bl of blsToUpdate) {
        try {
          const resultat = await this.recalculerPrix(bl.id);
          resultats.succes++;
          resultats.details.push({
            numero: bl.numero,
            success: true,
            montant: resultat.calcul.montantTotal
          });
        } catch (err: any) {
          resultats.erreurs++;
          resultats.details.push({
            numero: bl.numero,
            success: false,
            error: err.message || 'Erreur inconnue'
          });
        }
      }

      return resultats;
    } catch (error) {
      console.error('Erreur lors du recalcul en masse:', error);
      throw error;
    }
  }
};
