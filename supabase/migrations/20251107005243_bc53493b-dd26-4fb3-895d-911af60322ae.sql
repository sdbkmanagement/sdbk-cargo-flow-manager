-- ============================================================================
-- CRITICAL SECURITY FIX: Enable RLS and Create Secure Role Architecture (Fixed)
-- ============================================================================

-- Step 1: Create secure user_roles table architecture
-- ============================================================================

-- Create user_roles table (roles stored separately from users table)
-- Reference public.users instead of auth.users to handle sync issues
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Step 2: Create SECURITY DEFINER function to check roles (avoids RLS recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Helper function to check if current user has a role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_role(auth.uid(), _role);
$$;

-- Step 3: Migrate existing role data from users table to user_roles table
-- ============================================================================

-- Insert roles from users table into user_roles table
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  u.id,
  UNNEST(u.roles) as role,
  u.created_at
FROM public.users u
WHERE u.roles IS NOT NULL AND array_length(u.roles, 1) > 0
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Enable RLS on publicly exposed tables
-- ============================================================================

-- Enable RLS on bons_livraison (currently public)
ALTER TABLE public.bons_livraison ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tarifs_hydrocarbures (currently public)
ALTER TABLE public.tarifs_hydrocarbures ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for user_roles table
-- ============================================================================

-- Admins can manage all roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.current_user_has_role('admin'::user_role))
WITH CHECK (public.current_user_has_role('admin'::user_role));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Step 6: Fix overly permissive RLS policies on existing tables
-- ============================================================================

-- Drop and recreate overly broad policies on chauffeurs
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent voir les chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "RH et admins peuvent gérer les chauffeurs" ON public.chauffeurs;

CREATE POLICY "RH, transport et admins peuvent voir les chauffeurs"
ON public.chauffeurs
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('rh'::user_role) OR
  public.current_user_has_role('transport'::user_role)
);

CREATE POLICY "RH, transport et admins peuvent gérer les chauffeurs"
ON public.chauffeurs
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('rh'::user_role) OR
  public.current_user_has_role('transport'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('rh'::user_role) OR
  public.current_user_has_role('transport'::user_role)
);

-- Fix documents_vehicules policies (currently USING true - extremely dangerous)
DROP POLICY IF EXISTS "Allow all operations on documents_vehicules" ON public.documents_vehicules;
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent voir les documents des véhicules" ON public.documents_vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent créer des documents de véhicu" ON public.documents_vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent modifier les documents de véhi" ON public.documents_vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent supprimer les documents de véh" ON public.documents_vehicules;

CREATE POLICY "Roles autorisés peuvent voir les documents véhicules"
ON public.documents_vehicules
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('maintenance'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('administratif'::user_role)
);

CREATE POLICY "Roles autorisés peuvent gérer les documents véhicules"
ON public.documents_vehicules
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('maintenance'::user_role) OR
  public.current_user_has_role('administratif'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('maintenance'::user_role) OR
  public.current_user_has_role('administratif'::user_role)
);

-- Step 7: Create restrictive RLS policies for bons_livraison
-- ============================================================================

CREATE POLICY "Roles autorisés peuvent voir les bons de livraison"
ON public.bons_livraison
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('obc'::user_role) OR
  public.current_user_has_role('facturation'::user_role) OR
  public.current_user_has_role('transitaire'::user_role)
);

CREATE POLICY "Roles autorisés peuvent gérer les bons de livraison"
ON public.bons_livraison
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('obc'::user_role) OR
  public.current_user_has_role('transitaire'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('obc'::user_role) OR
  public.current_user_has_role('transitaire'::user_role)
);

-- Step 8: Create restrictive RLS policies for vehicules
-- ============================================================================

DROP POLICY IF EXISTS "Tous les utilisateurs peuvent voir les véhicules" ON public.vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent créer des véhicules" ON public.vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent modifier les véhicules" ON public.vehicules;
DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent supprimer les véhicules" ON public.vehicules;

CREATE POLICY "Roles autorisés peuvent voir les véhicules"
ON public.vehicules
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('maintenance'::user_role) OR
  public.current_user_has_role('obc'::user_role) OR
  public.current_user_has_role('administratif'::user_role)
);

CREATE POLICY "Roles autorisés peuvent gérer les véhicules"
ON public.vehicules
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('maintenance'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('maintenance'::user_role)
);

-- Step 9: Create restrictive RLS policies for tarifs_hydrocarbures
-- ============================================================================

CREATE POLICY "Roles autorisés peuvent voir les tarifs"
ON public.tarifs_hydrocarbures
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('facturation'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('direction'::user_role)
);

CREATE POLICY "Admins et facturation peuvent gérer les tarifs"
ON public.tarifs_hydrocarbures
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('facturation'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('facturation'::user_role)
);

-- Step 10: Fix affectations_chauffeurs policies
-- ============================================================================

DROP POLICY IF EXISTS "Tous peuvent voir les affectations" ON public.affectations_chauffeurs;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent voir les affectations" ON public.affectations_chauffeurs;
DROP POLICY IF EXISTS "Admins et transport peuvent gérer les affectations" ON public.affectations_chauffeurs;

CREATE POLICY "Roles autorisés peuvent voir les affectations"
ON public.affectations_chauffeurs
FOR SELECT
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('directeur_exploitation'::user_role) OR
  public.current_user_has_role('obc'::user_role)
);

CREATE POLICY "Roles autorisés peuvent gérer les affectations"
ON public.affectations_chauffeurs
FOR ALL
USING (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('directeur_exploitation'::user_role)
)
WITH CHECK (
  public.current_user_has_role('admin'::user_role) OR
  public.current_user_has_role('transport'::user_role) OR
  public.current_user_has_role('directeur_exploitation'::user_role)
);

-- Step 11: Update users table RLS policies to use new role system
-- ============================================================================

DROP POLICY IF EXISTS "Permettre lecture pour authentification" ON public.users;

CREATE POLICY "Utilisateurs peuvent voir leur propre profil"
ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins peuvent voir tous les utilisateurs"
ON public.users
FOR SELECT
USING (public.current_user_has_role('admin'::user_role));

-- Step 12: Add comments explaining the migration
-- ============================================================================

COMMENT ON TABLE public.user_roles IS 'Secure role storage - separates roles from users table to prevent privilege escalation attacks. Uses SECURITY DEFINER functions to avoid RLS recursion.';
COMMENT ON FUNCTION public.user_has_role IS 'SECURITY DEFINER function to check if a user has a specific role. Prevents RLS recursion by bypassing RLS policies.';
COMMENT ON FUNCTION public.current_user_has_role IS 'Helper function to check if the currently authenticated user has a specific role.';