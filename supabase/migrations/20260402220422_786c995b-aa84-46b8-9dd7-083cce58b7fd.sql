
CREATE TABLE public.fiches_compagnonnage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE CASCADE NOT NULL,
  date_formation DATE NOT NULL,
  date_echeance DATE,
  formateur_nom TEXT,
  theme TEXT DEFAULT 'Compagnonnage',
  statut TEXT DEFAULT 'valide' CHECK (statut IN ('valide', 'a_renouveler', 'expire')),
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fiches_compagnonnage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fiches_compagnonnage"
  ON public.fiches_compagnonnage FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert fiches_compagnonnage"
  ON public.fiches_compagnonnage FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update fiches_compagnonnage"
  ON public.fiches_compagnonnage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fiches_compagnonnage"
  ON public.fiches_compagnonnage FOR DELETE TO authenticated USING (true);
