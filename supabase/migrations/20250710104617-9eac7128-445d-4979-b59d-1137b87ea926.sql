-- Adaptation de la structure pour suivre le processus SDBK

-- 1. Mettre à jour les statuts des véhicules pour refléter le processus
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS check_statut_vehicule;
ALTER TABLE public.vehicules ADD CONSTRAINT check_statut_vehicule 
CHECK (statut IN ('retour_maintenance', 'maintenance_en_cours', 'disponible_maintenance', 
                 'verification_admin', 'controle_obc', 'controle_hsse', 
                 'disponible', 'en_mission', 'bloque'));

-- 2. Créer une table pour les diagnostics de maintenance
CREATE TABLE IF NOT EXISTS public.diagnostics_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  date_diagnostic TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type_panne TEXT,
  description_panne TEXT,
  duree_reparation_estimee INTEGER, -- en heures
  duree_reparation_reelle INTEGER, -- en heures
  cout_reparation DECIMAL(10,2),
  pieces_changees TEXT[],
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'termine')),
  technicien_nom VARCHAR(100),
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Améliorer la table documents pour supporter le processus administratif
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS alerte_expiration_envoyee BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS jours_avant_expiration INTEGER;

-- 4. Créer une table pour les contrôles OBC
CREATE TABLE IF NOT EXISTS public.controles_obc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id),
  date_controle TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Les 8 invariants OBC
  acceleration_excessive INTEGER DEFAULT 0,
  freinage_brusque INTEGER DEFAULT 0,
  exces_vitesse_urbain INTEGER DEFAULT 0, -- > 30 km/h
  exces_vitesse_campagne INTEGER DEFAULT 0, -- > 50 km/h
  temps_conduite_depasse INTEGER DEFAULT 0,
  conduite_continue_sans_pause INTEGER DEFAULT 0,
  conduite_nuit_non_autorisee INTEGER DEFAULT 0,
  pause_reglementaire_non_respectee INTEGER DEFAULT 0,
  anomalies_techniques INTEGER DEFAULT 0,
  
  -- Score global et statut
  score_global INTEGER DEFAULT 0,
  conforme BOOLEAN DEFAULT TRUE,
  safe_to_load_valide BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  controleur_nom VARCHAR(100),
  commentaires TEXT,
  document_safe_to_load_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Créer une table pour les contrôles HSSE
CREATE TABLE IF NOT EXISTS public.controles_hsse (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  date_controle TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Points de contrôle HSSE
  extincteurs_ok BOOLEAN DEFAULT FALSE,
  trousse_secours_ok BOOLEAN DEFAULT FALSE,
  triangle_signalisation_ok BOOLEAN DEFAULT FALSE,
  gilets_fluorescents_ok BOOLEAN DEFAULT FALSE,
  absence_fuite BOOLEAN DEFAULT FALSE,
  proprete_citerne BOOLEAN DEFAULT FALSE,
  absence_danger_visible BOOLEAN DEFAULT FALSE,
  equipements_securite_complets BOOLEAN DEFAULT FALSE,
  
  -- Résultat global
  conforme BOOLEAN DEFAULT FALSE,
  points_bloquants TEXT[],
  
  -- Métadonnées
  controleur_nom VARCHAR(100),
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Créer une table pour les bons de livraison
CREATE TABLE IF NOT EXISTS public.bons_livraison (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id),
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id),
  
  -- Informations client et mission
  client_nom VARCHAR(200) NOT NULL,
  client_code VARCHAR(50), -- Code personnel Total
  destination VARCHAR(200) NOT NULL,
  produit VARCHAR(100) NOT NULL, -- Essence, Gasoil, etc.
  quantite_prevue DECIMAL(10,2) NOT NULL,
  unite_mesure VARCHAR(20) DEFAULT 'litres',
  
  -- Dates
  date_emission DATE NOT NULL,
  date_chargement_prevue TIMESTAMP WITH TIME ZONE,
  date_chargement_reelle TIMESTAMP WITH TIME ZONE,
  date_depart TIMESTAMP WITH TIME ZONE,
  date_arrivee_prevue TIMESTAMP WITH TIME ZONE,
  date_arrivee_reelle TIMESTAMP WITH TIME ZONE,
  date_dechargement TIMESTAMP WITH TIME ZONE,
  
  -- Retour de mission
  quantite_livree DECIMAL(10,2),
  manquant_cuve DECIMAL(10,2) DEFAULT 0,
  manquant_compteur DECIMAL(10,2) DEFAULT 0,
  manquant_total DECIMAL(10,2) DEFAULT 0,
  numero_tournee VARCHAR(50),
  
  -- Statut et facturation
  statut VARCHAR(50) NOT NULL DEFAULT 'emis' CHECK (statut IN ('emis', 'en_cours', 'livre', 'facture')),
  facture BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  saisi_par VARCHAR(100),
  transitaire_nom VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Adapter la table des étapes de validation pour le processus
