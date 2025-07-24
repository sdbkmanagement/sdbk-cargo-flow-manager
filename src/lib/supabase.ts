
import { createClient } from '@supabase/supabase-js'

// Use the hardcoded values from the auto-generated client for consistency
const supabaseUrl = "https://vyyexbyqjrasipkxezpl.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eWV4YnlxanJhc2lwa3hlenBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDM4MjksImV4cCI6MjA2NTQ3OTgyOX0.K_6nwFfaNWG_MkY9qSdbDMeq1emoq7O3P5zYydMjUKM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour la base de données
export interface Chauffeur {
  id: string
  nom: string
  prenom: string
  date_naissance?: string
  telephone: string
  email?: string
  adresse?: string
  ville?: string
  code_postal?: string
  numero_permis: string
  type_permis: string[]
  date_expiration_permis: string
  statut: 'actif' | 'conge' | 'maladie' | 'suspendu'
  vehicule_assigne?: string
  photo_url?: string
  signature_url?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  chauffeur_id: string
  nom: string
  type: string
  url: string
  taille: number
  created_at: string
}
