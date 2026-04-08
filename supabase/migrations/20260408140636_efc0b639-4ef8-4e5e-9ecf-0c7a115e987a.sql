
-- Créer une fonction security definer pour vérifier admin ou rh
CREATE OR REPLACE FUNCTION public.is_admin_or_rh(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id
    AND (('admin'::user_role = ANY(roles)) OR ('rh'::user_role = ANY(roles)))
    AND status = 'active'
  );
$$;

-- Recréer la politique avec la fonction
DROP POLICY IF EXISTS "RH peut gérer les employés" ON public.employes;

CREATE POLICY "RH peut gérer les employés"
ON public.employes
FOR ALL
TO authenticated
USING (public.is_admin_or_rh(auth.uid()))
WITH CHECK (public.is_admin_or_rh(auth.uid()));
