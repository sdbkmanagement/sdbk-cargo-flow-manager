-- =====================================================
-- MODULE HSEQ COMPLET - Tables principales
-- =====================================================

-- 1. Table des contrôles SAFE TO LOAD
CREATE TABLE public.safe_to_load_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  controleur_id UUID REFERENCES public.users(id),
  
  -- Statut global
  statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'conforme', 'non_conforme', 'refuse')),
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  
  -- Métadonnées
  date_controle TIMESTAMPTZ NOT NULL DEFAULT now(),
  lieu_controle VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Signatures
  signature_controleur_url TEXT,
  signature_controleur_date TIMESTAMPTZ,
  signature_chauffeur_url TEXT,
  signature_chauffeur_date TIMESTAMPTZ,
  confirmation_controleur BOOLEAN DEFAULT false,
  confirmation_chauffeur BOOLEAN DEFAULT false,
  
  -- Observations
  observations TEXT,
  
  -- Sync hors-ligne
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  local_id VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des points de contrôle SAFE TO LOAD
CREATE TABLE public.safe_to_load_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.safe_to_load_controls(id) ON DELETE CASCADE,
  
  -- Catégorie et point
  categorie VARCHAR(100) NOT NULL,
  code_point VARCHAR(50) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  
  -- Résultat
  is_conforme BOOLEAN,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  commentaire TEXT,
  
  -- Photos
  photos JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des non-conformités
CREATE TABLE public.non_conformites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  safe_to_load_id UUID REFERENCES public.safe_to_load_controls(id) ON DELETE SET NULL,
  vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE SET NULL,
  chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE SET NULL,
  
  -- Classification
  numero VARCHAR(50) NOT NULL,
  type_nc VARCHAR(50) NOT NULL CHECK (type_nc IN ('critique', 'majeure', 'mineure')),
  categorie VARCHAR(100),
  description TEXT NOT NULL,
  
  -- Affectation
  service_responsable VARCHAR(100),
  responsable_id UUID REFERENCES public.users(id),
  
  -- Suivi
  statut VARCHAR(50) NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'en_cours', 'resolue', 'fermee', 'annulee')),
  date_detection TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_echeance DATE,
  date_resolution TIMESTAMPTZ,
  
  -- Plan d'action
  action_corrective TEXT,
  action_preventive TEXT,
  verification TEXT,
  
  -- Preuves
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table historique des actions sur NC
CREATE TABLE public.non_conformites_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformite_id UUID NOT NULL REFERENCES public.non_conformites(id) ON DELETE CASCADE,
  
  action VARCHAR(100) NOT NULL,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50),
  commentaire TEXT,
  
  utilisateur_id UUID REFERENCES public.users(id),
  utilisateur_nom VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table des audits HSEQ
CREATE TABLE public.hseq_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  
  user_id UUID REFERENCES public.users(id),
  user_nom VARCHAR(255),
  user_role VARCHAR(100),
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_stl_vehicule ON public.safe_to_load_controls(vehicule_id);
CREATE INDEX idx_stl_chauffeur ON public.safe_to_load_controls(chauffeur_id);
CREATE INDEX idx_stl_date ON public.safe_to_load_controls(date_controle DESC);
CREATE INDEX idx_stl_statut ON public.safe_to_load_controls(statut);
CREATE INDEX idx_stl_items_control ON public.safe_to_load_items(control_id);
CREATE INDEX idx_nc_vehicule ON public.non_conformites(vehicule_id);
CREATE INDEX idx_nc_statut ON public.non_conformites(statut);
CREATE INDEX idx_nc_type ON public.non_conformites(type_nc);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.safe_to_load_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_to_load_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_conformites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_conformites_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hseq_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies safe_to_load_controls
CREATE POLICY "HSEQ peut gérer les contrôles STL" ON public.safe_to_load_controls
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Transport peut voir les contrôles STL" ON public.safe_to_load_controls
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('transport'::user_role = ANY(roles) OR 'direction'::user_role = ANY(roles))
    AND status = 'active'
  )
);

-- Policies safe_to_load_items
CREATE POLICY "HSEQ peut gérer les items STL" ON public.safe_to_load_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Transport peut voir les items STL" ON public.safe_to_load_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('transport'::user_role = ANY(roles) OR 'direction'::user_role = ANY(roles))
    AND status = 'active'
  )
);

-- Policies non_conformites
CREATE POLICY "HSEQ peut gérer les NC" ON public.non_conformites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Utilisateurs peuvent voir leurs NC" ON public.non_conformites
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

-- Policies non_conformites_historique
CREATE POLICY "Voir historique NC" ON public.non_conformites_historique
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "HSEQ peut créer historique NC" ON public.non_conformites_historique
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);

