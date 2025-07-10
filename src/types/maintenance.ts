// Types temporaires pour les nouvelles tables de maintenance
// Ces types seront remplacés par les types Supabase générés automatiquement

export interface DiagnosticMaintenance {
  id: string
  vehicule_id: string
  type_panne_id?: string
  description: string
  date_diagnostic: string
  duree_estimee_heures?: number
  duree_reelle_heures?: number
  cout_reparation?: number
  statut: 'en_attente' | 'en_cours' | 'termine'
  responsable_nom?: string
  responsable_role?: string
  created_at: string
  updated_at: string
}

export interface DiagnosticMaintenanceInsert {
  vehicule_id: string
  type_panne_id?: string
  description: string
  date_diagnostic: string
  duree_estimee_heures?: number
  duree_reelle_heures?: number
  cout_reparation?: number
  statut?: 'en_attente' | 'en_cours' | 'termine'
  responsable_nom?: string
  responsable_role?: string
}

export interface DiagnosticMaintenanceUpdate {
  type_panne_id?: string
  description?: string
  date_diagnostic?: string
  duree_estimee_heures?: number
  duree_reelle_heures?: number
  cout_reparation?: number
  statut?: 'en_attente' | 'en_cours' | 'termine'
  responsable_nom?: string
  responsable_role?: string
  updated_at?: string
}

export interface TypePanne {
  id: string
  libelle: string
  description?: string
  actif: boolean
  created_at: string
}

export interface HistoriqueVehicule {
  id: string
  vehicule_id: string
  type_evenement: string
  ancien_statut?: string
  nouveau_statut?: string
  description: string
  utilisateur_nom?: string
  utilisateur_role?: string
  date_evenement: string
  created_at: string
}

// Types étendus pour documents_vehicules avec les nouveaux champs
export interface DocumentVehiculeEtendu {
  id: string
  vehicule_id: string
  nom: string
  type: string
  url: string
  date_expiration?: string
  taille?: number
  statut?: string
  numero_document?: string
  organisme_emetteur?: string
  validateur_nom?: string
  date_validation?: string
  created_at: string
}