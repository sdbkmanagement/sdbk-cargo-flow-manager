
-- Phase 1: Enable RLS and Create Proper Policies for Missing Tables

-- Enable RLS on tables that are missing it
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargements_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations_employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_rh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for absences table
CREATE POLICY "RH peut gérer les absences" ON public.absences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'rh' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Employés peuvent voir leurs absences" ON public.absences
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employes 
    WHERE id = employe_id 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Create RLS policies for chargements table
CREATE POLICY "Transport peut gérer les chargements" ON public.chargements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'transport' = ANY(roles) OR 'obc' = ANY(roles))
    AND status = 'active'
  )
);

-- Create RLS policies for chargements_historique table
CREATE POLICY "Tous peuvent voir l'historique des chargements" ON public.chargements_historique
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

-- Create RLS policies for employes table
CREATE POLICY "RH peut gérer les employés" ON public.employes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'rh' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Employés peuvent voir leur profil" ON public.employes
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Create RLS policies for formations_employes table
CREATE POLICY "RH peut gérer les formations" ON public.formations_employes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'rh' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Employés peuvent voir leurs formations" ON public.formations_employes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employes 
    WHERE id = employe_id 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Create RLS policies for historique_rh table
CREATE POLICY "RH peut voir l'historique RH" ON public.historique_rh
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'rh' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "RH peut créer l'historique RH" ON public.historique_rh
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'rh' = ANY(roles))
    AND status = 'active'
  )
);

-- Create RLS policies for users table (most critical)
CREATE POLICY "Admins peuvent gérer les utilisateurs" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  )
);

CREATE POLICY "Utilisateurs peuvent voir leur profil" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil" ON public.users
FOR UPDATE USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Phase 2: Fix Database Functions Security - Add search_path to critical functions

-- Update existing functions to add proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR module_name = ANY(module_permissions)
    )
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_validation_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR role_name::user_role = ANY(roles)
    )
    AND status = 'active'
  );
$function$;

-- Phase 3: Clean up overly permissive RLS policies by dropping and recreating them

-- Remove overly permissive policies and replace with proper ones
DROP POLICY IF EXISTS "Allow all operations on validation_workflows" ON public.validation_workflows;
DROP POLICY IF EXISTS "Allow all operations on validation_etapes" ON public.validation_etapes;
DROP POLICY IF EXISTS "Allow all operations on validation_historique" ON public.validation_historique;
DROP POLICY IF EXISTS "Allow all operations on missions" ON public.missions;
DROP POLICY IF EXISTS "Allow all operations on missions_historique" ON public.missions_historique;
DROP POLICY IF EXISTS "Allow all operations on factures" ON public.factures;
DROP POLICY IF EXISTS "Allow all operations on facture_lignes" ON public.facture_lignes;
DROP POLICY IF EXISTS "Allow all operations on devis" ON public.devis;
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations on maintenance_vehicules" ON public.maintenance_vehicules;

-- Create proper restrictive policies for validation workflows
CREATE POLICY "Validateurs peuvent voir les workflows" ON public.validation_workflows
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'maintenance' = ANY(roles) OR 'hsecq' = ANY(roles) OR 'obc' = ANY(roles) OR 'administratif' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Validateurs peuvent mettre à jour les workflows" ON public.validation_workflows
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'maintenance' = ANY(roles) OR 'hsecq' = ANY(roles) OR 'obc' = ANY(roles) OR 'administratif' = ANY(roles))
    AND status = 'active'
  )
);

-- Create proper policies for validation etapes
CREATE POLICY "Validateurs peuvent voir les étapes" ON public.validation_etapes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'maintenance' = ANY(roles) OR 'hsecq' = ANY(roles) OR 'obc' = ANY(roles) OR 'administratif' = ANY(roles))
    AND status = 'active'
  )
);

CREATE POLICY "Validateurs peuvent mettre à jour leurs étapes" ON public.validation_etapes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'maintenance' = ANY(roles) OR 'hsecq' = ANY(roles) OR 'obc' = ANY(roles) OR 'administratif' = ANY(roles))
    AND status = 'active'
  )
);

-- Create proper policies for missions
CREATE POLICY "Transport peut gérer les missions" ON public.missions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'transport' = ANY(roles) OR 'obc' = ANY(roles))
    AND status = 'active'
  )
);

-- Create proper policies for factures
CREATE POLICY "Facturation peut gérer les factures" ON public.factures
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'facturation' = ANY(roles))
    AND status = 'active'
  )
);

-- Create proper policies for clients
CREATE POLICY "Utilisateurs autorisés peuvent gérer les clients" ON public.clients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND ('admin' = ANY(roles) OR 'transport' = ANY(roles) OR 'facturation' = ANY(roles))
    AND status = 'active'
  )
);

-- Phase 4: Add audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type VARCHAR(50) NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent voir les logs de sécurité" ON public.security_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  )
);
