
export interface BonLivraison {
  id?: string;
  numero: string;
  client_nom: string;
  client_code?: string;
  client_code_total?: string;
  destination: string;
  vehicule_id: string;
  chauffeur_id: string;
  date_emission: string;
  produit: 'essence' | 'gasoil';
  quantite_prevue: number;
  unite_mesure: 'litres';
  
  // Données de suivi (remplies après le voyage)
  numero_tournee?: string;
  date_chargement_prevue?: string;
  date_chargement_reelle?: string;
  date_depart?: string;
  date_arrivee_prevue?: string;
  date_arrivee_reelle?: string;
  date_dechargement?: string;
  quantite_livree?: number;
  manquant_cuve?: number;
  manquant_compteur?: number;
  manquant_total?: number;
  
  // Données financières
  prix_unitaire?: number;
  montant_total?: number;
  montant_facture?: number;
  associe_id?: string;
  chiffre_affaire_associe?: number;
  
  statut: 'emis' | 'charge' | 'en_route' | 'livre' | 'termine';
  observations?: string;
  facture?: boolean;
  
  // Métadonnées
  mission_id?: string;
  created_at?: string;
  updated_at?: string;
  saisi_par?: string;
  transitaire_nom?: string;
}
