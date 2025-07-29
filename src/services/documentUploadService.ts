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
      console.log('=== DEBUT UPLOAD DOCUMENT ===');
      console.log('Fichier:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      console.log('Paramètres:', { vehiculeId, documentType });
      
      // Validation du fichier
      if (!file) {
        throw new Error('Aucun fichier sélectionné');
      }

      if (file.size === 0) {
        throw new Error('Le fichier est vide');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Le fichier est trop volumineux (maximum 10MB)');
      }

      // Nettoyer le nom du fichier
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt) {
        throw new Error('Extension de fichier manquante');
      }

      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
      if (!allowedExtensions.includes(fileExt)) {
        throw new Error(`Type de fichier non autorisé. Extensions acceptées: ${allowedExtensions.join(', ')}`);
      }

      // Générer un nom de fichier propre
      const timestamp = Date.now();
      const cleanFileName = `${documentType}_${timestamp}.${fileExt}`;
      const fileName = `vehicules/${vehiculeId}/${cleanFileName}`;
      
      console.log('Nom fichier généré:', fileName);

      // Upload vers Supabase Storage
      console.log('Début upload vers Supabase Storage...');
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Erreur upload storage:', error);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      if (!data) {
        throw new Error('Aucune donnée retournée par l\'upload');
      }

      console.log('Upload réussi:', data);

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Impossible de générer l\'URL publique');
      }

      console.log('URL publique générée:', urlData.publicUrl);
      console.log('=== FIN UPLOAD DOCUMENT ===');
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('=== ERREUR UPLOAD DOCUMENT ===');
      console.error('Erreur:', error);
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
      console.log('=== DEBUT SAUVEGARDE DOCUMENT ===');
      console.log('Données document:', documentData);
      
      if (!vehiculeId) {
        throw new Error('ID véhicule manquant');
      }

      if (!documentData.nom || !documentData.type || !documentData.url) {
        throw new Error('Données document incomplètes');
      }

      // Calculer le statut du document
      let statut = 'valide';
      if (documentData.dateExpiration) {
        const expirationDate = new Date(documentData.dateExpiration);
        const today = new Date();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        if (expirationDate < today) {
          statut = 'expire';
        } else if (expirationDate < thirtyDaysFromNow) {
          statut = 'a_renouveler';
        }
      }

      const { data, error } = await supabase
        .from('documents_vehicules')
        .insert([{
          vehicule_id: vehiculeId,
          nom: documentData.nom,
          type: documentData.type,
          url: documentData.url,
          date_expiration: documentData.dateExpiration || null,
          commentaire: documentData.commentaire || null,
          statut: statut
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde document en base:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }

      if (!data) {
        throw new Error('Aucune donnée retournée par la sauvegarde');
      }

      console.log('Document sauvegardé:', data);
      console.log('=== FIN SAUVEGARDE DOCUMENT ===');
      
      return data;
    } catch (error) {
      console.error('=== ERREUR SAUVEGARDE DOCUMENT ===');
      console.error('Erreur:', error);
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
