
-- Mettre à jour la politique RLS pour permettre aux transitaires de créer des missions
DROP POLICY IF EXISTS "Transport peut gérer les missions" ON public.missions;

CREATE POLICY "Transport et transitaires peuvent gérer les missions" 
ON public.missions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) 
      OR 'transport'::user_role = ANY(users.roles) 
      OR 'transitaire'::user_role = ANY(users.roles)
      OR 'obc'::user_role = ANY(users.roles)
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
    ) 
    AND users.status = 'active'
  )
);
