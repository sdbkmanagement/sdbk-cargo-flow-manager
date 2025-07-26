-- Phase 1: Critical RLS Policy Fixes
-- Add missing RLS policies for tables that have RLS enabled but no policies

-- 1. Fix devis table - add proper RLS policies
CREATE POLICY "Facturation et admins peuvent gérer les devis" 
ON public.devis 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'facturation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'facturation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
);

CREATE POLICY "Utilisateurs authentifiés peuvent voir les devis validés" 
ON public.devis 
FOR SELECT 
TO authenticated
USING (statut = 'valide');

-- 2. Fix facture_lignes table - add proper RLS policies
CREATE POLICY "Facturation et admins peuvent gérer les lignes de facture" 
ON public.facture_lignes 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'facturation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'facturation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
);

-- 3. Fix tarifs_destinations table policies (already has some but need to verify they're secure)
-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Tous peuvent voir les tarifs" ON public.tarifs_destinations;

-- Add secure policies
CREATE POLICY "Admins peuvent gérer les tarifs destinations" 
ON public.tarifs_destinations 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Utilisateurs authentifiés peuvent voir les tarifs" 
ON public.tarifs_destinations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

-- 4. Fix overly permissive chauffeurs policies
DROP POLICY IF EXISTS "Tous peuvent créer des chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Tous peuvent modifier des chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Tous peuvent supprimer des chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Tous peuvent voir les chauffeurs" ON public.chauffeurs;

-- Add secure chauffeurs policies
CREATE POLICY "RH et admins peuvent gérer les chauffeurs" 
ON public.chauffeurs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'rh'::user_role = ANY(roles)
      OR 'transport'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'rh'::user_role = ANY(roles)
      OR 'transport'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
);

CREATE POLICY "Utilisateurs authentifiés peuvent voir les chauffeurs" 
ON public.chauffeurs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

-- 5. Fix overly permissive documents policies
DROP POLICY IF EXISTS "Tous peuvent créer des documents" ON public.documents;
DROP POLICY IF EXISTS "Tous peuvent modifier des documents" ON public.documents;
DROP POLICY IF EXISTS "Tous peuvent supprimer des documents" ON public.documents;
DROP POLICY IF EXISTS "Tous peuvent voir les documents" ON public.documents;

-- Add secure documents policies
CREATE POLICY "Utilisateurs autorisés peuvent gérer les documents" 
ON public.documents 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'rh'::user_role = ANY(roles)
      OR 'transport'::user_role = ANY(roles)
      OR 'maintenance'::user_role = ANY(roles)
      OR 'administratif'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'rh'::user_role = ANY(roles)
      OR 'transport'::user_role = ANY(roles)
      OR 'maintenance'::user_role = ANY(roles)
      OR 'administratif'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
);

-- 6. Fix overly permissive affectations_chauffeurs policies
DROP POLICY IF EXISTS "Directeurs peuvent gérer les affectations" ON public.affectations_chauffeurs;

-- Add secure affectations policies
CREATE POLICY "Admins et transport peuvent gérer les affectations" 
ON public.affectations_chauffeurs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'transport'::user_role = ANY(roles)
      OR 'directeur_exploitation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      'admin'::user_role = ANY(roles) 
      OR 'transport'::user_role = ANY(roles)
      OR 'directeur_exploitation'::user_role = ANY(roles)
    )
    AND status = 'active'
  )
);

CREATE POLICY "Utilisateurs authentifiés peuvent voir les affectations" 
ON public.affectations_chauffeurs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

-- Phase 2: Fix Database Function Security (search_path issues)
-- Update critical functions to include proper search_path

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin'::user_role = ANY(roles) 
      OR module_name = ANY(module_permissions)
    )
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_validation_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin'::user_role = ANY(roles) 
      OR role_name::user_role = ANY(roles)
    )
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_user_exists()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE 'admin'::user_role = ANY(roles)
    AND status = 'active'
  );
END;
$function$;