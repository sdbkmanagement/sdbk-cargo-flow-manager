-- Ajouter WITH CHECK à la politique UPDATE pour validation_etapes
DROP POLICY IF EXISTS "Validateurs peuvent mettre à jour leurs étapes" ON validation_etapes;

CREATE POLICY "Validateurs peuvent mettre à jour leurs étapes" 
ON validation_etapes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);