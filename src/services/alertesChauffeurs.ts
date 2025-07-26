
import { supabase } from '@/integrations/supabase/client';

export interface AlerteChauffeur {
  id: string;
  chauffeur_id: string;
  chauffeur_nom: string;
  document_nom: string;
  document_type: string;
  date_expiration: string;
  jours_restants: number;
  statut: string;
  niveau_alerte: string;
}

export const alertesChauffeursService = {
  async getAlertesChauffeurs(): Promise<AlerteChauffeur[]> {
    try {
      // Requête directe aux tables avec jointure
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          entity_id,
          nom,
          type,
          date_expiration,
          statut,
          chauffeurs!inner(nom, prenom)
        `)
        .eq('entity_type', 'chauffeur')
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des alertes chauffeurs:', error);
        return [];
      }

      // Transformer les données pour correspondre au format AlerteChauffeur
      const alertes: AlerteChauffeur[] = (data || []).map(doc => {
        const joursRestants = Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        let niveauAlerte = 'INFO';
        
        if (joursRestants < 0) {
          niveauAlerte = 'expire';
        } else if (joursRestants <= 7) {
          niveauAlerte = 'a_renouveler';
        }

        return {
          id: doc.id,
          chauffeur_id: doc.entity_id || '',
          chauffeur_nom: doc.chauffeurs ? `${doc.chauffeurs.prenom} ${doc.chauffeurs.nom}` : 'Chauffeur inconnu',
          document_nom: doc.nom,
          document_type: doc.type,
          date_expiration: doc.date_expiration,
          jours_restants: joursRestants,
          statut: doc.statut || 'valide',
          niveau_alerte: niveauAlerte
        };
      });

      return alertes;
    } catch (error) {
      console.error('Erreur générale alertes chauffeurs:', error);
      return [];
    }
  },

  async getDocumentsChauffeur(chauffeurId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur')
        .eq('entity_id', chauffeurId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur générale documents chauffeur:', error);
      return [];
    }
  },

  async uploadDocument(file: File, chauffeurId: string, documentType: string): Promise<string> {
    try {
      const fileName = `chauffeurs/${chauffeurId}/${documentType}_${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload fichier:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  },

  async saveDocument(chauffeurId: string, documentData: {
    nom: string;
    type: string;
    url: string;
    dateExpiration?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          entity_id: chauffeurId,
          entity_type: 'chauffeur',
          nom: documentData.nom,
          type: documentData.type,
          url: documentData.url,
          date_expiration: documentData.dateExpiration || null,
          statut: documentData.dateExpiration ? 
            (new Date(documentData.dateExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'a_renouveler' : 'valide') : 
            'valide',
          taille: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  },

  async deleteDocument(documentId: string) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Erreur suppression document:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
};
