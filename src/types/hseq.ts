// Types pour le module HSEQ

export type STLStatut = 'en_cours' | 'conforme' | 'non_conforme' | 'refuse';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type NCType = 'critique' | 'majeure' | 'mineure';
export type NCStatut = 'ouverte' | 'en_cours' | 'resolue' | 'fermee' | 'annulee';

export interface SafeToLoadControl {
  id: string;
  vehicule_id: string;
  chauffeur_id: string;
  controleur_id?: string;
  statut: STLStatut;
  is_blocking: boolean;
  date_controle: string;
  lieu_controle?: string;
  latitude?: number;
  longitude?: number;
  signature_controleur_url?: string;
  signature_controleur_date?: string;
  signature_chauffeur_url?: string;
  signature_chauffeur_date?: string;
  confirmation_controleur: boolean;
  confirmation_chauffeur: boolean;
  observations?: string;
  sync_status: SyncStatus;
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
  items?: SafeToLoadItem[];
}

export interface SafeToLoadItem {
  id: string;
  control_id: string;
  categorie: string;
  code_point: string;
  libelle: string;
  is_conforme?: boolean;
  is_critical: boolean;
  commentaire?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface NonConformite {
  id: string;
  safe_to_load_id?: string;
  vehicule_id?: string;
  chauffeur_id?: string;
  numero: string;
  type_nc: NCType;
  categorie?: string;
  description: string;
  service_responsable?: string;
  responsable_id?: string;
  statut: NCStatut;
  date_detection: string;
  date_echeance?: string;
  date_resolution?: string;
  action_corrective?: string;
  action_preventive?: string;
  verification?: string;
  photos: string[];
  documents: string[];
  created_by?: string;
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
}

export interface NCHistorique {
  id: string;
  non_conformite_id: string;
  action: string;
  ancien_statut?: string;
  nouveau_statut?: string;
  commentaire?: string;
  utilisateur_id?: string;
  utilisateur_nom?: string;
  created_at: string;
}

export interface HSEQStats {
  totalControles: number;
  conformes: number;
  nonConformes: number;
  refuses: number;
  tauxConformite: number;
  ncOuvertes: number;
  ncCritiques: number;
  ncEnCours: number;
}

// Configuration des points de contrôle SAFE TO LOAD
export interface STLCheckpoint {
  code: string;
  libelle: string;
  critical: boolean;
}

export interface STLCategory {
  code: string;
  libelle: string;
  checkpoints: STLCheckpoint[];
}

// Points de contrôle SAFE TO LOAD selon la spécification
export const SAFE_TO_LOAD_CATEGORIES: STLCategory[] = [
  {
    code: 'EQUIP_SEC',
    libelle: 'A. Équipements de sécurité obligatoires',
    checkpoints: [
      { code: 'MEGAPHONE', libelle: 'Présence mégaphone', critical: true },
      { code: 'EXTINCTEURS', libelle: 'Extincteurs', critical: true },
      { code: 'ALARME_RECUL', libelle: 'Alarme de recul', critical: false },
      { code: 'COUPE_BATTERIE', libelle: 'Coupe-batterie (cabine ou extérieur)', critical: true },
      { code: 'SIGNAUX_AVERTISSEMENT', libelle: 'Deux signaux d\'avertissement (triangles ou cônes)', critical: true },
      { code: 'BANDE_REFLECHISSANTE', libelle: 'Bande réfléchissante', critical: true },
      { code: 'TEL_URGENCE', libelle: 'Numéro de téléphone d\'urgence', critical: true },
      { code: 'PHARMACIE', libelle: 'Boîte à pharmacie', critical: false },
      { code: 'EPI_CONDUCTEUR', libelle: 'EPI conducteur', critical: true },
    ],
  },
  {
    code: 'ACCES_STRUCT',
    libelle: 'B. Accès, structure et superstructure',
    checkpoints: [
      { code: 'ECHELLE_RAMBARDE', libelle: 'Échelle, rambarde et passerelle supérieure', critical: true },
      { code: 'ARMATURE_DOME', libelle: 'Armature de sécurité du dôme', critical: false },
      { code: 'SOUDURES_FISSURES', libelle: 'États des soudures et absence de fissures', critical: true },
      { code: 'BARRE_ANTI_ENCASTREMENT', libelle: 'Barre anti-encastrement', critical: false },
      { code: 'OBTURATEURS', libelle: 'Obturateurs', critical: true },
    ],
  },
  {
    code: 'CIRCUIT_PRODUIT',
    libelle: 'C. Circuit produit / citerne',
    checkpoints: [
      { code: 'ABSENCE_FUITES', libelle: 'Absence de fuites', critical: true },
      { code: 'CLAPETS_FOND', libelle: 'Clapets de fond', critical: true },
      { code: 'FLEXIBLES', libelle: 'Flexibles', critical: true },
      { code: 'JAUGE_NIVEAU', libelle: 'Jauge ou système de contrôle de niveau', critical: false },
      { code: 'SOUS_PRESSION', libelle: 'Vérification que le camion est sous pression', critical: false },
      { code: 'DOC_AGREMENT', libelle: 'Documentation d\'agrément et date d\'épreuve', critical: false },
    ],
  },
  {
    code: 'VEHICULE_MECA',
    libelle: 'D. Véhicule & mécanique',
    checkpoints: [
      { code: 'ROUES_JANTES', libelle: 'Roues / jantes', critical: true },
      { code: 'PNEUS', libelle: 'Pneus', critical: true },
      { code: 'TEMOINS_ECROU', libelle: 'Présence témoins d\'écrou', critical: false },
      { code: 'SELLETTE_PIVOT', libelle: 'Sellette et pivot d\'attelage', critical: true },
      { code: 'TEST_FREIN', libelle: 'Test du frein', critical: true },
      { code: 'ECLAIRAGE', libelle: 'Éclairage', critical: false },
      { code: 'VISIBILITE', libelle: 'Visibilité', critical: false },
      { code: 'CEINTURES', libelle: 'Ceintures de sécurité (trois points)', critical: true },
    ],
  },
  {
    code: 'ELEC_TERRE',
    libelle: 'E. Électricité & mise à la terre',
    checkpoints: [
      { code: 'CABLAGE_ELEC', libelle: 'État général du câblage électrique', critical: true },
      { code: 'PRISE_TERRE', libelle: 'Prise de terre', critical: true },
    ],
  },
  {
    code: 'CHAUFFEUR_DOC',
    libelle: 'F. Chauffeur & documents',
    checkpoints: [
      { code: 'PERMIS_ATTESTATIONS', libelle: 'Permis de conduire et attestations', critical: true },
      { code: 'CLE_OBC', libelle: 'Présence clé OBC du chauffeur', critical: false },
      { code: 'CARNET_ENTRETIEN', libelle: 'Carnet d\'entretien rempli et à jour', critical: true },
      { code: 'ROAD_BOOK', libelle: 'Road book / carte murale valide', critical: false },
    ],
  },
  {
    code: 'STATIONNEMENT',
    libelle: 'G. Sécurité stationnement',
    checkpoints: [
      { code: 'CALES_ROUES', libelle: 'Cales de roues', critical: true },
    ],
  },
];

// Comptage total
export const TOTAL_CHECKPOINTS = SAFE_TO_LOAD_CATEGORIES.reduce(
  (acc, cat) => acc + cat.checkpoints.length, 
  0
);

export const CRITICAL_CHECKPOINTS = SAFE_TO_LOAD_CATEGORIES.reduce(
  (acc, cat) => acc + cat.checkpoints.filter(c => c.critical).length, 
  0
);
