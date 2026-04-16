
-- 1. Formations: ajouter rôle transport
DROP POLICY IF EXISTS "Admin and hsecq can manage formations" ON public.formations;
CREATE POLICY "Admin hsecq and transport can manage formations"
ON public.formations FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND ('admin'::user_role = ANY(users.roles) OR 'hsecq'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles))
    AND users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND ('admin'::user_role = ANY(users.roles) OR 'hsecq'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles))
    AND users.status = 'active'
  )
);

-- 2. Matrice de formation: ajouter rôle transport
DROP POLICY IF EXISTS "Admin and hsecq can manage matrice" ON public.formations_matrice;
CREATE POLICY "Admin hsecq and transport can manage matrice"
ON public.formations_matrice FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND ('admin'::user_role = ANY(users.roles) OR 'hsecq'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles))
    AND users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND ('admin'::user_role = ANY(users.roles) OR 'hsecq'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles))
    AND users.status = 'active'
  )
);

-- 3. TBM sessions: ajouter rôle transport
DROP POLICY IF EXISTS "Roles autorisés peuvent gérer les sessions TBM" ON public.tbm_sessions;
CREATE POLICY "Roles autorises peuvent gerer les sessions TBM"
ON public.tbm_sessions FOR ALL TO authenticated
USING (
  current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('transport'::user_role)
)
WITH CHECK (
  current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('transport'::user_role)
);

-- 4. TBM présences: ajouter rôle transport
DROP POLICY IF EXISTS "Roles autorisés peuvent gérer les présences TBM" ON public.tbm_presences;
CREATE POLICY "Roles autorises peuvent gerer les presences TBM"
ON public.tbm_presences FOR ALL TO authenticated
USING (
  current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('transport'::user_role)
)
WITH CHECK (
  current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role)
  OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role)
  OR current_user_has_role('transport'::user_role)
);
