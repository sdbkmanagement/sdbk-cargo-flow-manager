
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
