
-- D'abord, vérifier et corriger la politique RLS existante pour les missions
DROP POLICY IF EXISTS "Transport et transitaires peuvent gérer les missions" ON public.missions;

-- Créer une nouvelle politique plus permissive pour les transitaires
CREATE POLICY "Transport et transitaires peuvent gérer les missions" 
ON public.missions 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) 
      OR 'transport'::user_role = ANY(users.roles) 
      OR 'transitaire'::user_role = ANY(users.roles)
      OR 'obc'::user_role = ANY(users.roles)
      OR 'facturation'::user_role = ANY(users.roles)
    ) 
    AND users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) 
      OR 'transport'::user_role = ANY(users.roles) 
      OR 'transitaire'::user_role = ANY(users.roles)
      OR 'obc'::user_role = ANY(users.roles)
      OR 'facturation'::user_role = ANY(users.roles)
    ) 
    AND users.status = 'active'
  )
);

-- Vérifier aussi la politique pour l'historique des missions
DROP POLICY IF EXISTS "Tous peuvent créer l'historique des missions" ON public.missions_historique;

CREATE POLICY "Utilisateurs autorisés peuvent gérer l'historique des missions" 
ON public.missions_historique 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) 
      OR 'transport'::user_role = ANY(users.roles) 
      OR 'transitaire'::user_role = ANY(users.roles)
      OR 'obc'::user_role = ANY(users.roles)
      OR 'facturation'::user_role = ANY(users.roles)
    ) 
    AND users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) 
      OR 'transport'::user_role = ANY(users.roles) 
      OR 'transitaire'::user_role = ANY(users.roles)
      OR 'obc'::user_role = ANY(users.roles)
      OR 'facturation'::user_role = ANY(users.roles)
    ) 
    AND users.status = 'active'
  )
);
