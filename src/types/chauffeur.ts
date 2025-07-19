
import { Chauffeur, Formation, Document } from './index';

export interface ChauffeurDetaille extends Chauffeur {
  matricule?: string;
  id_conducteur?: string;
  immatricule_cnss?: string;
  fonction?: 'titulaire' | 'reserve' | 'doublon';
  base_chauffeur?: 'conakry' | 'kankan' | 'nzerekore';
  dateNaissance: Date;
  age?: number;
  lieu_naissance?: string;
  adresse: string;
  ville: string;
  codePostal: string;
  nationalite: string;
  numeroSecuriteSociale: string;
  dateEntree: Date;
  date_embauche?: Date;
  groupe_sanguin?: string;
  filiation?: string;
  statut_matrimonial?: string;
  statut_disponibilite?: 'disponible' | 'en_conge' | 'maladie' | 'indisponible';
  date_debut_statut?: Date;
  date_fin_statut?: Date;
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

export interface ChauffeurStatutHistorique {
  id: string;
  chauffeur_id: string;
  ancien_statut?: string;
  nouveau_statut: string;
  date_debut: Date;
  date_fin?: Date;
  motif?: string;
  created_at: Date;
  created_by?: string;
}

// Types de documents spécifiques aux chauffeurs
export const CHAUFFEUR_DOCUMENT_TYPES = {
  'certificat_aptitude_medicale': {
    label: 'Certificat d\'aptitude médicale',
    duree_mois: 12
  },
  'attestation_recyclage': {
    label: 'Attestation recyclage',
    duree_mois: 12
  },
  'copie_permis_titulaire': {
    label: 'Copie permis titulaire',
    duree_mois: 60
  },
  'autorisation_conduite': {
    label: 'Autorisation de conduite',
    duree_mois: 12
  },
  'formation_total': {
    label: 'Formation TOTAL',
    duree_mois: null
  },
  'fiche_poste': {
    label: 'Fiche de poste',
    duree_mois: null
  },
  'caisse_securite_sociale': {
    label: 'Caisse nationale de la sécurité sociale',
    duree_mois: null
  },
  'copie_carte_identite': {
    label: 'Copie de la carte d\'identité nationale',
    duree_mois: 60
  }
} as const;
