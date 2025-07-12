
import { Database } from '@/integrations/supabase/types';

// Use the actual database type directly
export type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

export interface ChauffeurDetaille extends Chauffeur {
  dateNaissance: Date;
  adresse: string;
  ville: string;
  codePostal: string;
  nationalite: string;
  numeroSecuriteSociale: string;
  dateEntree: Date;
  photoUrl?: string;
  signatureUrl?: string;
  notes: NoteInterne[];
  incidents: Incident[];
  absences: Absence[];
  affectations: AffectationHistorique[];
}

export interface NoteInterne {
  id: string;
  chauffeurId: string;
  auteurId: string;
  date: Date;
  type: 'ponctualite' | 'comportement' | 'securite' | 'autre';
  note: number; // sur 5
  commentaire: string;
  visible: boolean;
}

export interface Incident {
  id: string;
  chauffeurId: string;
  date: Date;
  type: 'retard' | 'infraction' | 'accident' | 'plainte' | 'autre';
  gravite: 'faible' | 'moyenne' | 'grave';
  description: string;
  mesuresPrises: string;
  statut: 'ouvert' | 'en_cours' | 'resolu';
}

export interface Absence {
  id: string;
  chauffeurId: string;
  dateDebut: Date;
  dateFin: Date;
  type: 'conge' | 'maladie' | 'formation' | 'suspension' | 'autre';
  motif: string;
  justificatif?: string;
  approuve: boolean;
}

export interface AffectationHistorique {
  id: string;
  chauffeurId: string;
  vehiculeId: string;
  missionId?: string;
  dateDebut: Date;
  dateFin?: Date;
  type: 'mission' | 'affectation_vehicule';
}

export interface AlerteDocument {
  id: string;
  chauffeurId: string;
  documentId: string;
  typeDocument: string;
  dateExpiration: Date;
  joursAvantExpiration: number;
  niveau: 'info' | 'warning' | 'danger';
}
