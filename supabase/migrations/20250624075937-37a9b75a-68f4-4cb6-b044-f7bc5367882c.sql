
-- Créer une table pour les missions
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  type_transport VARCHAR(20) NOT NULL CHECK (type_transport IN ('hydrocarbures', 'bauxite')),
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id),
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id),
  site_depart VARCHAR(255) NOT NULL,
  site_arrivee VARCHAR(255) NOT NULL,
  date_heure_depart TIMESTAMP WITH TIME ZONE NOT NULL,
  date_heure_arrivee_prevue TIMESTAMP WITH TIME ZONE NOT NULL,
  volume_poids NUMERIC(10,2),
  unite_mesure VARCHAR(10) DEFAULT 'tonnes',
  observations TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour l'historique des missions
CREATE TABLE public.missions_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  ancien_statut VARCHAR(20),
  nouveau_statut VARCHAR(20),
  details TEXT,
  utilisateur_nom VARCHAR(255),
  utilisateur_role VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_missions_vehicule_id ON public.missions(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_missions_chauffeur_id ON public.missions(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_missions_type_transport ON public.missions(type_transport);
CREATE INDEX IF NOT EXISTS idx_missions_statut ON public.missions(statut);
CREATE INDEX IF NOT EXISTS idx_missions_date_depart ON public.missions(date_heure_depart);
CREATE INDEX IF NOT EXISTS idx_missions_historique_mission_id ON public.missions_historique(mission_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_missions_updated_at 
  BEFORE UPDATE ON public.missions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function pour générer automatiquement un numéro de mission
CREATE OR REPLACE FUNCTION public.generate_mission_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.missions WHERE numero LIKE 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de mission
CREATE TRIGGER generate_numero_before_insert
  BEFORE INSERT ON public.missions
  FOR EACH ROW EXECUTE FUNCTION generate_mission_numero();

-- Function pour ajouter automatiquement à l'historique lors des changements
CREATE OR REPLACE FUNCTION public.add_mission_to_historique()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.missions_historique (mission_id, action, nouveau_statut, details)
    VALUES (NEW.id, 'creation', NEW.statut, 'Mission créée');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ajouter à l'historique si le statut change
    IF OLD.statut != NEW.statut THEN
      INSERT INTO public.missions_historique (mission_id, action, ancien_statut, nouveau_statut, details)
      VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'historique automatique
CREATE TRIGGER mission_historique_trigger
  AFTER INSERT OR UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION add_mission_to_historique();

-- Function pour vérifier la disponibilité des ressources
CREATE OR REPLACE FUNCTION public.check_resource_availability(
  p_vehicule_id UUID,
  p_chauffeur_id UUID,
  p_date_debut TIMESTAMP WITH TIME ZONE,
  p_date_fin TIMESTAMP WITH TIME ZONE,
  p_mission_id UUID DEFAULT NULL
)
RETURNS TABLE (
  vehicule_disponible BOOLEAN,
  chauffeur_disponible BOOLEAN,
  message TEXT
) AS $$
DECLARE
  vehicule_statut VARCHAR(50);
  chauffeur_statut VARCHAR(50);
  conflits_count INTEGER;
BEGIN
  -- Vérifier le statut du véhicule
  SELECT statut INTO vehicule_statut FROM public.vehicules WHERE id = p_vehicule_id;
  
  -- Vérifier le statut du chauffeur
  SELECT statut INTO chauffeur_statut FROM public.chauffeurs WHERE id = p_chauffeur_id;
  
  -- Vérifier les conflits de planning
  SELECT COUNT(*) INTO conflits_count
  FROM public.missions 
  WHERE (vehicule_id = p_vehicule_id OR chauffeur_id = p_chauffeur_id)
    AND statut IN ('en_attente', 'en_cours')
    AND (p_mission_id IS NULL OR id != p_mission_id)
    AND (
      (date_heure_depart <= p_date_debut AND date_heure_arrivee_prevue > p_date_debut) OR
      (date_heure_depart < p_date_fin AND date_heure_arrivee_prevue >= p_date_fin) OR
      (date_heure_depart >= p_date_debut AND date_heure_arrivee_prevue <= p_date_fin)
    );
  
  RETURN QUERY SELECT 
    (vehicule_statut = 'disponible') AS vehicule_disponible,
    (chauffeur_statut = 'actif' AND conflits_count = 0) AS chauffeur_disponible,
    CASE 
      WHEN vehicule_statut != 'disponible' THEN 'Véhicule non disponible: ' || vehicule_statut
      WHEN chauffeur_statut != 'actif' THEN 'Chauffeur non actif: ' || chauffeur_statut
      WHEN conflits_count > 0 THEN 'Conflit de planning détecté'
      ELSE 'Ressources disponibles'
    END AS message;
END;
$$ LANGUAGE plpgsql;

-- Policies RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on missions" 
  ON public.missions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on missions_historique" 
  ON public.missions_historique FOR ALL USING (true) WITH CHECK (true);
