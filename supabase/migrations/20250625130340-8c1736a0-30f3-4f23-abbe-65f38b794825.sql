
-- Créer d'abord la fonction is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier si l'utilisateur connecté existe et est admin
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND statut = 'actif'
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Système peut créer des utilisateurs" ON public.users;

-- Créer une politique plus permissive pour la création d'utilisateurs
CREATE POLICY "Admins et système peuvent créer des utilisateurs" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  -- Permettre si l'utilisateur actuel est admin
  public.is_admin() 
  OR 
  -- Permettre si c'est une auto-insertion (l'utilisateur crée son propre profil)
  auth.uid() = id
);
