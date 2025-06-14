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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
