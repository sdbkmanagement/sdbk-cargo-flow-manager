-- 1. formations_employes : etendre la gestion aux roles hsecq et transport
DROP POLICY IF EXISTS "RH peut gérer les formations" ON public.formations_employes;
CREATE POLICY "Roles autorises peuvent gerer les formations_employes"
ON public.formations_employes
FOR ALL
TO authenticated
USING (
  current_user_has_role('admin'::user_role)
  OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('transport'::user_role)
)
WITH CHECK (
  current_user_has_role('admin'::user_role)
  OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('transport'::user_role)
);

-- 2. formations_employes : lecture pour tous les utilisateurs connectes
DROP POLICY IF EXISTS "Utilisateurs connectes peuvent lire formations_employes" ON public.formations_employes;
CREATE POLICY "Utilisateurs connectes peuvent lire formations_employes"
ON public.formations_employes
FOR SELECT
TO authenticated
USING (true);

-- 3. Fonction securisee pour la liste des collaborateurs TBM (champs minimaux, sans PII sensible)
CREATE OR REPLACE FUNCTION public.get_tbm_collaborateurs()
RETURNS TABLE(id uuid, nom text, prenom text, statut text, poste text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.nom, e.prenom, e.statut, e.poste
  FROM public.employes e
  WHERE e.statut = 'actif'
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.status = 'active')
  ORDER BY e.nom;
$$;

GRANT EXECUTE ON FUNCTION public.get_tbm_collaborateurs() TO authenticated;