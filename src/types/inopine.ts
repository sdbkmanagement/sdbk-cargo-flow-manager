// Types pour les contrôles inopinés HSEQ

export type InopineStatut = 'en_cours' | 'conforme' | 'conforme_avec_reserve' | 'non_conforme';

export interface ControleInopine {
  id: string;
  vehicule_id: string;
  chauffeur_id: string;
  controleur_id?: string;
  type_controle: 'INOPINE';
  statut: InopineStatut;
  date_controle: string;
  latitude?: number;
  longitude?: number;
  lieu_controle?: string;
  signature_controleur_url?: string;
  signature_controleur_date?: string;
  signature_chauffeur_url?: string;
  signature_chauffeur_date?: string;
  confirmation_controleur: boolean;
  confirmation_chauffeur: boolean;
  observations?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  local_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  vehicule?: {
    id: string;
    numero: string;
    immatriculation: string;
  };
  chauffeur?: {
    id: string;
    nom: string;
    prenom: string;
  };
  controleur?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  items?: ControleInopineItem[];
}

export interface ControleInopineItem {
  id: string;
  control_id: string;
  categorie: string;
  code_point: string;
  libelle: string;
  is_conforme?: boolean;
  is_critical: boolean;
  commentaire?: string;
  medias: string[];
  created_at: string;
  updated_at: string;
}

// Configuration de la checklist spécifique INOPINÉ
export interface InopineCheckpoint {
  code: string;
  libelle: string;
  critical: boolean;
}

export interface InopineCategory {
  code: string;
  libelle: string;
  checkpoints: InopineCheckpoint[];
}

// Points de contrôle INOPINÉ selon la spécification
export const INOPINE_CATEGORIES: InopineCategory[] = [
  {
    code: 'CONDUITE_COMPORTEMENT',
    libelle: 'Conduite & Comportement',
    checkpoints: [
      { code: 'CODE_CONDUITE', libelle: 'Respect du code de conduite', critical: true },
      { code: 'VITESSE_ALLURE', libelle: 'Vitesse et allure adaptées', critical: true },
      { code: 'CEINTURE', libelle: 'Port de la ceinture de sécurité', critical: true },
      { code: 'DEPASSEMENT', libelle: 'Respect des règles de dépassement', critical: false },
      { code: 'ETAT_PHYSIQUE', libelle: 'État physique correct du chauffeur', critical: true },
      { code: 'ALCOOL_DROGUE', libelle: 'Absence d\'alcool ou de drogue', critical: true },
      { code: 'PASSAGER', libelle: 'Absence de passager non autorisé', critical: false },
    ],
  },
  {
    code: 'DOCUMENTS',
    libelle: 'Documents chauffeur & véhicule',
    checkpoints: [
      { code: 'MANUEL', libelle: 'Manuel de procédures présent', critical: false },
      { code: 'SCHEMA_ALERTE', libelle: 'Schéma d\'alerte disponible', critical: false },
      { code: 'FEUILLE_ROUTE', libelle: 'Feuille de route à jour', critical: true },
      { code: 'BL', libelle: 'Bon de livraison conforme', critical: true },
      { code: 'ROAD_BOOK', libelle: 'Road book / itinéraire', critical: false },
      { code: 'DOC_BORD', libelle: 'Documents de bord complets', critical: true },
    ],
  },
  {
    code: 'ETAT_VEHICULE',
    libelle: 'État du véhicule',
    checkpoints: [
      { code: 'INTERIEUR', libelle: 'Propreté intérieure cabine', critical: false },
      { code: 'EXTERIEUR', libelle: 'État extérieur correct', critical: false },
      { code: 'ETANCHEITE', libelle: 'Étanchéité citerne vérifiée', critical: true },
      { code: 'PNEUS', libelle: 'État des pneus conforme', critical: true },
      { code: 'PRESSION', libelle: 'Pression des pneus correcte', critical: false },
      { code: 'ECROUS_TEMOINS', libelle: 'Écrous avec témoins en place', critical: false },
      { code: 'RETROVISEURS', libelle: 'Rétroviseurs en bon état', critical: false },
      { code: 'ACCES_CABINE', libelle: 'Accès cabine sécurisé', critical: false },
    ],
  },
  {
    code: 'EQUIPEMENTS_SECURITE',
    libelle: 'Équipements de sécurité',
    checkpoints: [
      { code: 'CALES', libelle: 'Cales de roues présentes', critical: true },
      { code: 'SIGNALISATION', libelle: 'Équipements de signalisation', critical: true },
      { code: 'DEPOTAGE', libelle: 'Équipements de dépotage', critical: false },
      { code: 'MARTEAU_BRISE_VITRE', libelle: 'Marteau brise-vitre', critical: false },
      { code: 'CRIC_PELLE_SEAU', libelle: 'Cric, pelle, seau alu', critical: false },
      { code: 'MEGAPHONE', libelle: 'Mégaphone fonctionnel', critical: true },
      { code: 'TROUSSE_SECOURS', libelle: 'Trousse de secours complète', critical: true },
      { code: 'TRIANGLE', libelle: 'Triangle de signalisation', critical: true },
      { code: 'LAMPE', libelle: 'Lampe torche', critical: false },
      { code: 'EPI', libelle: 'EPI complets et conformes', critical: true },
    ],
  },
];

// Comptages
export const TOTAL_INOPINE_CHECKPOINTS = INOPINE_CATEGORIES.reduce(
  (acc, cat) => acc + cat.checkpoints.length, 
  0
);

export const CRITICAL_INOPINE_CHECKPOINTS = INOPINE_CATEGORIES.reduce(
  (acc, cat) => acc + cat.checkpoints.filter(c => c.critical).length, 
  0
);

export interface InopineStats {
  totalControles: number;
  conformes: number;
  conformesAvecReserve: number;
  nonConformes: number;
  tauxConformite: number;
}
