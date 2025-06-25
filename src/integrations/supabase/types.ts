export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      absences: {
        Row: {
          approuve_par: string | null
          commentaires: string | null
          created_at: string
          date_debut: string
          date_fin: string
          employe_id: string
          id: string
          motif: string | null
          nombre_jours: number | null
          statut: string
          type_absence: string
          updated_at: string
        }
        Insert: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_debut: string
          date_fin: string
          employe_id: string
          id?: string
          motif?: string | null
          nombre_jours?: number | null
          statut?: string
          type_absence: string
          updated_at?: string
        }
        Update: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          employe_id?: string
          id?: string
          motif?: string | null
          nombre_jours?: number | null
          statut?: string
          type_absence?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      chargements: {
        Row: {
          chauffeur_id: string
          client_nom: string
          created_at: string
          created_by: string | null
          date_heure_chargement: string
          id: string
          lieu_chargement: string
          lieu_livraison: string
          mission_id: string
          numero: string
          observations: string | null
          statut: string
          type_chargement: string
          unite_mesure: string
          updated_at: string
          vehicule_id: string
          volume_poids: number
        }
        Insert: {
          chauffeur_id: string
          client_nom: string
          created_at?: string
          created_by?: string | null
          date_heure_chargement: string
          id?: string
          lieu_chargement: string
          lieu_livraison: string
          mission_id: string
          numero: string
          observations?: string | null
          statut?: string
          type_chargement: string
          unite_mesure?: string
          updated_at?: string
          vehicule_id: string
          volume_poids: number
        }
        Update: {
          chauffeur_id?: string
          client_nom?: string
          created_at?: string
          created_by?: string | null
          date_heure_chargement?: string
          id?: string
          lieu_chargement?: string
          lieu_livraison?: string
          mission_id?: string
          numero?: string
          observations?: string | null
          statut?: string
          type_chargement?: string
          unite_mesure?: string
          updated_at?: string
          vehicule_id?: string
          volume_poids?: number
        }
        Relationships: [
          {
            foreignKeyName: "chargements_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chargements_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chargements_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      chargements_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          chargement_id: string
          created_at: string
          details: string | null
          id: string
          nouveau_statut: string | null
          utilisateur_nom: string | null
          utilisateur_role: string | null
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          chargement_id: string
          created_at?: string
          details?: string | null
          id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          chargement_id?: string
          created_at?: string
          details?: string | null
          id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          adresse: string | null
          code_postal: string | null
          created_at: string | null
          date_expiration_permis: string
          date_naissance: string | null
          email: string | null
          id: string
          nom: string
          numero_permis: string
          photo_url: string | null
          prenom: string
          signature_url: string | null
          statut: string | null
          telephone: string
          type_permis: string[]
          updated_at: string | null
          vehicule_assigne: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          date_expiration_permis: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          nom: string
          numero_permis: string
          photo_url?: string | null
          prenom: string
          signature_url?: string | null
          statut?: string | null
          telephone: string
          type_permis?: string[]
          updated_at?: string | null
          vehicule_assigne?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          date_expiration_permis?: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          nom?: string
          numero_permis?: string
          photo_url?: string | null
          prenom?: string
          signature_url?: string | null
          statut?: string | null
          telephone?: string
          type_permis?: string[]
          updated_at?: string | null
          vehicule_assigne?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          societe: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          societe?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          societe?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      devis: {
        Row: {
          client_email: string | null
          client_nom: string
          client_societe: string | null
          created_at: string
          date_creation: string
          date_validite: string
          description: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_nom: string
          client_societe?: string | null
          created_at?: string
          date_creation: string
          date_validite: string
          description: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_nom?: string
          client_societe?: string | null
          created_at?: string
          date_creation?: string
          date_validite?: string
          description?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          chauffeur_id: string | null
          created_at: string | null
          id: string
          nom: string
          taille: number
          type: string
          url: string
        }
        Insert: {
          chauffeur_id?: string | null
          created_at?: string | null
          id?: string
          nom: string
          taille: number
          type: string
          url: string
        }
        Update: {
          chauffeur_id?: string | null
          created_at?: string | null
          id?: string
          nom?: string
          taille?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_vehicules: {
        Row: {
          created_at: string
          date_expiration: string | null
          id: string
          nom: string
          statut: string | null
          taille: number | null
          type: string
          url: string
          vehicule_id: string
        }
        Insert: {
          created_at?: string
          date_expiration?: string | null
          id?: string
          nom: string
          statut?: string | null
          taille?: number | null
          type: string
          url: string
          vehicule_id: string
        }
        Update: {
          created_at?: string
          date_expiration?: string | null
          id?: string
          nom?: string
          statut?: string | null
          taille?: number | null
          type?: string
          url?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_vehicules_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          created_at: string
          date_embauche: string
          date_fin_contrat: string | null
          email: string | null
          id: string
          nom: string
          photo_url: string | null
          poste: string
          prenom: string
          remarques: string | null
          service: string
          statut: string
          telephone: string | null
          type_contrat: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_embauche: string
          date_fin_contrat?: string | null
          email?: string | null
          id?: string
          nom: string
          photo_url?: string | null
          poste: string
          prenom: string
          remarques?: string | null
          service: string
          statut?: string
          telephone?: string | null
          type_contrat?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_embauche?: string
          date_fin_contrat?: string | null
          email?: string | null
          id?: string
          nom?: string
          photo_url?: string | null
          poste?: string
          prenom?: string
          remarques?: string | null
          service?: string
          statut?: string
          telephone?: string | null
          type_contrat?: string
          updated_at?: string
        }
        Relationships: []
      }
      facture_lignes: {
        Row: {
          created_at: string
          description: string
          facture_id: string | null
          id: string
          prix_unitaire: number
          quantite: number
          total: number
        }
        Insert: {
          created_at?: string
          description: string
          facture_id?: string | null
          id?: string
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Update: {
          created_at?: string
          description?: string
          facture_id?: string | null
          id?: string
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "facture_lignes_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          chauffeur: string | null
          client_contact: string | null
          client_email: string | null
          client_id: string | null
          client_nom: string
          client_societe: string | null
          created_at: string
          date_echeance: string
          date_emission: string
          id: string
          mission_numero: string | null
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          type_transport: string | null
          updated_at: string
          vehicule: string | null
        }
        Insert: {
          chauffeur?: string | null
          client_contact?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom: string
          client_societe?: string | null
          created_at?: string
          date_echeance: string
          date_emission: string
          id?: string
          mission_numero?: string | null
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          type_transport?: string | null
          updated_at?: string
          vehicule?: string | null
        }
        Update: {
          chauffeur?: string | null
          client_contact?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom?: string
          client_societe?: string | null
          created_at?: string
          date_echeance?: string
          date_emission?: string
          id?: string
          mission_numero?: string | null
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          type_transport?: string | null
          updated_at?: string
          vehicule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_employes: {
        Row: {
          certificat_url: string | null
          created_at: string
          date_debut: string
          date_expiration: string | null
          date_fin: string | null
          employe_id: string
          id: string
          nom_formation: string
          obligatoire: boolean | null
          organisme: string | null
          remarques: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          certificat_url?: string | null
          created_at?: string
          date_debut: string
          date_expiration?: string | null
          date_fin?: string | null
          employe_id: string
          id?: string
          nom_formation: string
          obligatoire?: boolean | null
          organisme?: string | null
          remarques?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          certificat_url?: string | null
          created_at?: string
          date_debut?: string
          date_expiration?: string | null
          date_fin?: string | null
          employe_id?: string
          id?: string
          nom_formation?: string
          obligatoire?: boolean | null
          organisme?: string | null
          remarques?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_employes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_rh: {
        Row: {
          ancien_poste: string | null
          ancien_service: string | null
          created_at: string
          date_evenement: string
          description: string
          employe_id: string
          id: string
          nouveau_poste: string | null
          nouveau_service: string | null
          saisi_par: string | null
          type_evenement: string
        }
        Insert: {
          ancien_poste?: string | null
          ancien_service?: string | null
          created_at?: string
          date_evenement?: string
          description: string
          employe_id: string
          id?: string
          nouveau_poste?: string | null
          nouveau_service?: string | null
          saisi_par?: string | null
          type_evenement: string
        }
        Update: {
          ancien_poste?: string | null
          ancien_service?: string | null
          created_at?: string
          date_evenement?: string
          description?: string
          employe_id?: string
          id?: string
          nouveau_poste?: string | null
          nouveau_service?: string | null
          saisi_par?: string | null
          type_evenement?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_rh_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_vehicules: {
        Row: {
          cout: number | null
          created_at: string
          date_maintenance: string
          description: string | null
          garage: string | null
          id: string
          kilometrage_maintenance: number | null
          pieces_changees: string[] | null
          prochaine_maintenance_prevue: string | null
          type_maintenance: string
          vehicule_id: string
        }
        Insert: {
          cout?: number | null
          created_at?: string
          date_maintenance: string
          description?: string | null
          garage?: string | null
          id?: string
          kilometrage_maintenance?: number | null
          pieces_changees?: string[] | null
          prochaine_maintenance_prevue?: string | null
          type_maintenance: string
          vehicule_id: string
        }
        Update: {
          cout?: number | null
          created_at?: string
          date_maintenance?: string
          description?: string | null
          garage?: string | null
          id?: string
          kilometrage_maintenance?: number | null
          pieces_changees?: string[] | null
          prochaine_maintenance_prevue?: string | null
          type_maintenance?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_vehicules_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          chauffeur_id: string
          created_at: string
          created_by: string | null
          date_heure_arrivee_prevue: string
          date_heure_depart: string
          id: string
          numero: string
          observations: string | null
          site_arrivee: string
          site_depart: string
          statut: string
          type_transport: string
          unite_mesure: string | null
          updated_at: string
          vehicule_id: string
          volume_poids: number | null
        }
        Insert: {
          chauffeur_id: string
          created_at?: string
          created_by?: string | null
          date_heure_arrivee_prevue: string
          date_heure_depart: string
          id?: string
          numero: string
          observations?: string | null
          site_arrivee: string
          site_depart: string
          statut?: string
          type_transport: string
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id: string
          volume_poids?: number | null
        }
        Update: {
          chauffeur_id?: string
          created_at?: string
          created_by?: string | null
          date_heure_arrivee_prevue?: string
          date_heure_depart?: string
          id?: string
          numero?: string
          observations?: string | null
          site_arrivee?: string
          site_depart?: string
          statut?: string
          type_transport?: string
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id?: string
          volume_poids?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      missions_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          created_at: string
          details: string | null
          id: string
          mission_id: string
          nouveau_statut: string | null
          utilisateur_nom: string | null
          utilisateur_role: string | null
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          created_at?: string
          details?: string | null
          id?: string
          mission_id: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          created_at?: string
          details?: string | null
          id?: string
          mission_id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_historique_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_etapes: {
        Row: {
          commentaire: string | null
          created_at: string
          date_validation: string | null
          etape: string
          id: string
          statut: string
          updated_at: string
          validateur_nom: string | null
          validateur_role: string | null
          workflow_id: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          date_validation?: string | null
          etape: string
          id?: string
          statut?: string
          updated_at?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          date_validation?: string | null
          etape?: string
          id?: string
          statut?: string
          updated_at?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_etapes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "validation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_historique: {
        Row: {
          ancien_statut: string | null
          commentaire: string | null
          created_at: string
          etape: string
          id: string
          nouveau_statut: string
          validateur_nom: string | null
          validateur_role: string | null
          workflow_id: string
        }
        Insert: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          etape: string
          id?: string
          nouveau_statut: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id: string
        }
        Update: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          etape?: string
          id?: string
          nouveau_statut?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_historique_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "validation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_workflows: {
        Row: {
          created_at: string
          id: string
          statut_global: string
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          statut_global?: string
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          statut_global?: string
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_workflows_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: true
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicules: {
        Row: {
          annee_fabrication: number | null
          capacite_max: number | null
          chauffeur_assigne: string | null
          consommation_moyenne: number | null
          created_at: string
          derniere_maintenance: string | null
          id: string
          immatriculation: string
          kilometrage: number | null
          marque: string
          modele: string
          numero: string
          numero_chassis: string | null
          prochaine_maintenance: string | null
          statut: string
          type_transport: string
          unite_capacite: string | null
          updated_at: string
        }
        Insert: {
          annee_fabrication?: number | null
          capacite_max?: number | null
          chauffeur_assigne?: string | null
          consommation_moyenne?: number | null
          created_at?: string
          derniere_maintenance?: string | null
          id?: string
          immatriculation: string
          kilometrage?: number | null
          marque: string
          modele: string
          numero: string
          numero_chassis?: string | null
          prochaine_maintenance?: string | null
          statut?: string
          type_transport: string
          unite_capacite?: string | null
          updated_at?: string
        }
        Update: {
          annee_fabrication?: number | null
          capacite_max?: number | null
          chauffeur_assigne?: string | null
          consommation_moyenne?: number | null
          created_at?: string
          derniere_maintenance?: string | null
          id?: string
          immatriculation?: string
          kilometrage?: number | null
          marque?: string
          modele?: string
          numero?: string
          numero_chassis?: string | null
          prochaine_maintenance?: string | null
          statut?: string
          type_transport?: string
          unite_capacite?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicules_chauffeur_assigne_fkey"
            columns: ["chauffeur_assigne"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      alertes_rh: {
        Row: {
          date_echeance: string | null
          employe_id: string | null
          message: string | null
          nom_complet: string | null
          poste: string | null
          priorite: string | null
          service: string | null
          type_alerte: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_resource_availability: {
        Args: {
          p_vehicule_id: string
          p_chauffeur_id: string
          p_date_debut: string
          p_date_fin: string
          p_mission_id?: string
        }
        Returns: {
          vehicule_disponible: boolean
          chauffeur_disponible: boolean
          message: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
