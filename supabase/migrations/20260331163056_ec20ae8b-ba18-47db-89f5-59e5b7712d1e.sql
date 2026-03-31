CREATE POLICY "HSEQ peut voir les affectations"
ON public.affectations_chauffeurs
FOR SELECT
TO authenticated
USING (current_user_has_role('hsecq'::user_role));