
-- Ajouter une politique d'insertion pour les workflows de validation
CREATE POLICY "Validateurs peuvent créer des workflows" ON validation_workflows
FOR INSERT 
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
    AND users.status::text = 'active'
  )
);

-- Ajouter une politique d'insertion pour les étapes de validation
CREATE POLICY "Validateurs peuvent créer des étapes" ON validation_etapes
FOR INSERT 
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
    AND users.status::text = 'active'
  )
);
