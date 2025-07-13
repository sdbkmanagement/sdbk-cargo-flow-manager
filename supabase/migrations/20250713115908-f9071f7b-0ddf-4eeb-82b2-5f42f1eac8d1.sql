
-- Corriger la politique RLS pour permettre aux admins de créer des utilisateurs
-- Supprimer l'ancienne politique d'insertion si elle existe
DROP POLICY IF EXISTS "Création des utilisateurs" ON public.users;

-- Créer une nouvelle politique d'insertion plus permissive
CREATE POLICY "Admins peuvent créer des utilisateurs" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  -- Permettre si l'utilisateur connecté est admin
  public.is_admin()
  OR
  -- Permettre l'auto-inscription (quand l'ID correspond à l'utilisateur connecté)
  id = auth.uid()
);

-- S'assurer que la fonction is_admin() fonctionne correctement
-- Recréer la fonction avec une approche plus robuste
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Si aucun utilisateur connecté, retourner false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si l'utilisateur connecté est admin dans la table users
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Créer aussi une politique pour permettre aux admins de voir tous les utilisateurs
DROP POLICY IF EXISTS "Lecture des utilisateurs" ON public.users;
CREATE POLICY "Lecture des utilisateurs" ON public.users
FOR SELECT TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
);

-- Créer une politique pour permettre aux admins de modifier tous les utilisateurs
DROP POLICY IF EXISTS "Modification des utilisateurs" ON public.users;
CREATE POLICY "Modification des utilisateurs" ON public.users
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
)
WITH CHECK (
  public.is_admin() OR id = auth.uid()
);

-- Créer une politique pour permettre aux admins de supprimer des utilisateurs
DROP POLICY IF EXISTS "Suppression des utilisateurs" ON public.users;
CREATE POLICY "Suppression des utilisateurs" ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());