ALTER TABLE public.validation_etapes 
ADD COLUMN IF NOT EXISTS diagnostic_maintenance_id UUID REFERENCES public.diagnostics_maintenance(id),
ADD COLUMN IF NOT EXISTS controle_obc_id UUID REFERENCES public.controles_obc(id),
ADD COLUMN IF NOT EXISTS controle_hsse_id UUID REFERENCES public.controles_hsse(id);

-- 8. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_diagnostics_maintenance_vehicule ON public.diagnostics_maintenance(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_controles_obc_vehicule ON public.controles_obc(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_controles_hsse_vehicule ON public.controles_hsse(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_vehicule ON public.bons_livraison(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_numero ON public.bons_livraison(numero);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON public.documents(date_expiration) WHERE date_expiration IS NOT NULL;

-- 9. Fonctions pour automatiser le processus
CREATE OR REPLACE FUNCTION public.calculer_jours_avant_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.jours_avant_expiration := EXTRACT(DAY FROM NEW.date_expiration - CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement les jours avant expiration
DROP TRIGGER IF EXISTS trigger_calculer_jours_expiration ON public.documents;
CREATE TRIGGER trigger_calculer_jours_expiration
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_jours_avant_expiration();

-- 10. Fonction pour générer les numéros de BL
CREATE OR REPLACE FUNCTION public.generate_bl_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || 
                  LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 
                        FROM public.bons_livraison 
                        WHERE numero LIKE 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement les numéros de BL
CREATE TRIGGER trigger_generate_bl_numero
  BEFORE INSERT ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_bl_numero();

-- 11. Fonction pour calculer automatiquement le manquant total
CREATE OR REPLACE FUNCTION public.calculer_manquant_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.manquant_total := COALESCE(NEW.manquant_cuve, 0) + COALESCE(NEW.manquant_compteur, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer le manquant total
CREATE TRIGGER trigger_calculer_manquant_total
  BEFORE INSERT OR UPDATE ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_manquant_total();

-- 12. RLS policies pour les nouvelles tables
ALTER TABLE public.diagnostics_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_obc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_hsse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_livraison ENABLE ROW LEVEL SECURITY;

-- Politiques pour diagnostics_maintenance
CREATE POLICY "Tous peuvent voir les diagnostics de maintenance" ON public.diagnostics_maintenance FOR SELECT USING (true);
CREATE POLICY "Maintenance peut créer des diagnostics" ON public.diagnostics_maintenance FOR INSERT WITH CHECK (true);
CREATE POLICY "Maintenance peut modifier des diagnostics" ON public.diagnostics_maintenance FOR UPDATE USING (true);

-- Politiques pour controles_obc
CREATE POLICY "Tous peuvent voir les contrôles OBC" ON public.controles_obc FOR SELECT USING (true);
CREATE POLICY "OBC peut créer des contrôles" ON public.controles_obc FOR INSERT WITH CHECK (true);
CREATE POLICY "OBC peut modifier des contrôles" ON public.controles_obc FOR UPDATE USING (true);

-- Politiques pour controles_hsse
CREATE POLICY "Tous peuvent voir les contrôles HSSE" ON public.controles_hsse FOR SELECT USING (true);
CREATE POLICY "HSSE peut créer des contrôles" ON public.controles_hsse FOR INSERT WITH CHECK (true);
CREATE POLICY "HSSE peut modifier des contrôles" ON public.controles_hsse FOR UPDATE USING (true);

-- Politiques pour bons_livraison
CREATE POLICY "Tous peuvent voir les bons de livraison" ON public.bons_livraison FOR SELECT USING (true);
CREATE POLICY "Transitaires peuvent créer des BL" ON public.bons_livraison FOR INSERT WITH CHECK (true);
CREATE POLICY "Transport peut modifier des BL" ON public.bons_livraison FOR UPDATE USING (true);