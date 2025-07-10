import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type DocumentVehicule = Database['public']['Tables']['documents_vehicules']['Row']
type DocumentVehiculeInsert = Database['public']['Tables']['documents_vehicules']['Insert']
type DocumentVehiculeUpdate = Database['public']['Tables']['documents_vehicules']['Update']
type AlerteDocument = Database['public']['Views']['alertes_documents_vehicules']['Row']

export const documentsAdministratifsService = {
  // Types de documents requis
  DOCUMENTS_REQUIS: [
    { code: 'carte_grise', libelle: 'Carte grise', obligatoire: true },
    { code: 'assurance', libelle: 'Assurance', obligatoire: true },
    { code: 'permis_chauffeur', libelle: 'Permis du chauffeur', obligatoire: false },
    { code: 'certificat_conformite', libelle: 'Certificat de conformité', obligatoire: false },
    { code: 'barre_gabarit', libelle: 'Barre de gabarit', obligatoire: false },
    { code: 'controle_technique', libelle: 'Contrôle technique', obligatoire: true },
    { code: 'controle_annuel', libelle: 'Contrôle annuel', obligatoire: true },
    { code: 'autorisation_transport', libelle: 'Carte rouge / Autorisation de transport', obligatoire: true }
  ],

  // Récupérer tous les documents d'un véhicule avec organisation par type
  async getDocumentsByVehicle(vehiculeId: string): Promise<Record<string, DocumentVehicule[]>> {
    const { data, error } = await supabase
      .from('documents_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }

    // Organiser par type de document
    const documentsParType: Record<string, DocumentVehicule[]> = {}
    
    this.DOCUMENTS_REQUIS.forEach(type => {
      documentsParType[type.code] = data?.filter(doc => doc.type === type.code) || []
    })

    return documentsParType
  },

  // Créer un nouveau document
  async createDocument(documentData: DocumentVehiculeInsert): Promise<DocumentVehicule> {
    const { data, error } = await supabase
      .from('documents_vehicules')
      .insert([documentData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du document:', error)
      throw error
    }

    return data
  },

  // Mettre à jour un document
  async updateDocument(id: string, documentData: DocumentVehiculeUpdate): Promise<DocumentVehicule> {
    const { data, error } = await supabase
      .from('documents_vehicules')
      .update(documentData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du document:', error)
      throw error
    }

    return data
  },

  // Supprimer un document
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents_vehicules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du document:', error)
      throw error
    }
  },

  // Valider un document (rôle administratif uniquement)
  async validerDocument(id: string, validateurNom: string, validateurUserId: string, commentaire?: string): Promise<DocumentVehicule> {
    const { data, error } = await supabase
      .from('documents_vehicules')
      .update({
        statut: 'valide',
        validateur_nom: validateurNom,
        validateur_user_id: validateurUserId,
        date_validation: new Date().toISOString(),
        commentaire_validation: commentaire
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la validation du document:', error)
      throw error
    }

    return data
  },

  // Récupérer les alertes de documents
  async getAlertesDocuments(): Promise<AlerteDocument[]> {
    const { data, error } = await supabase
      .from('alertes_documents_vehicules')
      .select('*')
      .order('date_expiration', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des alertes:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les alertes pour un véhicule spécifique
  async getAlertesVehicule(vehiculeId: string): Promise<AlerteDocument[]> {
    const { data, error } = await supabase
      .from('alertes_documents_vehicules')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('date_expiration', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des alertes du véhicule:', error)
      throw error
    }

    return data || []
  },

  // Calculer le statut administratif d'un véhicule
  async calculerStatutAdministratif(vehiculeId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('calculer_statut_administratif', { p_vehicule_id: vehiculeId })

    if (error) {
      console.error('Erreur lors du calcul du statut administratif:', error)
      throw error
    }

    return data || 'bloque_document_manquant'
  },

  // Vérifier si tous les documents requis sont présents et valides
  async verifierConformiteDocumentaire(vehiculeId: string): Promise<{
    conforme: boolean;
    documentsManquants: string[];
    documentsExpires: string[];
    documentsProchesExpiration: string[];
  }> {
    const documentsParType = await this.getDocumentsByVehicle(vehiculeId)
    const alertes = await this.getAlertesVehicule(vehiculeId)
    
    const documentsManquants: string[] = []
    const documentsExpires: string[] = []
    const documentsProchesExpiration: string[] = []

    // Vérifier chaque type de document requis
    this.DOCUMENTS_REQUIS.forEach(typeDoc => {
      if (typeDoc.obligatoire) {
        const documents = documentsParType[typeDoc.code] || []
        const documentsValides = documents.filter(doc => 
          doc.statut === 'valide' && 
          (doc.date_expiration === null || new Date(doc.date_expiration) >= new Date())
        )

        if (documentsValides.length === 0) {
          if (documents.length === 0) {
            documentsManquants.push(typeDoc.libelle)
          } else {
            // Vérifier si expiré
            const docExpire = documents.some(doc => 
              doc.date_expiration && new Date(doc.date_expiration) < new Date()
            )
            if (docExpire) {
              documentsExpires.push(typeDoc.libelle)
            } else {
              documentsManquants.push(typeDoc.libelle)
            }
          }
        }
      }
    })

    // Documents proches de l'expiration (dans les 30 jours)
    alertes.forEach(alerte => {
      if (alerte.niveau_alerte === 'Document expire bientôt') {
        const typeDoc = this.DOCUMENTS_REQUIS.find(t => t.code === alerte.document_type)
        if (typeDoc && !documentsProchesExpiration.includes(typeDoc.libelle)) {
          documentsProchesExpiration.push(typeDoc.libelle)
        }
      }
    })

    return {
      conforme: documentsManquants.length === 0 && documentsExpires.length === 0,
      documentsManquants,
      documentsExpires,
      documentsProchesExpiration
    }
  },

  // Récupérer les statistiques des documents
  async getStatistiquesDocuments() {
    const { data: documents, error } = await supabase
      .from('documents_vehicules')
      .select('statut, date_expiration, type')

    if (error) {
      console.error('Erreur lors de la récupération des statistiques documents:', error)
      throw error
    }

    const maintenant = new Date()
    const dans30Jours = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const stats = {
      total: documents?.length || 0,
      valides: documents?.filter(d => d.statut === 'valide').length || 0,
      expires: documents?.filter(d => 
        d.date_expiration && new Date(d.date_expiration) < maintenant
      ).length || 0,
      expiration_prochaine: documents?.filter(d => 
        d.date_expiration && 
        new Date(d.date_expiration) >= maintenant &&
        new Date(d.date_expiration) <= dans30Jours
      ).length || 0,
      en_attente_validation: documents?.filter(d => d.statut === 'en_attente').length || 0
    }

    return stats
  }
}