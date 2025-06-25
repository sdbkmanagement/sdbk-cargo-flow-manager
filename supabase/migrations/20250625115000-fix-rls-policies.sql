
-- Migration pour corriger les politiques RLS et permettre la création d'utilisateurs

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Les admins peuvent tout voir" ON public.users;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.users;

-- Créer une fonction pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.email() 
    AND role = 'admin' 
    AND statut = 'actif'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nouvelles politiques RLS plus permissives pour les admins
CREATE POLICY "Admin peut tout faire sur users" ON public.users
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Politique pour que les utilisateurs puissent voir leur propre profil
CREATE POLICY "Utilisateurs peuvent voir leur profil" ON public.users
FOR SELECT TO authenticated
USING (email = auth.email());

-- Politique pour que les utilisateurs puissent mettre à jour leur propre profil
CREATE POLICY "Utilisateurs peuvent modifier leur profil" ON public.users
FOR UPDATE TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Ajout d'une politique pour l'insertion pendant la création de compte
CREATE POLICY "Système peut créer des utilisateurs" ON public.users
FOR INSERT TO authenticated
WITH CHECK (true);

-- Mettre à jour la fonction d'audit pour éviter les erreurs
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (
          COALESCE(auth.uid(), NEW.id), 
          'INSERT', 
          TG_TABLE_NAME, 
          NEW.id, 
          to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (
          COALESCE(auth.uid(), NEW.id), 
          'UPDATE', 
          TG_TABLE_NAME, 
          NEW.id, 
          jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (
          COALESCE(auth.uid(), OLD.id), 
          'DELETE', 
          TG_TABLE_NAME, 
          OLD.id, 
          to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';
