
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export const documentsService = {
  // Récupérer les documents d'une entité
  async getByEntity(entityType: string, entityId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }

    return data || []
  },

  // Récupérer les alertes de documents
  async getAlerts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('alertes_documents_chauffeurs')
      .select('*')
      .order('jours_restants', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des alertes:', error)
      throw error
    }

    return data || []
  },

  // Créer un nouveau document
  async create(documentData: DocumentInsert): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
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
  async update(id: string, documentData: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
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
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du document:', error)
      throw error
    }
  },

  // Upload d'un fichier dans le storage
  async uploadFile(file: File, entityType: string, entityId: string, documentType: string): Promise<string> {
    const fileName = `${entityType}/${entityId}/${documentType}_${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  },

  // Supprimer un fichier du storage
  async deleteFile(filePath: string): Promise<void> {
    // Extraire le chemin relatif depuis l'URL complète
    const pathParts = filePath.split('/documents/')
    const relativePath = pathParts[1] || filePath

    const { error } = await supabase.storage
      .from('documents')
      .remove([relativePath])

    if (error) {
      console.error('Erreur lors de la suppression du fichier:', error)
      throw error
    }
  },

  // Assigner automatiquement les documents requis à un chauffeur
  async assignRequiredDocuments(chauffeurId: string): Promise<void> {
    try {
      // Pour l'instant, nous créons les documents de base manuellement
      // En attendant que la table types_documents_chauffeurs soit reconnue
      const requiredDocuments = [
        { nom: 'Carte de qualification conducteur', type: 'carte_qualification_conducteur' },
        { nom: 'Carte conducteur', type: 'carte_conducteur' },
        { nom: 'Certificat de capacité professionnelle', type: 'certificat_capacite_professionnelle' },
        { nom: 'Attestation de formation', type: 'attestation_formation' },
        { nom: 'Certificat médical d\'aptitude', type: 'certificat_medical_aptitude' },
        { nom: 'Permis de conduire', type: 'permis_conduire' },
        { nom: 'Visite médicale', type: 'visite_medicale' }
      ]

      const documentsToCreate = requiredDocuments.map(doc => ({
        entity_type: 'chauffeur',
        entity_id: chauffeurId,
        nom: doc.nom,
        type: doc.type,
        url: '',
        document_requis: true,
        assigne_automatiquement: true,
        statut: 'manquant'
      }))

      const { error } = await supabase
        .from('documents')
        .insert(documentsToCreate)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation des documents:', error)
      throw error
    }
  },

  // Vérifier la conformité d'un chauffeur
  async checkDriverCompliance(chauffeurId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_id', chauffeurId)
        .eq('entity_type', 'chauffeur')
        .eq('document_requis', true)

      if (error) {
        throw error
      }

      // Vérifier s'il y a des documents non conformes
      const nonCompliantDocs = data?.filter(doc => 
        !doc.url || doc.url === '' || 
        (doc.date_expiration && new Date(doc.date_expiration) < new Date())
      ) || []

      return nonCompliantDocs.length === 0
    } catch (error) {
      console.error('Erreur lors de la vérification de conformité:', error)
      return false
    }
  }
}
