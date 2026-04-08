CREATE POLICY "Utilisateurs du module RH peuvent voir les employés"
ON public.employes
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_rh(auth.uid())
  OR public.has_module_permission(auth.uid(), 'rh')
);