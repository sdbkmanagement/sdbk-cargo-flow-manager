
export const CHAUFFEUR_DOCUMENT_TYPES = {
  permis_conduire: {
    label: 'Permis de conduire',
    duree_mois: 120, // 10 ans
    obligatoire: false
  },
  visite_medicale: {
    label: 'Visite médicale',
    duree_mois: 12, // 1 an
    obligatoire: false
  },
  formation_adr: {
    label: 'Formation ADR',
    duree_mois: 60, // 5 ans
    obligatoire: false
  },
  formation_hse: {
    label: 'Formation HSE',
    duree_mois: 36, // 3 ans
    obligatoire: false
  },
  formation_conduite: {
    label: 'Formation conduite',
    duree_mois: 24, // 2 ans
    obligatoire: false
  },
  certificat_medical: {
    label: 'Certificat médical',
    duree_mois: 12, // 1 an
    obligatoire: false
  },
  carte_professionnelle: {
    label: 'Carte professionnelle',
    duree_mois: 60, // 5 ans
    obligatoire: false
  },
  carte_identite: {
    label: 'Carte d\'identité',
    duree_mois: 120, // 10 ans
    obligatoire: false
  },
  attestation_assurance: {
    label: 'Attestation d\'assurance',
    duree_mois: 12, // 1 an
    obligatoire: false
  },
  contrat_travail: {
    label: 'Contrat de travail',
    duree_mois: null, // Pas d'expiration automatique
    obligatoire: false
  },
  photo_profil: {
    label: 'Photo de profil',
    duree_mois: null, // Pas d'expiration automatique
    obligatoire: false
  }
};

export interface ChauffeurDocument {
  id: string;
  chauffeur_id: string;
  type: keyof typeof CHAUFFEUR_DOCUMENT_TYPES;
  nom: string;
  url: string;
  date_expiration?: string;
  date_delivrance?: string;
  statut: 'valide' | 'expire' | 'a_renouveler';
  taille: number;
  created_at: string;
  updated_at?: string;
}
