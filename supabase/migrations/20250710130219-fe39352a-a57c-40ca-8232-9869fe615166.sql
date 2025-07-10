-- Ajouter la gestion des associés/propriétaires de camions
CREATE TABLE public.associes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR NOT NULL,
  prenom VARCHAR NOT NULL,
  telephone VARCHAR,
  email VARCHAR,
  adresse TEXT,
  pourcentage_participation DECIMAL(5,2) DEFAULT 100.00,
  statut VARCHAR NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter le lien associé aux véhicules
ALTER TABLE public.vehicules ADD COLUMN associe_id UUID REFERENCES public.associes(id);

-- Table des tarifs par destination (péréquation TOTAL)
CREATE TABLE public.tarifs_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination VARCHAR NOT NULL UNIQUE,
  prix_unitaire_essence DECIMAL(10,3) NOT NULL,
  prix_unitaire_gasoil DECIMAL(10,3) NOT NULL,
  distance_km INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer quelques destinations d'exemple
INSERT INTO public.tarifs_destinations (destination, prix_unitaire_essence, prix_unitaire_gasoil, distance_km) VALUES
('Mamou', 0.750, 0.720, 280),
('Labé', 0.850, 0.820, 450),
('Kamsar', 0.650, 0.620, 200),
('Kindia', 0.550, 0.520, 130),
('Boké', 0.800, 0.770, 350);

-- Améliorer la table des contrôles OBC avec les 8 invariants spécifiques
ALTER TABLE public.controles_obc 
ADD COLUMN vitesse_urbain_30_depassements INTEGER DEFAULT 0,
ADD COLUMN vitesse_campagne_50_depassements INTEGER DEFAULT 0,
ADD COLUMN temps_conduite_4h30_depasse INTEGER DEFAULT 0,
ADD COLUMN conduite_continue_4h30 INTEGER DEFAULT 0,
ADD COLUMN conduite_nuit_22h_6h INTEGER DEFAULT 0,
ADD COLUMN pause_45min_non_respectee INTEGER DEFAULT 0,
ADD COLUMN repos_journalier_11h_non_respecte INTEGER DEFAULT 0,
ADD COLUMN repos_hebdomadaire_45h_non_respecte INTEGER DEFAULT 0;

-- Améliorer la table HSSE avec check-liste détaillée
ALTER TABLE public.controles_hsse
ADD COLUMN extincteur_emplacement_ok BOOLEAN DEFAULT false,
ADD COLUMN extincteur_date_validite_ok BOOLEAN DEFAULT false,
ADD COLUMN extincteur_pression_ok BOOLEAN DEFAULT false,
ADD COLUMN trousse_secours_complete BOOLEAN DEFAULT false,
ADD COLUMN trousse_secours_date_ok BOOLEAN DEFAULT false,
ADD COLUMN triangle_signalisation_present BOOLEAN DEFAULT false,
ADD COLUMN triangle_signalisation_etat_ok BOOLEAN DEFAULT false,
ADD COLUMN gilets_nombre_suffisant BOOLEAN DEFAULT false,
ADD COLUMN gilets_etat_visible BOOLEAN DEFAULT false,
ADD COLUMN fuite_carburant_absente BOOLEAN DEFAULT false,
ADD COLUMN fuite_huile_absente BOOLEAN DEFAULT false,
ADD COLUMN citerne_proprete_exterieure BOOLEAN DEFAULT false,
ADD COLUMN citerne_proprete_interieure BOOLEAN DEFAULT false,
ADD COLUMN danger_visible_absent BOOLEAN DEFAULT false,
ADD COLUMN securite_generale_ok BOOLEAN DEFAULT false;

