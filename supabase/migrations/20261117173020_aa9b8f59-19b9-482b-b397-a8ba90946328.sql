CREATE TABLE public.formations_matrice_modules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 annee integer NOT NULL,
 categorie text NOT NULL CHECK (categorie IN ('administration','mecaniciens','conducteurs')),
 module_nom text NOT NULL CHECK (length(trim(module_nom)) > 0),
 position integer NOT NULL DEFAULT 0,
 actif boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (annee,categorie,module_nom)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.formations_matrice_modules TO authenticated;
GRANT ALL ON public.formations_matrice_modules TO service_role;
ALTER TABLE public.formations_matrice_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read annual matrix plans" ON public.formations_matrice_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage annual matrix plans" ON public.formations_matrice_modules FOR ALL TO authenticated USING (public.current_user_has_role('admin') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport')) WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport'));
CREATE TRIGGER formations_matrice_modules_updated BEFORE UPDATE ON public.formations_matrice_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.formations_matrice ADD COLUMN annee integer NOT NULL DEFAULT 2026;
ALTER TABLE public.formations_matrice DROP CONSTRAINT unique_person_module;
ALTER TABLE public.formations_matrice ADD CONSTRAINT unique_person_module_year UNIQUE (person_id,categorie,module_nom,annee);
CREATE INDEX formations_matrice_annual_category ON public.formations_matrice(annee,categorie);
DROP POLICY "Admin hsecq and transport can manage matrice" ON public.formations_matrice;
CREATE POLICY "Manage annual matrix completion" ON public.formations_matrice FOR ALL TO authenticated USING (public.current_user_has_role('admin') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport')) WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.formations_matrice TO authenticated;