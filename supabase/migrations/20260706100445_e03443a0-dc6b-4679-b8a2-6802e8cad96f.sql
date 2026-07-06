DROP POLICY IF EXISTS "Utilisateurs autorisés peuvent gérer les clients" ON public.clients;
CREATE POLICY "Utilisateurs autorisés peuvent gérer les clients" ON public.clients
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND ('admin'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles) OR 'facturation'::user_role = ANY(users.roles) OR 'transitaire'::user_role = ANY(users.roles)) AND users.status::text = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND ('admin'::user_role = ANY(users.roles) OR 'transport'::user_role = ANY(users.roles) OR 'facturation'::user_role = ANY(users.roles) OR 'transitaire'::user_role = ANY(users.roles)) AND users.status::text = 'active'));