-- Policies hseq_audit_log
CREATE POLICY "Admins peuvent voir audit HSEQ" ON public.hseq_audit_log
FOR SELECT USING (is_admin());

CREATE POLICY "Système peut insérer audit HSEQ" ON public.hseq_audit_log
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Générer numéro NC
CREATE OR REPLACE FUNCTION public.generate_nc_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'NC' || to_char(now(), 'YYYY') || '-' || 
                  LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'NC\d{4}-(\d+)') AS INTEGER)), 0) + 1 
                        FROM public.non_conformites 
                        WHERE numero LIKE 'NC' || to_char(now(), 'YYYY') || '-%')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_nc_numero
BEFORE INSERT ON public.non_conformites
FOR EACH ROW EXECUTE FUNCTION public.generate_nc_numero();

-- Mettre à jour statut STL basé sur les items
CREATE OR REPLACE FUNCTION public.update_stl_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  critical_failed INTEGER;
  any_failed INTEGER;
  all_checked INTEGER;
  total_items INTEGER;
BEGIN
  -- Compter les points critiques non conformes
  SELECT COUNT(*) INTO critical_failed
  FROM public.safe_to_load_items
  WHERE control_id = COALESCE(NEW.control_id, OLD.control_id)
  AND is_critical = true
  AND is_conforme = false;
  
  -- Compter tous les points non conformes
  SELECT COUNT(*) INTO any_failed
  FROM public.safe_to_load_items
  WHERE control_id = COALESCE(NEW.control_id, OLD.control_id)
  AND is_conforme = false;
  
  -- Compter les points vérifiés
  SELECT COUNT(*) INTO all_checked
  FROM public.safe_to_load_items
  WHERE control_id = COALESCE(NEW.control_id, OLD.control_id)
  AND is_conforme IS NOT NULL;
  
  -- Total items
  SELECT COUNT(*) INTO total_items
  FROM public.safe_to_load_items
  WHERE control_id = COALESCE(NEW.control_id, OLD.control_id);
  
  -- Mettre à jour le contrôle
  UPDATE public.safe_to_load_controls
  SET 
    statut = CASE
      WHEN critical_failed > 0 THEN 'refuse'
      WHEN all_checked < total_items THEN 'en_cours'
      WHEN any_failed > 0 THEN 'non_conforme'
      ELSE 'conforme'
    END,
    is_blocking = (critical_failed > 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.control_id, OLD.control_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stl_status
AFTER INSERT OR UPDATE ON public.safe_to_load_items
FOR EACH ROW EXECUTE FUNCTION public.update_stl_status();

-- Ajouter historique NC automatique
CREATE OR REPLACE FUNCTION public.add_nc_to_historique()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.non_conformites_historique (non_conformite_id, action, nouveau_statut, commentaire)
    VALUES (NEW.id, 'creation', NEW.statut, 'Non-conformité créée');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.statut != NEW.statut THEN
      INSERT INTO public.non_conformites_historique (non_conformite_id, action, ancien_statut, nouveau_statut, commentaire)
      VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_add_nc_historique
AFTER INSERT OR UPDATE ON public.non_conformites
FOR EACH ROW EXECUTE FUNCTION public.add_nc_to_historique();

-- Fonction pour vérifier si un véhicule a un STL valide
CREATE OR REPLACE FUNCTION public.has_valid_safe_to_load(p_vehicule_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safe_to_load_controls
    WHERE vehicule_id = p_vehicule_id
    AND statut = 'conforme'
    AND date_controle >= (now() - INTERVAL '24 hours')
    AND confirmation_controleur = true
    AND confirmation_chauffeur = true
  );
$$;

-- Fonction pour bloquer les opérations si STL non valide
CREATE OR REPLACE FUNCTION public.check_stl_for_mission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Vérifier si le véhicule a un STL valide
  IF NOT public.has_valid_safe_to_load(NEW.vehicule_id) THEN
    RAISE EXCEPTION 'Chargement interdit – SAFE TO LOAD non conforme. Le véhicule % n''a pas de contrôle SAFE TO LOAD valide dans les dernières 24 heures.', NEW.vehicule_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Storage bucket pour les signatures et photos HSEQ
INSERT INTO storage.buckets (id, name, public)
VALUES ('hseq-documents', 'hseq-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "HSEQ peut uploader documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hseq-documents' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Tous peuvent voir documents HSEQ" ON storage.objects
FOR SELECT USING (bucket_id = 'hseq-documents');

CREATE POLICY "HSEQ peut supprimer documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'hseq-documents' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin'::user_role = ANY(roles) OR 'hsecq'::user_role = ANY(roles))
    AND status = 'active'
  )
);