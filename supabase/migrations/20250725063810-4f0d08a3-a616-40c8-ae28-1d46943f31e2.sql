-- Permettre la lecture de la table users pour l'authentification
-- Sans cette politique, le login ne peut pas vérifier l'existence de l'utilisateur

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur profil" ON public.users;
DROP POLICY IF EXISTS "Admins peuvent gérer les utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leur profil" ON public.users;

-- Créer des politiques plus appropriées pour l'authentification
CREATE POLICY "Permettre lecture pour authentification" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins peuvent tout faire" 
ON public.users 
FOR ALL 
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());