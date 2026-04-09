
CREATE TABLE public.tbm_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  numero_reunion INTEGER NOT NULL,
  theme TEXT,
  date_reunion DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mois, annee, numero_reunion)
);

ALTER TABLE public.tbm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs actifs peuvent voir les sessions TBM"
  ON public.tbm_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.status::text = 'active'));

CREATE POLICY "Roles autorisés peuvent gérer les sessions TBM"
  ON public.tbm_sessions FOR ALL
  USING (current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role) OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role))
  WITH CHECK (current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role) OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role));

CREATE TABLE public.tbm_presences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.tbm_sessions(id) ON DELETE CASCADE,
  chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  employe_id UUID REFERENCES public.employes(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  date_presence DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tbm_presences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs actifs peuvent voir les présences TBM"
  ON public.tbm_presences FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.status::text = 'active'));

CREATE POLICY "Roles autorisés peuvent gérer les présences TBM"
  ON public.tbm_presences FOR ALL
  USING (current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role) OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role))
  WITH CHECK (current_user_has_role('admin'::user_role) OR current_user_has_role('hsecq'::user_role) OR current_user_has_role('direction'::user_role) OR current_user_has_role('rh'::user_role));
