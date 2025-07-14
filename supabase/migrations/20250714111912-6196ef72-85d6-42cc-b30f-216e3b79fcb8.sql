
-- Ajouter la colonne module_permissions pour gérer l'accès aux modules
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS module_permissions text[] DEFAULT '{}';

-- Créer un type enum pour les modules disponibles
DO $$ BEGIN
    CREATE TYPE module_permission AS ENUM (
        'fleet',
        'drivers', 
        'rh',
        'cargo',
        'missions',
        'billing',
        'dashboard'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier la colonne pour utiliser le type enum (optionnel, on peut garder text[] pour plus de flexibilité)
-- ALTER TABLE public.users ALTER COLUMN module_permissions TYPE module_permission[] USING module_permissions::module_permission[];

-- Mettre à jour les données existantes pour donner tous les accès aux admins
UPDATE public.users 
SET module_permissions = ARRAY['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard']::text[]
WHERE 'admin' = ANY(roles);

-- Donner des permissions de base aux autres utilisateurs selon leur rôle principal
UPDATE public.users 
SET module_permissions = CASE 
    WHEN 'maintenance' = ANY(roles) THEN ARRAY['fleet']::text[]
    WHEN 'transport' = ANY(roles) THEN ARRAY['fleet', 'drivers', 'missions']::text[]
    WHEN 'rh' = ANY(roles) THEN ARRAY['rh', 'drivers']::text[]
    WHEN 'facturation' = ANY(roles) THEN ARRAY['billing']::text[]
    ELSE ARRAY['dashboard']::text[]
END
WHERE module_permissions IS NULL OR module_permissions = '{}';

-- Correction spécifique pour le compte igamerzcsl@gmail.com
UPDATE public.users 
SET 
    roles = ARRAY['maintenance']::user_role[],
    module_permissions = ARRAY['fleet']::text[]
WHERE email = 'igamerzcsl@gmail.com';

-- Fonction helper pour vérifier les permissions de module
CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR module_name = ANY(module_permissions)
    )
    AND status = 'active'
  );
$$;

-- Fonction helper pour vérifier les rôles de validation
CREATE OR REPLACE FUNCTION public.has_validation_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      'admin' = ANY(roles) 
      OR role_name::user_role = ANY(roles)
    )
    AND status = 'active'
  );
$$;
