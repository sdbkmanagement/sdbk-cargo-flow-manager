
-- Ajouter les politiques RLS pour la table validation_historique
-- Permettre aux validateurs d'insérer dans l'historique
CREATE POLICY "Validateurs peuvent créer l'historique de validation" 
ON validation_historique 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) OR 
      'maintenance'::user_role = ANY(users.roles) OR 
      'administratif'::user_role = ANY(users.roles) OR 
      'hsecq'::user_role = ANY(users.roles) OR 
      'obc'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

-- Permettre aux validateurs de voir l'historique
CREATE POLICY "Validateurs peuvent voir l'historique de validation" 
ON validation_historique 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      'admin'::user_role = ANY(users.roles) OR 
      'maintenance'::user_role = ANY(users.roles) OR 
      'administratif'::user_role = ANY(users.roles) OR 
      'hsecq'::user_role = ANY(users.roles) OR 
      'obc'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);