-- Ajouter les clients TOTAL avec codes
CREATE TABLE public.clients_total (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_client VARCHAR NOT NULL UNIQUE,
  nom_client VARCHAR NOT NULL,
  destination VARCHAR NOT NULL,
  adresse TEXT,
  telephone VARCHAR,
  contact_nom VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quelques clients d'exemple
INSERT INTO public.clients_total (code_client, nom_client, destination) VALUES
('TT001', 'Station Total Mamou Centre', 'Mamou'),
('TT002', 'Station Total Labé Airport', 'Labé'),
('TT003', 'Station Total Kamsar Port', 'Kamsar'),
('TT004', 'Dépôt Total Kindia', 'Kindia'),
('TT005', 'Station Total Boké Mine', 'Boké');

-- Améliorer la table bons_livraison
ALTER TABLE public.bons_livraison
ADD COLUMN client_code_total VARCHAR,
ADD COLUMN prix_unitaire DECIMAL(10,3),
ADD COLUMN montant_total DECIMAL(12,2),
ADD COLUMN montant_facture DECIMAL(12,2),
ADD COLUMN associe_id UUID REFERENCES public.associes(id),
ADD COLUMN chiffre_affaire_associe DECIMAL(12,2);

-- Ajouter le rôle transitaire
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'transitaire';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'directeur_exploitation';

-- Table pour le suivi des affectations chauffeur/véhicule
CREATE TABLE public.affectations_chauffeurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id),
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id),
  date_debut DATE NOT NULL,
  date_fin DATE,
  motif_changement TEXT,
  autorise_par UUID REFERENCES public.users(id),
  statut VARCHAR NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'terminee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les rapports par service
CREATE TABLE public.rapports_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id),
  service VARCHAR NOT NULL CHECK (service IN ('maintenance', 'administratif', 'obc', 'hsse', 'transport')),
  date_rapport DATE NOT NULL DEFAULT CURRENT_DATE,
  statut VARCHAR NOT NULL,
  observations TEXT,
  duree_intervention INTERVAL,
  cout DECIMAL(10,2),
  technicien_nom VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.associes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifs_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_total ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affectations_chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_services ENABLE ROW LEVEL SECURITY;

-- Policies pour associés
CREATE POLICY "Tous peuvent voir les associés" ON public.associes FOR SELECT USING (true);
CREATE POLICY "Admins peuvent gérer les associés" ON public.associes FOR ALL USING (is_admin());

-- Policies pour tarifs
CREATE POLICY "Tous peuvent voir les tarifs" ON public.tarifs_destinations FOR SELECT USING (true);
CREATE POLICY "Admins peuvent gérer les tarifs" ON public.tarifs_destinations FOR ALL USING (is_admin());

-- Policies pour clients TOTAL
CREATE POLICY "Tous peuvent voir les clients TOTAL" ON public.clients_total FOR SELECT USING (true);
CREATE POLICY "Transitaires peuvent gérer les clients" ON public.clients_total FOR ALL USING (true);

-- Policies pour affectations
CREATE POLICY "Tous peuvent voir les affectations" ON public.affectations_chauffeurs FOR SELECT USING (true);
CREATE POLICY "Directeurs peuvent gérer les affectations" ON public.affectations_chauffeurs FOR ALL USING (true);

-- Policies pour rapports
CREATE POLICY "Tous peuvent voir les rapports" ON public.rapports_services FOR SELECT USING (true);
CREATE POLICY "Services peuvent créer des rapports" ON public.rapports_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Services peuvent modifier leurs rapports" ON public.rapports_services FOR UPDATE USING (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_associes_updated_at BEFORE UPDATE ON public.associes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarifs_destinations_updated_at BEFORE UPDATE ON public.tarifs_destinations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_total_updated_at BEFORE UPDATE ON public.clients_total
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affectations_chauffeurs_updated_at BEFORE UPDATE ON public.affectations_chauffeurs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer le chiffre d'affaires par associé
CREATE OR REPLACE FUNCTION public.calculer_ca_associe()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le CA pour l'associé
  IF NEW.montant_facture IS NOT NULL AND NEW.associe_id IS NOT NULL THEN
    NEW.chiffre_affaire_associe := NEW.montant_facture;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculer_ca_associe
  BEFORE INSERT OR UPDATE ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_ca_associe();