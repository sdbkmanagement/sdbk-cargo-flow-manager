-- =====================================================
-- TABLE: controles_inopines
-- Contrôles HSEQ inopinés déclenchables à tout moment
-- =====================================================

CREATE TABLE public.controles_inopines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  controleur_id UUID REFERENCES public.users(id),
  
  -- Type et statut
  type_controle VARCHAR(50) NOT NULL DEFAULT 'INOPINE',
  statut VARCHAR(50) NOT NULL DEFAULT 'en_cours',
  -- 'en_cours' | 'conforme' | 'conforme_avec_reserve' | 'non_conforme'
  
  -- Date et géolocalisation automatiques
  date_controle TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude NUMERIC,
  longitude NUMERIC,
  lieu_controle VARCHAR(255),
  
  -- Signatures digitales
  signature_controleur_url TEXT,
  signature_controleur_date TIMESTAMP WITH TIME ZONE,
  signature_chauffeur_url TEXT,
  signature_chauffeur_date TIMESTAMP WITH TIME ZONE,
  confirmation_controleur BOOLEAN DEFAULT false,
  confirmation_chauffeur BOOLEAN DEFAULT false,
  
  -- Observations générales
  observations TEXT,
  
  -- Synchronisation hors-ligne
  sync_status VARCHAR(50) DEFAULT 'synced',
  local_id VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_controles_inopines_vehicule ON public.controles_inopines(vehicule_id);
CREATE INDEX idx_controles_inopines_chauffeur ON public.controles_inopines(chauffeur_id);
CREATE INDEX idx_controles_inopines_date ON public.controles_inopines(date_controle DESC);
CREATE INDEX idx_controles_inopines_statut ON public.controles_inopines(statut);

-- =====================================================
-- TABLE: controles_inopines_items
-- Points de contrôle individuels
-- =====================================================

CREATE TABLE public.controles_inopines_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  control_id UUID NOT NULL REFERENCES public.controles_inopines(id) ON DELETE CASCADE,
  
  -- Identification du point
  categorie VARCHAR(100) NOT NULL,
  code_point VARCHAR(50) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  
  -- Résultat: Oui (true) / Non (false)
  is_conforme BOOLEAN,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  
  -- Commentaire obligatoire si Non
  commentaire TEXT,
  
  -- Médias (photos/vidéos)
  medias JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_inopines_items_control ON public.controles_inopines_items(control_id);

-- =====================================================
-- TRIGGER: Mise à jour automatique du statut
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_inopine_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  critical_failed INTEGER;
  non_critical_failed INTEGER;
  all_checked INTEGER;
  total_items INTEGER;
  new_statut VARCHAR(50);
BEGIN
  -- Compter les résultats
  SELECT 
    COUNT(*) FILTER (WHERE is_critical = true AND is_conforme = false),
    COUNT(*) FILTER (WHERE is_critical = false AND is_conforme = false),
    COUNT(*) FILTER (WHERE is_conforme IS NOT NULL),
    COUNT(*)
  INTO critical_failed, non_critical_failed, all_checked, total_items
  FROM public.controles_inopines_items
  WHERE control_id = COALESCE(NEW.control_id, OLD.control_id);
  
  -- Déterminer le statut
  IF critical_failed > 0 OR non_critical_failed > 2 THEN
    new_statut := 'non_conforme';
  ELSIF all_checked < total_items THEN
    new_statut := 'en_cours';
  ELSIF non_critical_failed > 0 AND non_critical_failed <= 2 THEN
    new_statut := 'conforme_avec_reserve';
  ELSE
    new_statut := 'conforme';
  END IF;
  
  -- Mettre à jour le contrôle
  UPDATE public.controles_inopines
  SET statut = new_statut, updated_at = now()
  WHERE id = COALESCE(NEW.control_id, OLD.control_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_inopine_status
AFTER INSERT OR UPDATE ON public.controles_inopines_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inopine_status();

-- =====================================================
-- TRIGGER: Actions correctives automatiques
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_inopine_nc()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  control_record RECORD;
  nc_type VARCHAR(20);
BEGIN
  -- Si point non conforme, créer une NC
  IF NEW.is_conforme = false AND (OLD IS NULL OR OLD.is_conforme IS NULL OR OLD.is_conforme = true) THEN
    -- Récupérer les infos du contrôle
    SELECT * INTO control_record FROM public.controles_inopines WHERE id = NEW.control_id;
    
    -- Déterminer le type de NC
    nc_type := CASE WHEN NEW.is_critical THEN 'critique' ELSE 'mineure' END;
    
    -- Créer la non-conformité
    INSERT INTO public.non_conformites (
      vehicule_id,
      chauffeur_id,
      type_nc,
      categorie,
      description,
      service_responsable,
      created_by
    ) VALUES (
      control_record.vehicule_id,
      control_record.chauffeur_id,
      nc_type,
      'Contrôle inopiné - ' || NEW.categorie,
      NEW.libelle || COALESCE(': ' || NEW.commentaire, ''),
      'HSEQ',
      control_record.controleur_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_inopine_nc
AFTER UPDATE ON public.controles_inopines_items
FOR EACH ROW
EXECUTE FUNCTION public.create_inopine_nc();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.controles_inopines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_inopines_items ENABLE ROW LEVEL SECURITY;

-- Policies pour controles_inopines
CREATE POLICY "HSEQ peut gérer les contrôles inopinés"
ON public.controles_inopines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles)
      OR 'hsecq'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

CREATE POLICY "Transport et Direction peuvent voir les contrôles inopinés"
ON public.controles_inopines
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      'transport'::user_role = ANY(users.roles)
      OR 'direction'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

-- Policies pour controles_inopines_items
CREATE POLICY "HSEQ peut gérer les items inopinés"
ON public.controles_inopines_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles)
      OR 'hsecq'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

CREATE POLICY "Transport et Direction peuvent voir les items inopinés"
ON public.controles_inopines_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      'transport'::user_role = ANY(users.roles)
      OR 'direction'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);