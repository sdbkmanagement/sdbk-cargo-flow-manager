export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          approuve_par: string | null
          commentaires: string | null
          created_at: string
          date_debut: string
          date_fin: string
          employe_id: string
          id: string
          motif: string | null
          nombre_jours: number | null
          statut: string
          type_absence: string
          updated_at: string
        }
        Insert: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_debut: string
          date_fin: string
          employe_id: string
          id?: string
          motif?: string | null
          nombre_jours?: number | null
          statut?: string
          type_absence: string
          updated_at?: string
        }
        Update: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          employe_id?: string
          id?: string
          motif?: string | null
          nombre_jours?: number | null
          statut?: string
          type_absence?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affectations_chauffeurs: {
        Row: {
          autorise_par: string | null
          chauffeur_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          motif_changement: string | null
          statut: string
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          autorise_par?: string | null
          chauffeur_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          motif_changement?: string | null
          statut?: string
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          autorise_par?: string | null
          chauffeur_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          motif_changement?: string | null
          statut?: string
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affectations_chauffeurs_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_chauffeurs_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      associes: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          pourcentage_participation: number | null
          prenom: string
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          pourcentage_participation?: number | null
          prenom: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          pourcentage_participation?: number | null
          prenom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bons_livraison: {
        Row: {
          associe_id: string | null
          chauffeur_id: string
          chiffre_affaire_associe: number | null
          client_code: string | null
          client_code_total: string | null
          created_at: string
          date_arrivee_prevue: string | null
          date_arrivee_reelle: string | null
          date_chargement_prevue: string | null
          date_chargement_reelle: string | null
          date_dechargement: string | null
          date_depart: string | null
          date_emission: string
          destination: string
          facture: boolean | null
          id: string
          lieu_arrivee: string | null
          lieu_depart: string | null
          manquant_compteur: number | null
          manquant_cuve: number | null
          manquant_total: number | null
          mission_id: string | null
          montant_facture: number | null
          montant_total: number | null
          numero: string
          numero_tournee: string | null
          observations: string | null
          prix_unitaire: number | null
          produit: string
          quantite_livree: number | null
          quantite_prevue: number
          saisi_par: string | null
          statut: string
          transitaire_nom: string | null
          unite_mesure: string | null
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          associe_id?: string | null
          chauffeur_id: string
          chiffre_affaire_associe?: number | null
          client_code?: string | null
          client_code_total?: string | null
          created_at?: string
          date_arrivee_prevue?: string | null
          date_arrivee_reelle?: string | null
          date_chargement_prevue?: string | null
          date_chargement_reelle?: string | null
          date_dechargement?: string | null
          date_depart?: string | null
          date_emission: string
          destination: string
          facture?: boolean | null
          id?: string
          lieu_arrivee?: string | null
          lieu_depart?: string | null
          manquant_compteur?: number | null
          manquant_cuve?: number | null
          manquant_total?: number | null
          mission_id?: string | null
          montant_facture?: number | null
          montant_total?: number | null
          numero: string
          numero_tournee?: string | null
          observations?: string | null
          prix_unitaire?: number | null
          produit: string
          quantite_livree?: number | null
          quantite_prevue: number
          saisi_par?: string | null
          statut?: string
          transitaire_nom?: string | null
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          associe_id?: string | null
          chauffeur_id?: string
          chiffre_affaire_associe?: number | null
          client_code?: string | null
          client_code_total?: string | null
          created_at?: string
          date_arrivee_prevue?: string | null
          date_arrivee_reelle?: string | null
          date_chargement_prevue?: string | null
          date_chargement_reelle?: string | null
          date_dechargement?: string | null
          date_depart?: string | null
          date_emission?: string
          destination?: string
          facture?: boolean | null
          id?: string
          lieu_arrivee?: string | null
          lieu_depart?: string | null
          manquant_compteur?: number | null
          manquant_cuve?: number | null
          manquant_total?: number | null
          mission_id?: string | null
          montant_facture?: number | null
          montant_total?: number | null
          numero?: string
          numero_tournee?: string | null
          observations?: string | null
          prix_unitaire?: number | null
          produit?: string
          quantite_livree?: number | null
          quantite_prevue?: number
          saisi_par?: string | null
          statut?: string
          transitaire_nom?: string | null
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bons_livraison_associe_id_fkey"
            columns: ["associe_id"]
            isOneToOne: false
            referencedRelation: "associes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_livraison_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_livraison_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_livraison_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      chargements: {
        Row: {
          chauffeur_id: string
          client_nom: string
          created_at: string
          created_by: string | null
          date_heure_chargement: string
          id: string
          lieu_chargement: string
          lieu_livraison: string
          mission_id: string
          numero: string
          observations: string | null
          statut: string
          type_chargement: string
          unite_mesure: string
          updated_at: string
          vehicule_id: string
          volume_poids: number
        }
        Insert: {
          chauffeur_id: string
          client_nom: string
          created_at?: string
          created_by?: string | null
          date_heure_chargement: string
          id?: string
          lieu_chargement: string
          lieu_livraison: string
          mission_id: string
          numero: string
          observations?: string | null
          statut?: string
          type_chargement: string
          unite_mesure?: string
          updated_at?: string
          vehicule_id: string
          volume_poids: number
        }
        Update: {
          chauffeur_id?: string
          client_nom?: string
          created_at?: string
          created_by?: string | null
          date_heure_chargement?: string
          id?: string
          lieu_chargement?: string
          lieu_livraison?: string
          mission_id?: string
          numero?: string
          observations?: string | null
          statut?: string
          type_chargement?: string
          unite_mesure?: string
          updated_at?: string
          vehicule_id?: string
          volume_poids?: number
        }
        Relationships: [
          {
            foreignKeyName: "chargements_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chargements_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chargements_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      chargements_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          chargement_id: string
          created_at: string
          details: string | null
          id: string
          nouveau_statut: string | null
          utilisateur_nom: string | null
          utilisateur_role: string | null
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          chargement_id: string
          created_at?: string
          details?: string | null
          id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          chargement_id?: string
          created_at?: string
          details?: string | null
          id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          adresse: string | null
          age: number | null
          base_chauffeur: string | null
          code_postal: string | null
          contrat_url: string | null
          created_at: string | null
          date_debut_statut: string | null
          date_embauche: string | null
          date_expiration_permis: string
          date_fin_statut: string | null
          date_naissance: string | null
          date_obtention_permis: string | null
          email: string | null
          filiation: string | null
          fonction: string | null
          groupe_sanguin: string | null
          id: string
          id_conducteur: string | null
          immatricule_cnss: string | null
          lieu_naissance: string | null
          matricule: string | null
          nationalite: string | null
          nom: string
          numero_permis: string
          photo_url: string | null
          prenom: string
          signature_url: string | null
          statut: string | null
          statut_disponibilite: string | null
          statut_matrimonial: string | null
          telephone: string
          type_contrat: string | null
          type_permis: string[]
          updated_at: string | null
          urgence_nom: string | null
          urgence_prenom: string | null
          urgence_telephone: string | null
          vehicule_assigne: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          age?: number | null
          base_chauffeur?: string | null
          code_postal?: string | null
          contrat_url?: string | null
          created_at?: string | null
          date_debut_statut?: string | null
          date_embauche?: string | null
          date_expiration_permis: string
          date_fin_statut?: string | null
          date_naissance?: string | null
          date_obtention_permis?: string | null
          email?: string | null
          filiation?: string | null
          fonction?: string | null
          groupe_sanguin?: string | null
          id?: string
          id_conducteur?: string | null
          immatricule_cnss?: string | null
          lieu_naissance?: string | null
          matricule?: string | null
          nationalite?: string | null
          nom: string
          numero_permis: string
          photo_url?: string | null
          prenom: string
          signature_url?: string | null
          statut?: string | null
          statut_disponibilite?: string | null
          statut_matrimonial?: string | null
          telephone: string
          type_contrat?: string | null
          type_permis?: string[]
          updated_at?: string | null
          urgence_nom?: string | null
          urgence_prenom?: string | null
          urgence_telephone?: string | null
          vehicule_assigne?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          age?: number | null
          base_chauffeur?: string | null
          code_postal?: string | null
          contrat_url?: string | null
          created_at?: string | null
          date_debut_statut?: string | null
          date_embauche?: string | null
          date_expiration_permis?: string
          date_fin_statut?: string | null
          date_naissance?: string | null
          date_obtention_permis?: string | null
          email?: string | null
          filiation?: string | null
          fonction?: string | null
          groupe_sanguin?: string | null
          id?: string
          id_conducteur?: string | null
          immatricule_cnss?: string | null
          lieu_naissance?: string | null
          matricule?: string | null
          nationalite?: string | null
          nom?: string
          numero_permis?: string
          photo_url?: string | null
          prenom?: string
          signature_url?: string | null
          statut?: string | null
          statut_disponibilite?: string | null
          statut_matrimonial?: string | null
          telephone?: string
          type_contrat?: string | null
          type_permis?: string[]
          updated_at?: string | null
          urgence_nom?: string | null
          urgence_prenom?: string | null
          urgence_telephone?: string | null
          vehicule_assigne?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      chauffeurs_statut_historique: {
        Row: {
          ancien_statut: string | null
          chauffeur_id: string | null
          created_at: string | null
          created_by: string | null
          date_debut: string
          date_fin: string | null
          id: string
          motif: string | null
          nouveau_statut: string
        }
        Insert: {
          ancien_statut?: string | null
          chauffeur_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          id?: string
          motif?: string | null
          nouveau_statut: string
        }
        Update: {
          ancien_statut?: string | null
          chauffeur_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          id?: string
          motif?: string | null
          nouveau_statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "chauffeurs_statut_historique_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          societe: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          societe?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          societe?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      clients_total: {
        Row: {
          adresse: string | null
          code_client: string
          contact_nom: string | null
          created_at: string
          destination: string
          id: string
          nom_client: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          code_client: string
          contact_nom?: string | null
          created_at?: string
          destination: string
          id?: string
          nom_client: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          code_client?: string
          contact_nom?: string | null
          created_at?: string
          destination?: string
          id?: string
          nom_client?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      controles_hsse: {
        Row: {
          absence_danger_visible: boolean | null
          absence_fuite: boolean | null
          citerne_proprete_exterieure: boolean | null
          citerne_proprete_interieure: boolean | null
          commentaires: string | null
          conforme: boolean | null
          controleur_nom: string | null
          created_at: string
          danger_visible_absent: boolean | null
          date_controle: string
          equipements_securite_complets: boolean | null
          extincteur_date_validite_ok: boolean | null
          extincteur_emplacement_ok: boolean | null
          extincteur_pression_ok: boolean | null
          extincteurs_ok: boolean | null
          fuite_carburant_absente: boolean | null
          fuite_huile_absente: boolean | null
          gilets_etat_visible: boolean | null
          gilets_fluorescents_ok: boolean | null
          gilets_nombre_suffisant: boolean | null
          id: string
          points_bloquants: string[] | null
          proprete_citerne: boolean | null
          securite_generale_ok: boolean | null
          triangle_signalisation_etat_ok: boolean | null
          triangle_signalisation_ok: boolean | null
          triangle_signalisation_present: boolean | null
          trousse_secours_complete: boolean | null
          trousse_secours_date_ok: boolean | null
          trousse_secours_ok: boolean | null
          vehicule_id: string
        }
        Insert: {
          absence_danger_visible?: boolean | null
          absence_fuite?: boolean | null
          citerne_proprete_exterieure?: boolean | null
          citerne_proprete_interieure?: boolean | null
          commentaires?: string | null
          conforme?: boolean | null
          controleur_nom?: string | null
          created_at?: string
          danger_visible_absent?: boolean | null
          date_controle?: string
          equipements_securite_complets?: boolean | null
          extincteur_date_validite_ok?: boolean | null
          extincteur_emplacement_ok?: boolean | null
          extincteur_pression_ok?: boolean | null
          extincteurs_ok?: boolean | null
          fuite_carburant_absente?: boolean | null
          fuite_huile_absente?: boolean | null
          gilets_etat_visible?: boolean | null
          gilets_fluorescents_ok?: boolean | null
          gilets_nombre_suffisant?: boolean | null
          id?: string
          points_bloquants?: string[] | null
          proprete_citerne?: boolean | null
          securite_generale_ok?: boolean | null
          triangle_signalisation_etat_ok?: boolean | null
          triangle_signalisation_ok?: boolean | null
          triangle_signalisation_present?: boolean | null
          trousse_secours_complete?: boolean | null
          trousse_secours_date_ok?: boolean | null
          trousse_secours_ok?: boolean | null
          vehicule_id: string
        }
        Update: {
          absence_danger_visible?: boolean | null
          absence_fuite?: boolean | null
          citerne_proprete_exterieure?: boolean | null
          citerne_proprete_interieure?: boolean | null
          commentaires?: string | null
          conforme?: boolean | null
          controleur_nom?: string | null
          created_at?: string
          danger_visible_absent?: boolean | null
          date_controle?: string
          equipements_securite_complets?: boolean | null
          extincteur_date_validite_ok?: boolean | null
          extincteur_emplacement_ok?: boolean | null
          extincteur_pression_ok?: boolean | null
          extincteurs_ok?: boolean | null
          fuite_carburant_absente?: boolean | null
          fuite_huile_absente?: boolean | null
          gilets_etat_visible?: boolean | null
          gilets_fluorescents_ok?: boolean | null
          gilets_nombre_suffisant?: boolean | null
          id?: string
          points_bloquants?: string[] | null
          proprete_citerne?: boolean | null
          securite_generale_ok?: boolean | null
          triangle_signalisation_etat_ok?: boolean | null
          triangle_signalisation_ok?: boolean | null
          triangle_signalisation_present?: boolean | null
          trousse_secours_complete?: boolean | null
          trousse_secours_date_ok?: boolean | null
          trousse_secours_ok?: boolean | null
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_hsse_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_obc: {
        Row: {
          acceleration_excessive: number | null
          anomalies_techniques: number | null
          chauffeur_id: string
          commentaires: string | null
          conduite_continue_4h30: number | null
          conduite_continue_sans_pause: number | null
          conduite_nuit_22h_6h: number | null
          conduite_nuit_non_autorisee: number | null
          conforme: boolean | null
          controleur_nom: string | null
          created_at: string
          date_controle: string
          document_safe_to_load_url: string | null
          exces_vitesse_campagne: number | null
          exces_vitesse_urbain: number | null
          freinage_brusque: number | null
          id: string
          pause_45min_non_respectee: number | null
          pause_reglementaire_non_respectee: number | null
          repos_hebdomadaire_45h_non_respecte: number | null
          repos_journalier_11h_non_respecte: number | null
          safe_to_load_valide: boolean | null
          score_global: number | null
          temps_conduite_4h30_depasse: number | null
          temps_conduite_depasse: number | null
          vehicule_id: string
          vitesse_campagne_50_depassements: number | null
          vitesse_urbain_30_depassements: number | null
        }
        Insert: {
          acceleration_excessive?: number | null
          anomalies_techniques?: number | null
          chauffeur_id: string
          commentaires?: string | null
          conduite_continue_4h30?: number | null
          conduite_continue_sans_pause?: number | null
          conduite_nuit_22h_6h?: number | null
          conduite_nuit_non_autorisee?: number | null
          conforme?: boolean | null
          controleur_nom?: string | null
          created_at?: string
          date_controle?: string
          document_safe_to_load_url?: string | null
          exces_vitesse_campagne?: number | null
          exces_vitesse_urbain?: number | null
          freinage_brusque?: number | null
          id?: string
          pause_45min_non_respectee?: number | null
          pause_reglementaire_non_respectee?: number | null
          repos_hebdomadaire_45h_non_respecte?: number | null
          repos_journalier_11h_non_respecte?: number | null
          safe_to_load_valide?: boolean | null
          score_global?: number | null
          temps_conduite_4h30_depasse?: number | null
          temps_conduite_depasse?: number | null
          vehicule_id: string
          vitesse_campagne_50_depassements?: number | null
          vitesse_urbain_30_depassements?: number | null
        }
        Update: {
          acceleration_excessive?: number | null
          anomalies_techniques?: number | null
          chauffeur_id?: string
          commentaires?: string | null
          conduite_continue_4h30?: number | null
          conduite_continue_sans_pause?: number | null
          conduite_nuit_22h_6h?: number | null
          conduite_nuit_non_autorisee?: number | null
          conforme?: boolean | null
          controleur_nom?: string | null
          created_at?: string
          date_controle?: string
          document_safe_to_load_url?: string | null
          exces_vitesse_campagne?: number | null
          exces_vitesse_urbain?: number | null
          freinage_brusque?: number | null
          id?: string
          pause_45min_non_respectee?: number | null
          pause_reglementaire_non_respectee?: number | null
          repos_hebdomadaire_45h_non_respecte?: number | null
          repos_journalier_11h_non_respecte?: number | null
          safe_to_load_valide?: boolean | null
          score_global?: number | null
          temps_conduite_4h30_depasse?: number | null
          temps_conduite_depasse?: number | null
          vehicule_id?: string
          vitesse_campagne_50_depassements?: number | null
          vitesse_urbain_30_depassements?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "controles_obc_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_obc_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          client_email: string | null
          client_nom: string
          client_societe: string | null
          created_at: string
          date_creation: string
          date_validite: string
          description: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_nom: string
          client_societe?: string | null
          created_at?: string
          date_creation: string
          date_validite: string
          description: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_nom?: string
          client_societe?: string | null
          created_at?: string
          date_creation?: string
          date_validite?: string
          description?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostics_maintenance: {
        Row: {
          commentaires: string | null
          cout_reparation: number | null
          created_at: string
          date_diagnostic: string
          description_panne: string | null
          duree_reparation_estimee: number | null
          duree_reparation_reelle: number | null
          id: string
          pieces_changees: string[] | null
          statut: string
          technicien_nom: string | null
          type_panne: string | null
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          commentaires?: string | null
          cout_reparation?: number | null
          created_at?: string
          date_diagnostic?: string
          description_panne?: string | null
          duree_reparation_estimee?: number | null
          duree_reparation_reelle?: number | null
          id?: string
          pieces_changees?: string[] | null
          statut?: string
          technicien_nom?: string | null
          type_panne?: string | null
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          commentaires?: string | null
          cout_reparation?: number | null
          created_at?: string
          date_diagnostic?: string
          description_panne?: string | null
          duree_reparation_estimee?: number | null
          duree_reparation_reelle?: number | null
          id?: string
          pieces_changees?: string[] | null
          statut?: string
          technicien_nom?: string | null
          type_panne?: string | null
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_maintenance_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          alerte_expiration_envoyee: boolean | null
          chauffeur_id: string | null
          commentaire: string | null
          created_at: string | null
          date_delivrance: string | null
          date_expiration: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          jours_avant_expiration: number | null
          nom: string
          statut: string | null
          taille: number
          type: string
          url: string
        }
        Insert: {
          alerte_expiration_envoyee?: boolean | null
          chauffeur_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_delivrance?: string | null
          date_expiration?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          jours_avant_expiration?: number | null
          nom: string
          statut?: string | null
          taille: number
          type: string
          url: string
        }
        Update: {
          alerte_expiration_envoyee?: boolean | null
          chauffeur_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_delivrance?: string | null
          date_expiration?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          jours_avant_expiration?: number | null
          nom?: string
          statut?: string | null
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
          commentaire: string | null
          created_at: string
          date_delivrance: string | null
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
          commentaire?: string | null
          created_at?: string
          date_delivrance?: string | null
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
          commentaire?: string | null
          created_at?: string
          date_delivrance?: string | null
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
      documents_vehicules_temp: {
        Row: {
          created_at: string
          date_expiration: string | null
          has_expiration: boolean | null
          id: string
          nom: string
          type: string
          updated_at: string
          url: string | null
          vehicule_id: string
        }
        Insert: {
          created_at?: string
          date_expiration?: string | null
          has_expiration?: boolean | null
          id?: string
          nom: string
          type: string
          updated_at?: string
          url?: string | null
          vehicule_id: string
        }
        Update: {
          created_at?: string
          date_expiration?: string | null
          has_expiration?: boolean | null
          id?: string
          nom?: string
          type?: string
          updated_at?: string
          url?: string | null
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_vehicules_temp_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          created_at: string
          date_embauche: string
          date_fin_contrat: string | null
          email: string | null
          id: string
          nom: string
          photo_url: string | null
          poste: string
          prenom: string
          remarques: string | null
          service: string
          statut: string
          telephone: string | null
          type_contrat: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_embauche: string
          date_fin_contrat?: string | null
          email?: string | null
          id?: string
          nom: string
          photo_url?: string | null
          poste: string
          prenom: string
          remarques?: string | null
          service: string
          statut?: string
          telephone?: string | null
          type_contrat?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_embauche?: string
          date_fin_contrat?: string | null
          email?: string | null
          id?: string
          nom?: string
          photo_url?: string | null
          poste?: string
          prenom?: string
          remarques?: string | null
          service?: string
          statut?: string
          telephone?: string | null
          type_contrat?: string
          updated_at?: string
        }
        Relationships: []
      }
      facture_lignes: {
        Row: {
          created_at: string
          description: string
          facture_id: string | null
          id: string
          prix_unitaire: number
          quantite: number
          total: number
        }
        Insert: {
          created_at?: string
          description: string
          facture_id?: string | null
          id?: string
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Update: {
          created_at?: string
          description?: string
          facture_id?: string | null
          id?: string
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "facture_lignes_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          chauffeur: string | null
          client_contact: string | null
          client_email: string | null
          client_id: string | null
          client_nom: string
          client_societe: string | null
          created_at: string
          date_echeance: string
          date_emission: string
          id: string
          mission_numero: string | null
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          type_transport: string | null
          updated_at: string
          vehicule: string | null
        }
        Insert: {
          chauffeur?: string | null
          client_contact?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom: string
          client_societe?: string | null
          created_at?: string
          date_echeance: string
          date_emission: string
          id?: string
          mission_numero?: string | null
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          type_transport?: string | null
          updated_at?: string
          vehicule?: string | null
        }
        Update: {
          chauffeur?: string | null
          client_contact?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom?: string
          client_societe?: string | null
          created_at?: string
          date_echeance?: string
          date_emission?: string
          id?: string
          mission_numero?: string | null
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          type_transport?: string | null
          updated_at?: string
          vehicule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_employes: {
        Row: {
          certificat_url: string | null
          created_at: string
          date_debut: string
          date_expiration: string | null
          date_fin: string | null
          employe_id: string
          id: string
          nom_formation: string
          obligatoire: boolean | null
          organisme: string | null
          remarques: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          certificat_url?: string | null
          created_at?: string
          date_debut: string
          date_expiration?: string | null
          date_fin?: string | null
          employe_id: string
          id?: string
          nom_formation: string
          obligatoire?: boolean | null
          organisme?: string | null
          remarques?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          certificat_url?: string | null
          created_at?: string
          date_debut?: string
          date_expiration?: string | null
          date_fin?: string | null
          employe_id?: string
          id?: string
          nom_formation?: string
          obligatoire?: boolean | null
          organisme?: string | null
          remarques?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_employes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_rh: {
        Row: {
          ancien_poste: string | null
          ancien_service: string | null
          created_at: string
          date_evenement: string
          description: string
          employe_id: string
          id: string
          nouveau_poste: string | null
          nouveau_service: string | null
          saisi_par: string | null
          type_evenement: string
        }
        Insert: {
          ancien_poste?: string | null
          ancien_service?: string | null
          created_at?: string
          date_evenement?: string
          description: string
          employe_id: string
          id?: string
          nouveau_poste?: string | null
          nouveau_service?: string | null
          saisi_par?: string | null
          type_evenement: string
        }
        Update: {
          ancien_poste?: string | null
          ancien_service?: string | null
          created_at?: string
          date_evenement?: string
          description?: string
          employe_id?: string
          id?: string
          nouveau_poste?: string | null
          nouveau_service?: string | null
          saisi_par?: string | null
          type_evenement?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_rh_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
        }
        Relationships: []
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
      missions: {
        Row: {
          chauffeur_id: string
          created_at: string
          created_by: string | null
          id: string
          numero: string
          observations: string | null
          site_arrivee: string
          site_depart: string
          statut: string
          type_transport: string
          unite_mesure: string | null
          updated_at: string
          vehicule_id: string
          volume_poids: number | null
        }
        Insert: {
          chauffeur_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero: string
          observations?: string | null
          site_arrivee: string
          site_depart: string
          statut?: string
          type_transport: string
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id: string
          volume_poids?: number | null
        }
        Update: {
          chauffeur_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: string
          observations?: string | null
          site_arrivee?: string
          site_depart?: string
          statut?: string
          type_transport?: string
          unite_mesure?: string | null
          updated_at?: string
          vehicule_id?: string
          volume_poids?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      missions_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          created_at: string
          details: string | null
          id: string
          mission_id: string
          nouveau_statut: string | null
          utilisateur_nom: string | null
          utilisateur_role: string | null
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          created_at?: string
          details?: string | null
          id?: string
          mission_id: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          created_at?: string
          details?: string | null
          id?: string
          mission_id?: string
          nouveau_statut?: string | null
          utilisateur_nom?: string | null
          utilisateur_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_historique_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_services: {
        Row: {
          cout: number | null
          created_at: string
          date_rapport: string
          duree_intervention: unknown | null
          id: string
          observations: string | null
          service: string
          statut: string
          technicien_nom: string | null
          vehicule_id: string
        }
        Insert: {
          cout?: number | null
          created_at?: string
          date_rapport?: string
          duree_intervention?: unknown | null
          id?: string
          observations?: string | null
          service: string
          statut: string
          technicien_nom?: string | null
          vehicule_id: string
        }
        Update: {
          cout?: number | null
          created_at?: string
          date_rapport?: string
          duree_intervention?: unknown | null
          id?: string
          observations?: string | null
          service?: string
          statut?: string
          technicien_nom?: string | null
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapports_services_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          permission?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tarifs_destinations: {
        Row: {
          created_at: string
          destination: string
          distance_km: number | null
          id: string
          prix_unitaire_essence: number
          prix_unitaire_gasoil: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination: string
          distance_km?: number | null
          id?: string
          prix_unitaire_essence: number
          prix_unitaire_gasoil: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination?: string
          distance_km?: number | null
          id?: string
          prix_unitaire_essence?: number
          prix_unitaire_gasoil?: number
          updated_at?: string
        }
        Relationships: []
      }
      tarifs_hydrocarbures: {
        Row: {
          created_at: string
          destination: string
          id: string
          lieu_depart: string
          numero_ordre: number
          observations: string | null
          tarif_au_litre: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination: string
          id?: string
          lieu_depart: string
          numero_ordre: number
          observations?: string | null
          tarif_au_litre: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          lieu_depart?: string
          numero_ordre?: number
          observations?: string | null
          tarif_au_litre?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          first_name: string
          id: string
          last_login: string | null
          last_name: string
          module_permissions: string[] | null
          password_hash: string
          roles: Database["public"]["Enums"]["user_role"][]
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          module_permissions?: string[] | null
          password_hash?: string
          roles?: Database["public"]["Enums"]["user_role"][]
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          module_permissions?: string[] | null
          password_hash?: string
          roles?: Database["public"]["Enums"]["user_role"][]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      validation_etapes: {
        Row: {
          commentaire: string | null
          controle_hsse_id: string | null
          controle_obc_id: string | null
          created_at: string
          date_validation: string | null
          diagnostic_maintenance_id: string | null
          etape: string
          id: string
          statut: string
          updated_at: string
          validateur_nom: string | null
          validateur_role: string | null
          workflow_id: string
        }
        Insert: {
          commentaire?: string | null
          controle_hsse_id?: string | null
          controle_obc_id?: string | null
          created_at?: string
          date_validation?: string | null
          diagnostic_maintenance_id?: string | null
          etape: string
          id?: string
          statut?: string
          updated_at?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id: string
        }
        Update: {
          commentaire?: string | null
          controle_hsse_id?: string | null
          controle_obc_id?: string | null
          created_at?: string
          date_validation?: string | null
          diagnostic_maintenance_id?: string | null
          etape?: string
          id?: string
          statut?: string
          updated_at?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_etapes_controle_hsse_id_fkey"
            columns: ["controle_hsse_id"]
            isOneToOne: false
            referencedRelation: "controles_hsse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_etapes_controle_obc_id_fkey"
            columns: ["controle_obc_id"]
            isOneToOne: false
            referencedRelation: "controles_obc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_etapes_diagnostic_maintenance_id_fkey"
            columns: ["diagnostic_maintenance_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_maintenance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_etapes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "validation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_historique: {
        Row: {
          ancien_statut: string | null
          commentaire: string | null
          created_at: string
          etape: string
          id: string
          nouveau_statut: string
          validateur_nom: string | null
          validateur_role: string | null
          workflow_id: string
        }
        Insert: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          etape: string
          id?: string
          nouveau_statut: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id: string
        }
        Update: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          etape?: string
          id?: string
          nouveau_statut?: string
          validateur_nom?: string | null
          validateur_role?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_historique_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "validation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_workflows: {
        Row: {
          created_at: string
          id: string
          statut_global: string
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          statut_global?: string
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          statut_global?: string
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_workflows_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: true
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicules: {
        Row: {
          associe_id: string | null
          base: string | null
          capacite_max: number | null
          chauffeur_assigne: string | null
          consommation_moyenne: number | null
          created_at: string
          date_fabrication: string | null
          derniere_maintenance: string | null
          id: string
          immatriculation: string | null
          integration: string | null
          kilometrage: number | null
          marque: string | null
          modele: string | null
          numero: string
          numero_chassis: string | null
          prochaine_maintenance: string | null
          proprietaire_nom: string | null
          proprietaire_prenom: string | null
          remorque_configuration: string | null
          remorque_date_fabrication: string | null
          remorque_date_mise_circulation: string | null
          remorque_immatriculation: string | null
          remorque_marque: string | null
          remorque_modele: string | null
          remorque_numero_chassis: string | null
          remorque_volume_litres: number | null
          statut: string
          tracteur_configuration: string | null
          tracteur_date_fabrication: string | null
          tracteur_date_mise_circulation: string | null
          tracteur_immatriculation: string | null
          tracteur_marque: string | null
          tracteur_modele: string | null
          tracteur_numero_chassis: string | null
          type_transport: string
          type_vehicule: string
          unite_capacite: string | null
          updated_at: string
          validation_requise: boolean | null
          volume_tonnes: number | null
        }
        Insert: {
          associe_id?: string | null
          base?: string | null
          capacite_max?: number | null
          chauffeur_assigne?: string | null
          consommation_moyenne?: number | null
          created_at?: string
          date_fabrication?: string | null
          derniere_maintenance?: string | null
          id?: string
          immatriculation?: string | null
          integration?: string | null
          kilometrage?: number | null
          marque?: string | null
          modele?: string | null
          numero: string
          numero_chassis?: string | null
          prochaine_maintenance?: string | null
          proprietaire_nom?: string | null
          proprietaire_prenom?: string | null
          remorque_configuration?: string | null
          remorque_date_fabrication?: string | null
          remorque_date_mise_circulation?: string | null
          remorque_immatriculation?: string | null
          remorque_marque?: string | null
          remorque_modele?: string | null
          remorque_numero_chassis?: string | null
          remorque_volume_litres?: number | null
          statut?: string
          tracteur_configuration?: string | null
          tracteur_date_fabrication?: string | null
          tracteur_date_mise_circulation?: string | null
          tracteur_immatriculation?: string | null
          tracteur_marque?: string | null
          tracteur_modele?: string | null
          tracteur_numero_chassis?: string | null
          type_transport?: string
          type_vehicule?: string
          unite_capacite?: string | null
          updated_at?: string
          validation_requise?: boolean | null
          volume_tonnes?: number | null
        }
        Update: {
          associe_id?: string | null
          base?: string | null
          capacite_max?: number | null
          chauffeur_assigne?: string | null
          consommation_moyenne?: number | null
          created_at?: string
          date_fabrication?: string | null
          derniere_maintenance?: string | null
          id?: string
          immatriculation?: string | null
          integration?: string | null
          kilometrage?: number | null
          marque?: string | null
          modele?: string | null
          numero?: string
          numero_chassis?: string | null
          prochaine_maintenance?: string | null
          proprietaire_nom?: string | null
          proprietaire_prenom?: string | null
          remorque_configuration?: string | null
          remorque_date_fabrication?: string | null
          remorque_date_mise_circulation?: string | null
          remorque_immatriculation?: string | null
          remorque_marque?: string | null
          remorque_modele?: string | null
          remorque_numero_chassis?: string | null
          remorque_volume_litres?: number | null
          statut?: string
          tracteur_configuration?: string | null
          tracteur_date_fabrication?: string | null
          tracteur_date_mise_circulation?: string | null
          tracteur_immatriculation?: string | null
          tracteur_marque?: string | null
          tracteur_modele?: string | null
          tracteur_numero_chassis?: string | null
          type_transport?: string
          type_vehicule?: string
          unite_capacite?: string | null
          updated_at?: string
          validation_requise?: boolean | null
          volume_tonnes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicules_associe_id_fkey"
            columns: ["associe_id"]
            isOneToOne: false
            referencedRelation: "associes"
            referencedColumns: ["id"]
          },
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
      admin_create_user_with_auth: {
        Args: {
          p_email: string
          p_password: string
          p_first_name: string
          p_last_name: string
          p_role: string
        }
        Returns: Json
      }
      admin_user_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      calculer_statut_document: {
        Args: { date_expiration: string }
        Returns: string
      }
      check_resource_availability: {
        Args: {
          p_vehicule_id: string
          p_chauffeur_id: string
          p_date_debut: string
          p_date_fin: string
          p_mission_id?: string
        }
        Returns: {
          vehicule_disponible: boolean
          chauffeur_disponible: boolean
          message: string
        }[]
      }
      create_user_with_role: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role: string
          p_user_id?: string
        }
        Returns: Json
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_module_permission: {
        Args: { user_id: string; module_name: string }
        Returns: boolean
      }
      has_validation_role: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      module_permission:
        | "fleet"
        | "drivers"
        | "rh"
        | "cargo"
        | "missions"
        | "billing"
        | "dashboard"
      user_role:
        | "admin"
        | "transport"
        | "maintenance"
        | "rh"
        | "administratif"
        | "hsecq"
        | "obc"
        | "facturation"
        | "direction"
        | "transitaire"
        | "directeur_exploitation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      module_permission: [
        "fleet",
        "drivers",
        "rh",
        "cargo",
        "missions",
        "billing",
        "dashboard",
      ],
      user_role: [
        "admin",
        "transport",
        "maintenance",
        "rh",
        "administratif",
        "hsecq",
        "obc",
        "facturation",
        "direction",
        "transitaire",
        "directeur_exploitation",
      ],
    },
  },
} as const
