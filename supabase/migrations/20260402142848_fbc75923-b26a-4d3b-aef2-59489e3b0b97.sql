
CREATE TABLE public.formations_matrice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_type TEXT NOT NULL CHECK (person_type IN ('employe', 'chauffeur')),
  person_id UUID NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('administration', 'mecaniciens', 'conducteurs')),
  module_nom TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  date_completion DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_person_module UNIQUE (person_id, categorie, module_nom)
);

CREATE INDEX idx_formations_matrice_person ON formations_matrice(person_type, person_id);
CREATE INDEX idx_formations_matrice_categorie ON formations_matrice(categorie);

ALTER TABLE formations_matrice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read matrice"
  ON formations_matrice FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and hsecq can manage matrice"
  ON formations_matrice FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (('admin'::user_role = ANY(users.roles)) OR ('hsecq'::user_role = ANY(users.roles)))
        AND users.status::text = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (('admin'::user_role = ANY(users.roles)) OR ('hsecq'::user_role = ANY(users.roles)))
        AND users.status::text = 'active'
    )
  );
