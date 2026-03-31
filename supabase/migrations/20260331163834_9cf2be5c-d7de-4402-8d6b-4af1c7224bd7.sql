DROP POLICY IF EXISTS "HSEQ peut voir les chauffeurs pour contrôles" ON public.chauffeurs;

CREATE POLICY "HSEQ peut voir les chauffeurs pour contrôles"
ON public.chauffeurs
FOR SELECT
TO authenticated
USING (current_user_has_role('hsecq'::user_role));