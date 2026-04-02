
-- Table des thèmes de formation
CREATE TABLE public.themes_formation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  duree_validite INTEGER NOT NULL DEFAULT 12,
  obligatoire BOOLEAN NOT NULL DEFAULT false,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des formations
CREATE TABLE public.formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes_formation(id) ON DELETE CASCADE,
  date_formation DATE NOT NULL,
  date_recyclage DATE,
  formateur_nom TEXT,
  signature_chauffeur TEXT,
  signature_formateur TEXT,
  commentaire TEXT,
  statut TEXT NOT NULL DEFAULT 'valide' CHECK (statut IN ('valide', 'a_renouveler', 'expire')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Contrainte : un seul enregistrement actif par chauffeur/thème
  CONSTRAINT unique_active_formation UNIQUE (chauffeur_id, theme_id)
);

-- Index pour performances
CREATE INDEX idx_formations_chauffeur ON public.formations(chauffeur_id);
CREATE INDEX idx_formations_theme ON public.formations(theme_id);
CREATE INDEX idx_formations_statut ON public.formations(statut);

-- Trigger calcul automatique date_recyclage et statut
CREATE OR REPLACE FUNCTION public.calculer_recyclage_formation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_duree INTEGER;
BEGIN
  -- Récupérer la durée de validité du thème
  SELECT duree_validite INTO v_duree FROM public.themes_formation WHERE id = NEW.theme_id;
  
  -- Calculer date de recyclage
  IF v_duree IS NOT NULL THEN
    NEW.date_recyclage := NEW.date_formation + (v_duree || ' months')::interval;
  END IF;
  
  -- Calculer statut dynamique
  IF NEW.date_recyclage IS NOT NULL THEN
    IF NEW.date_recyclage < CURRENT_DATE THEN
      NEW.statut := 'expire';
    ELSIF NEW.date_recyclage <= (CURRENT_DATE + INTERVAL '30 days') THEN
      NEW.statut := 'a_renouveler';
    ELSE
      NEW.statut := 'valide';
    END IF;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculer_recyclage
BEFORE INSERT OR UPDATE ON public.formations
FOR EACH ROW EXECUTE FUNCTION public.calculer_recyclage_formation();

-- Trigger updated_at sur themes_formation
CREATE TRIGGER trg_themes_formation_updated
BEFORE UPDATE ON public.themes_formation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.themes_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- Policies themes_formation - lecture pour tous les authentifiés
CREATE POLICY "Authenticated users can read themes" ON public.themes_formation
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and hsecq can manage themes" ON public.themes_formation
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles)) AND status = 'active')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles)) AND status = 'active')
);

-- Policies formations - lecture pour tous les authentifiés
CREATE POLICY "Authenticated users can read formations" ON public.formations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and hsecq can manage formations" ON public.formations
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles)) AND status = 'active')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles)) AND status = 'active')
);

-- Insérer des thèmes par défaut
INSERT INTO public.themes_formation (nom, description, duree_validite, obligatoire) VALUES
('Sécurité routière', 'Formation sur la sécurité routière et conduite défensive', 12, true),
('Matières dangereuses (ADR)', 'Transport de matières dangereuses', 24, true),
('Premiers secours', 'Formation aux gestes de premiers secours', 12, true),
('HSE', 'Hygiène, Sécurité et Environnement', 12, true),
('Conduite défensive', 'Techniques de conduite défensive avancée', 24, false),
('CACES', 'Certificat d''Aptitude à la Conduite En Sécurité', 60, false),
('Qualité environnement', 'Sensibilisation à la qualité et l''environnement', 12, false),
('Lutte incendie', 'Formation à la lutte contre l''incendie', 12, true);
