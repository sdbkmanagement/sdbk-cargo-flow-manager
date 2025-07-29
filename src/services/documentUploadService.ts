
import { supabase } from '@/integrations/supabase/client';

export interface DocumentUpload {
  file: File;
  type: string;
  name: string;
  hasExpiration: boolean;
  expirationDate?: string;
}

export const documentUploadService = {
  async uploadDocument(file: File, vehiculeId: string, documentType: string): Promise<string> {
    try {
      console.log('Début upload document:', { file: file.name, vehiculeId, documentType });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `vehicules/${vehiculeId}/${documentType}_${Date.now()}.${fileExt}`;
      
      console.log('Nom de fichier généré:', fileName);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload storage:', error);
        throw new Error(`Erreur upload: ${error.message}`);
      }

      console.log('Upload réussi:', data);

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      console.log('URL publique générée:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  },

  async saveDocumentRecord(vehiculeId: string, documentData: {
    nom: string;
    type: string;
    url: string;
    dateExpiration?: string;
    hasExpiration: boolean;
    commentaire?: string;
  }) {
    try {
      console.log('Sauvegarde du document en base:', documentData);
      
      const { data, error } = await supabase
        .from('documents_vehicules')
        .insert([{
          vehicule_id: vehiculeId,
          nom: documentData.nom,
          type: documentData.type,
          url: documentData.url,
          date_expiration: documentData.dateExpiration || null,
          commentaire: documentData.commentaire || null,
          statut: documentData.dateExpiration ? 
            (new Date(documentData.dateExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'a_renouveler' : 'valide') : 
            'valide'
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde document en base:', error);
        throw new Error(`Erreur sauvegarde: ${error.message}`);
      }

      console.log('Document sauvegardé:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  },

  async processFormDocuments(formData: any, vehiculeId: string) {
    const uploadPromises: Promise<any>[] = [];
    const documentTypes = [
      // Cartes grises
      { field: 'carte_grise_file', type: 'carte_grise', name: 'Carte grise', hasExpiration: false },
      { field: 'carte_grise_tracteur_file', type: 'carte_grise_tracteur', name: 'Carte grise tracteur', hasExpiration: false },
      { field: 'carte_grise_remorque_file', type: 'carte_grise_remorque', name: 'Carte grise remorque', hasExpiration: false },
      
      // Assurances
      { field: 'assurance_file', type: 'assurance', name: 'Assurance', hasExpiration: true, expirationField: 'assurance_expiration' },
      { field: 'assurance_tracteur_file', type: 'assurance_tracteur', name: 'Assurance tracteur', hasExpiration: true, expirationField: 'assurance_tracteur_expiration' },
      { field: 'assurance_remorque_file', type: 'assurance_remorque', name: 'Assurance remorque', hasExpiration: true, expirationField: 'assurance_remorque_expiration' },
      
      // Autres documents
      { field: 'autorisation_transport_file', type: 'autorisation_transport', name: 'Autorisation transport', hasExpiration: true, expirationField: 'autorisation_transport_expiration' },
      { field: 'conformite_file', type: 'conformite', name: 'Conformité', hasExpiration: true, expirationField: 'conformite_expiration' },
      { field: 'controle_technique_file', type: 'controle_technique', name: 'Contrôle technique', hasExpiration: true, expirationField: 'controle_technique_expiration' },
      { field: 'controle_socotac_file', type: 'controle_socotac', name: 'Contrôle SOCOTAC', hasExpiration: true, expirationField: 'controle_socotac_expiration' },
      { field: 'certificat_jaugeage_file', type: 'certificat_jaugeage', name: 'Certificat de jaugeage', hasExpiration: true, expirationField: 'certificat_jaugeage_expiration' },
      { field: 'attestation_extincteurs_file', type: 'attestation_extincteurs', name: 'Attestation extincteurs', hasExpiration: true, expirationField: 'attestation_extincteurs_expiration' },
      { field: 'numero_police_file', type: 'numero_police', name: 'Numéro de police', hasExpiration: false }
    ];

    for (const docType of documentTypes) {
      const fileList = formData[docType.field];
      if (fileList && fileList.length > 0) {
        const file = fileList[0];
        
        uploadPromises.push(
          this.uploadDocument(file, vehiculeId, docType.type).then(async (url) => {
            await this.saveDocumentRecord(vehiculeId, {
              nom: docType.name,
              type: docType.type,
              url: url,
              dateExpiration: docType.expirationField ? formData[docType.expirationField] : undefined,
              hasExpiration: docType.hasExpiration
            });
          })
        );
      }
    }

    // Traitement spécial pour le numéro de police (champ texte)
    if (formData.numero_police_value) {
      uploadPromises.push(
        this.saveDocumentRecord(vehiculeId, {
          nom: 'Numéro de police',
          type: 'numero_police_text',
          url: formData.numero_police_value, // Stocker la valeur dans l'URL pour les champs texte
          hasExpiration: false
        })
      );
    }

    try {
      await Promise.all(uploadPromises);
      console.log('Tous les documents ont été traités avec succès');
    } catch (error) {
      console.error('Erreur lors du traitement des documents:', error);
      throw error;
    }
  }
};
