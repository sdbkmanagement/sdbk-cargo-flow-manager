
-- Correction définitive des politiques RLS pour permettre la création d'utilisateurs par les admins

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Admin peut voir tous les utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Admin peut modifier tous les utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Admin peut supprimer tous les utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Création d'utilisateurs autorisée" ON public.users;

-- Recréer la fonction is_admin avec une approche plus robuste
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Si aucun utilisateur connecté, retourner false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si l'utilisateur connecté est admin
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

-- Politique SELECT - Admins voient tout, autres voient leur profil
CREATE POLICY "Lecture des utilisateurs" ON public.users
FOR SELECT TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
);

-- Politique UPDATE - Admins modifient tout, autres modifient leur profil
CREATE POLICY "Modification des utilisateurs" ON public.users
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
)
WITH CHECK (
  public.is_admin() OR id = auth.uid()
);

-- Politique DELETE - Seuls les admins peuvent supprimer
CREATE POLICY "Suppression des utilisateurs" ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());

-- Politique INSERT très permissive - Permettre aux admins de créer des utilisateurs
CREATE POLICY "Création des utilisateurs" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  -- Permettre si l'utilisateur connecté est admin
  public.is_admin()
  OR
  -- Permettre l'auto-inscription (quand l'ID correspond à l'utilisateur connecté)
  id = auth.uid()
);

-- Ajouter une fonction pour vérifier si un email admin existe déjà
CREATE OR REPLACE FUNCTION public.admin_user_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE role = 'admin' 
    AND statut = 'actif'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Si aucun admin n'existe, créer un utilisateur admin de base
DO $$
BEGIN
  IF NOT public.admin_user_exists() THEN
    INSERT INTO public.users (
      email, 
      nom, 
      prenom, 
      role, 
      statut, 
      mot_de_passe_change
    ) VALUES (
      'admin@sdbk.com',
      'Admin',
      'Système',
      'admin',
      'actif',
      false
    );
  END IF;
END $$;
