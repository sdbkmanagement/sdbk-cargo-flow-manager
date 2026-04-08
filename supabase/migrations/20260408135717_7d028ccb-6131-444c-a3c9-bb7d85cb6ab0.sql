
DROP POLICY IF EXISTS "RH peut gérer les employés" ON public.employes;

CREATE POLICY "RH peut gérer les employés"
ON public.employes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (('admin'::user_role = ANY (users.roles)) OR ('rh'::user_role = ANY (users.roles)))
    AND users.status::text = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (('admin'::user_role = ANY (users.roles)) OR ('rh'::user_role = ANY (users.roles)))
    AND users.status::text = 'active'
  )
);
