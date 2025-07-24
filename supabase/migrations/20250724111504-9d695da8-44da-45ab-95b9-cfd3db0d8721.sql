
-- Phase 1: Critical Database Security Fixes

-- 1. Fix RLS on tables that may have failed in previous migration
ALTER TABLE public.alertes_documents_vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_documents_chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_rh ENABLE ROW LEVEL SECURITY;

-- Create proper policies for these tables
CREATE POLICY "Authenticated users can view document alerts" ON public.alertes_documents_vehicules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view chauffeur document alerts" ON public.alertes_documents_chauffeurs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RH and admin can view RH alerts" ON public.alertes_rh
  FOR SELECT TO authenticated USING (
    has_validation_role(auth.uid(), 'rh') OR is_admin()
  );

-- 2. Fix all database functions to include proper search_path
CREATE OR REPLACE FUNCTION public.generate_chargement_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.chargements WHERE numero LIKE 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_vehicle_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'V' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'V(\d+)') AS INTEGER)), 0) + 1 
      FROM public.vehicules 
      WHERE numero ~ '^V\d+$'
    )::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_bl_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || 
                  LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 
                        FROM public.bons_livraison 
                        WHERE numero LIKE 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_mission_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.missions WHERE numero LIKE 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculer_statut_document(date_expiration date)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si pas de date d'expiration, le document est considéré comme valide (permanent)
  IF date_expiration IS NULL THEN
    RETURN 'valide';
  END IF;
  
  -- Si la date d'expiration est passée
  IF date_expiration < CURRENT_DATE THEN
    RETURN 'expire';
  -- Si la date d'expiration est dans moins de 30 jours
  ELSIF date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN
    RETURN 'a_renouveler';
  -- Sinon le document est valide
  ELSE
    RETURN 'valide';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_exists()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE 'admin' = ANY(roles)
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_resource_availability(p_vehicule_id uuid, p_chauffeur_id uuid, p_date_debut timestamp with time zone, p_date_fin timestamp with time zone, p_mission_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(vehicule_disponible boolean, chauffeur_disponible boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 3. Fix remaining trigger functions
CREATE OR REPLACE FUNCTION public.add_chargement_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.chargements_historique (chargement_id, action, nouveau_statut, details)
    VALUES (NEW.id, 'creation', NEW.statut, 'Chargement créé');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ajouter à l'historique si le statut change
    IF OLD.statut != NEW.statut THEN
      INSERT INTO public.chargements_historique (chargement_id, action, ancien_statut, nouveau_statut, details)
      VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, 
                jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 4. Add comprehensive input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF email IS NULL OR length(email) = 0 THEN
    RETURN false;
  END IF;
  
  -- Basic email format validation
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF phone IS NULL OR length(phone) = 0 THEN
    RETURN false;
  END IF;
  
  -- Basic phone format validation (international format)
  RETURN phone ~ '^\+?[1-9]\d{1,14}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially dangerous characters
  RETURN regexp_replace(
    regexp_replace(input_text, '[<>]', '', 'g'),
    '["\x00-\x1F\x7F]', '', 'g'
  );
END;
$$;

-- 5. Add rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
  WHERE email = user_identifier
    AND success = false
    AND created_at >= (now() - (window_minutes || ' minutes')::interval);
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- 6. Create audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all changes to users table
  IF TG_TABLE_NAME = 'users' THEN
    INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
    VALUES (
      auth.uid(),
      TG_OP,
      'users',
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'table', TG_TABLE_NAME,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for users table
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 7. Add session management functions
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up old login attempts (older than 30 days)
  DELETE FROM public.login_attempts
  WHERE created_at < (now() - interval '30 days');
  
  -- Clean up old audit logs (older than 1 year)
  DELETE FROM public.admin_audit_log
  WHERE created_at < (now() - interval '1 year');
END;
$$;
