export type UserRole = 
  | 'maintenance' 
  | 'administratif' 
  | 'hsecq' 
  | 'obc' 
  | 'transport' 
  | 'facturation' 
  | 'rh' 
  | 'direction' 
  | 'admin'
  | 'transitaire'
  | 'directeur_exploitation';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
}

export interface UserWithRole {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface Vehicle {
  id: string;
  numero: string;
  marque: string;
  modele: string;
  immatriculation: string;
  typeTransport: 'hydrocarbures' | 'bauxite';
  statut: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise';
  derniereMaintenance: Date;
  prochaineMaintenance: Date;
  documents: Document[];
  chauffeurAssigne?: string;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  numeroPermis: string;
  typePermis: string[];
  dateExpirationPermis: Date;
  formations: Formation[];
  statut: 'actif' | 'conge' | 'maladie' | 'suspendu';
  vehiculeAssigne?: string;
}

export interface Mission {
  id: string;
  numero: string;
  vehiculeId: string;
  chauffeurId: string;
  typeChargement: 'hydrocarbures' | 'bauxite';
  lieuChargement: string;
  lieuLivraison: string;
  dateDebut: Date;
  dateFin?: Date;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  validation: ValidationStatus;
  chargement?: Chargement;
}

export interface ValidationStatus {
  maintenance: boolean;
  administratif: boolean;
  hsecq: boolean;
  obc: boolean;
  commentaires: string[];
}

export interface Chargement {
  id: string;
  missionId: string;
  produit: string;
  quantite: number;
  unite: string;
  temperature?: number;
  pression?: number;
  documents: Document[];
}

export interface Document {
  id: string;
  nom: string;
  type: string;
  dateExpiration?: Date;
  statut: 'valide' | 'expire' | 'a_renouveler';
  url: string;
}

export interface Formation {
  id: string;
  nom: string;
  dateObtention: Date;
  dateExpiration: Date;
  organisme: string;
}

export interface Facture {
  id: string;
  numero: string;
  missionId: string;
  montant: number;
  statut: 'en_attente' | 'paye' | 'retard';
  dateEmission: Date;
  dateEcheance: Date;
}
