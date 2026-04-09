
DROP POLICY IF EXISTS "Admin and hsecq can manage themes" ON public.themes_formation;

CREATE POLICY "Admin hsecq and transport can manage themes" ON public.themes_formation
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles)
      OR 'hsecq'::user_role = ANY(users.roles)
      OR 'transport'::user_role = ANY(users.roles)
    )
    AND users.status::text = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles)
      OR 'hsecq'::user_role = ANY(users.roles)
      OR 'transport'::user_role = ANY(users.roles)
    )
    AND users.status::text = 'active'
  )
);
