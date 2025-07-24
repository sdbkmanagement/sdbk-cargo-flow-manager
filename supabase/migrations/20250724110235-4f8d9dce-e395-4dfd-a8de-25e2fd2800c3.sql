
-- Phase 1: Critical Database Security Fixes

-- 1. Enable RLS on tables that don't have it
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargements_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations_employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_rh ENABLE ROW LEVEL SECURITY;

-- 2. Create secure RLS policies for users table (most critical)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND roles = OLD.roles); -- Prevent role self-modification

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (is_admin());

-- 3. Create RLS policies for chargements
CREATE POLICY "All authenticated users can view chargements" ON public.chargements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Transport and admin can create chargements" ON public.chargements
  FOR INSERT TO authenticated WITH CHECK (
    has_validation_role(auth.uid(), 'transport') OR 
    has_validation_role(auth.uid(), 'admin')
  );

CREATE POLICY "Transport and admin can update chargements" ON public.chargements
  FOR UPDATE TO authenticated USING (
    has_validation_role(auth.uid(), 'transport') OR 
    has_validation_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admin can delete chargements" ON public.chargements
  FOR DELETE TO authenticated USING (is_admin());

-- 4. Create RLS policies for chargements_historique (read-only for most)
CREATE POLICY "All authenticated users can view chargements history" ON public.chargements_historique
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert chargements history" ON public.chargements_historique
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Create RLS policies for employes
CREATE POLICY "All authenticated users can view employes" ON public.employes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RH and admin can manage employes" ON public.employes
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'rh') OR 
    is_admin()
  );

-- 6. Create RLS policies for absences
CREATE POLICY "Users can view absences" ON public.absences
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RH and admin can manage absences" ON public.absences
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'rh') OR 
    is_admin()
  );

-- 7. Create RLS policies for formations_employes
CREATE POLICY "Users can view formations" ON public.formations_employes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RH and admin can manage formations" ON public.formations_employes
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'rh') OR 
    is_admin()
  );

-- 8. Create RLS policies for historique_rh (mostly read-only)
CREATE POLICY "Users can view RH history" ON public.historique_rh
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RH and admin can manage RH history" ON public.historique_rh
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'rh') OR 
    is_admin()
  );

-- 9. Fix overly permissive policies by dropping and recreating them
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on validation_workflows" ON public.validation_workflows;
DROP POLICY IF EXISTS "Allow all operations on validation_etapes" ON public.validation_etapes;
DROP POLICY IF EXISTS "Allow all operations on validation_historique" ON public.validation_historique;
DROP POLICY IF EXISTS "Allow all operations on missions" ON public.missions;
DROP POLICY IF EXISTS "Allow all operations on missions_historique" ON public.missions_historique;
DROP POLICY IF EXISTS "Allow all operations on maintenance_vehicules" ON public.maintenance_vehicules;
DROP POLICY IF EXISTS "Allow all operations on devis" ON public.devis;
DROP POLICY IF EXISTS "Allow all operations on factures" ON public.factures;
DROP POLICY IF EXISTS "Allow all operations on facture_lignes" ON public.facture_lignes;
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;

-- Create proper restrictive policies
-- Validation workflows - only validation roles can manage
CREATE POLICY "Users can view validation workflows" ON public.validation_workflows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Validation roles can manage workflows" ON public.validation_workflows
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'maintenance') OR
    has_validation_role(auth.uid(), 'administratif') OR
    has_validation_role(auth.uid(), 'hsecq') OR
    has_validation_role(auth.uid(), 'obc') OR
    is_admin()
  );

-- Validation etapes - only specific roles can validate their steps
CREATE POLICY "Users can view validation etapes" ON public.validation_etapes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Validation roles can update their etapes" ON public.validation_etapes
  FOR UPDATE TO authenticated USING (
    (etape = 'maintenance' AND has_validation_role(auth.uid(), 'maintenance')) OR
    (etape = 'administratif' AND has_validation_role(auth.uid(), 'administratif')) OR
    (etape = 'hsecq' AND has_validation_role(auth.uid(), 'hsecq')) OR
    (etape = 'obc' AND has_validation_role(auth.uid(), 'obc')) OR
    is_admin()
  );

-- Missions - transport and admin can manage
CREATE POLICY "Users can view missions" ON public.missions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Transport and admin can manage missions" ON public.missions
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'transport') OR
    has_validation_role(auth.uid(), 'obc') OR
    is_admin()
  );

-- Factures - facturation and admin can manage
CREATE POLICY "Users can view factures" ON public.factures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Facturation and admin can manage factures" ON public.factures
  FOR ALL TO authenticated USING (
    has_validation_role(auth.uid(), 'facturation') OR
    is_admin()
  );

-- 10. Secure the database functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_validation_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR role_name IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR role_name::user_role = ANY(roles)
    )
    AND status = 'active'
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR module_name IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR module_name = ANY(module_permissions)
    )
    AND status = 'active'
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 11. Add login attempt logging table for rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  ip_address inet,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "System can log login attempts" ON public.login_attempts
  FOR INSERT TO authenticated WITH CHECK (true);

-- 12. Create a trigger for login attempt logging
CREATE OR REPLACE FUNCTION public.log_login_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, error_message)
  VALUES (NEW.email, NEW.success, NEW.error_message);
  RETURN NEW;
END;
$$;
