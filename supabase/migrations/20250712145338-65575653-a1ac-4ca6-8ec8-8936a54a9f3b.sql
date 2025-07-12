
-- Supprimer les colonnes problématiques et ajuster la structure de la table users
ALTER TABLE public.users DROP COLUMN IF EXISTS mot_de_passe_change;
ALTER TABLE public.users DROP COLUMN IF EXISTS derniere_connexion;

-- Ajouter les nouveaux rôles manquants dans l'enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'transitaire';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'directeur_exploitation';

-- Modifier la table users pour correspondre aux besoins
ALTER TABLE public.users ALTER COLUMN statut SET DEFAULT 'actif';

-- Créer une fonction pour vérifier les rôles utilisateur avec le contexte d'authentification
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.users 
  WHERE email = auth.email() 
  AND statut = 'actif'
  LIMIT 1;
$$;

-- Créer une fonction pour vérifier si l'utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_user_role(required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.email() 
    AND role = required_role 
    AND statut = 'actif'
  );
$$;
