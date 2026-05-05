
-- =========================================
-- 1. CONFIG SEUILS
-- =========================================
CREATE TABLE public.obc_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text UNIQUE NOT NULL,
  valeur numeric NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.obc_config (cle, valeur, description) VALUES
  ('points_initiaux', 12, 'Points attribués à chaque nouveau chauffeur'),
  ('seuil_journalier_h', 10, 'Maximum heures de conduite par jour'),
  ('seuil_continu_h', 2.5, 'Maximum heures de conduite continue'),
  ('seuil_hebdo_h', 56, 'Maximum heures de conduite sur 7 jours glissants');

-- =========================================
-- 2. VIOLATIONS
-- =========================================
CREATE TYPE public.obc_violation_type AS ENUM (
  'survitesse',
  'freinage_excessif',
  'acceleration_excessive',
  'conduite_nuit',
  'conduite_journaliere',
  'conduite_continue',
  'conduite_hebdomadaire',
  'anomalie_obc'
);

CREATE TABLE public.obc_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  date_violation timestamptz NOT NULL DEFAULT now(),
  type_violation obc_violation_type NOT NULL,
  commentaire text,
  preuve_url text,
  mesures_prises text,
  points_retires integer NOT NULL DEFAULT 0 CHECK (points_retires >= 0),
  auto_generee boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_obc_violations_chauffeur ON public.obc_violations(chauffeur_id);
CREATE INDEX idx_obc_violations_date ON public.obc_violations(date_violation DESC);
CREATE INDEX idx_obc_violations_type ON public.obc_violations(type_violation);

CREATE TRIGGER trg_obc_violations_updated
  BEFORE UPDATE ON public.obc_violations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. POINTS CHAUFFEURS
-- =========================================
CREATE TABLE public.obc_chauffeur_points (
  chauffeur_id uuid PRIMARY KEY REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  points_actuels integer NOT NULL DEFAULT 12,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.obc_points_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  violation_id uuid REFERENCES public.obc_violations(id) ON DELETE SET NULL,
  points_avant integer NOT NULL,
  points_apres integer NOT NULL,
  delta integer NOT NULL,
  motif text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

CREATE INDEX idx_obc_points_hist_chauffeur ON public.obc_points_historique(chauffeur_id, created_at DESC);

-- =========================================
-- 4. TEMPS DE CONDUITE
-- =========================================
CREATE TABLE public.obc_temps_conduite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  date_jour date NOT NULL,
  distance_km numeric NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  temps_conduite_h numeric NOT NULL DEFAULT 0 CHECK (temps_conduite_h >= 0),
  temps_continu_max_h numeric DEFAULT 0,
  commentaire text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chauffeur_id, date_jour)
);

CREATE INDEX idx_obc_temps_chauffeur_date ON public.obc_temps_conduite(chauffeur_id, date_jour DESC);

CREATE TRIGGER trg_obc_temps_updated
  BEFORE UPDATE ON public.obc_temps_conduite
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. ALERTES
-- =========================================
CREATE TABLE public.obc_alertes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  type_alerte text NOT NULL,
  niveau text NOT NULL DEFAULT 'warning' CHECK (niveau IN ('info','warning','critique')),
  message text NOT NULL,
  lu boolean NOT NULL DEFAULT false,
  violation_id uuid REFERENCES public.obc_violations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_obc_alertes_lu ON public.obc_alertes(lu, created_at DESC);

-- =========================================
-- 6. FONCTIONS / TRIGGERS
-- =========================================

-- Initialisation des points à la création d'un chauffeur
CREATE OR REPLACE FUNCTION public.obc_init_chauffeur_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pts integer;
BEGIN
  SELECT valeur::int INTO v_pts FROM public.obc_config WHERE cle = 'points_initiaux';
  INSERT INTO public.obc_chauffeur_points (chauffeur_id, points_actuels)
  VALUES (NEW.id, COALESCE(v_pts, 12))
  ON CONFLICT (chauffeur_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_obc_init_points
  AFTER INSERT ON public.chauffeurs
  FOR EACH ROW EXECUTE FUNCTION public.obc_init_chauffeur_points();

-- Initialiser les points pour les chauffeurs existants
INSERT INTO public.obc_chauffeur_points (chauffeur_id, points_actuels)
SELECT id, 12 FROM public.chauffeurs
ON CONFLICT (chauffeur_id) DO NOTHING;

-- Déduction automatique des points sur insertion d'une violation
CREATE OR REPLACE FUNCTION public.obc_deduire_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avant integer;
  v_apres integer;
BEGIN
  IF NEW.points_retires > 0 THEN
    -- S'assurer qu'une ligne existe
    INSERT INTO public.obc_chauffeur_points (chauffeur_id, points_actuels)
    VALUES (NEW.chauffeur_id, 12)
    ON CONFLICT (chauffeur_id) DO NOTHING;

    SELECT points_actuels INTO v_avant FROM public.obc_chauffeur_points WHERE chauffeur_id = NEW.chauffeur_id;
    v_apres := GREATEST(0, v_avant - NEW.points_retires);

    UPDATE public.obc_chauffeur_points
       SET points_actuels = v_apres, updated_at = now()
     WHERE chauffeur_id = NEW.chauffeur_id;

    INSERT INTO public.obc_points_historique
      (chauffeur_id, violation_id, points_avant, points_apres, delta, motif, created_by)
    VALUES
      (NEW.chauffeur_id, NEW.id, v_avant, v_apres, -NEW.points_retires,
       'Violation: ' || NEW.type_violation::text, NEW.created_by);

    -- Si solde 0 → bloquer chauffeur
    IF v_apres = 0 THEN
      UPDATE public.chauffeurs SET statut = 'inactif', updated_at = now() WHERE id = NEW.chauffeur_id;

      INSERT INTO public.obc_alertes (chauffeur_id, type_alerte, niveau, message, violation_id)
      VALUES (NEW.chauffeur_id, 'points_epuises', 'critique',
              'Chauffeur bloqué : 0 point restant', NEW.id);
    ELSIF v_apres <= 3 THEN
      INSERT INTO public.obc_alertes (chauffeur_id, type_alerte, niveau, message, violation_id)
      VALUES (NEW.chauffeur_id, 'points_faibles', 'warning',
              'Solde points faible: ' || v_apres || ' restant(s)', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_obc_deduire_points
  AFTER INSERT ON public.obc_violations
  FOR EACH ROW EXECUTE FUNCTION public.obc_deduire_points();

-- Détection automatique des dépassements de temps de conduite
CREATE OR REPLACE FUNCTION public.obc_check_seuils_temps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seuil_jour numeric;
  v_seuil_continu numeric;
  v_seuil_hebdo numeric;
  v_cumul_hebdo numeric;
BEGIN
  SELECT valeur INTO v_seuil_jour FROM public.obc_config WHERE cle = 'seuil_journalier_h';
  SELECT valeur INTO v_seuil_continu FROM public.obc_config WHERE cle = 'seuil_continu_h';
  SELECT valeur INTO v_seuil_hebdo FROM public.obc_config WHERE cle = 'seuil_hebdo_h';

  -- Journalier
  IF NEW.temps_conduite_h > COALESCE(v_seuil_jour, 10) THEN
    INSERT INTO public.obc_violations
      (chauffeur_id, date_violation, type_violation, commentaire, points_retires, auto_generee)
    VALUES
      (NEW.chauffeur_id, NEW.date_jour::timestamptz, 'conduite_journaliere',
       'Dépassement automatique: ' || NEW.temps_conduite_h || 'h > ' || v_seuil_jour || 'h', 1, true);

    INSERT INTO public.obc_alertes (chauffeur_id, type_alerte, niveau, message)
    VALUES (NEW.chauffeur_id, 'depassement_journalier', 'warning',
            'Dépassement journalier: ' || NEW.temps_conduite_h || 'h le ' || NEW.date_jour);
  END IF;

  -- Conduite continue
  IF COALESCE(NEW.temps_continu_max_h, 0) > COALESCE(v_seuil_continu, 2.5) THEN
    INSERT INTO public.obc_violations
      (chauffeur_id, date_violation, type_violation, commentaire, points_retires, auto_generee)
    VALUES
      (NEW.chauffeur_id, NEW.date_jour::timestamptz, 'conduite_continue',
       'Dépassement continu: ' || NEW.temps_continu_max_h || 'h > ' || v_seuil_continu || 'h', 1, true);
  END IF;

  -- Cumul hebdomadaire 7 jours glissants
  SELECT COALESCE(SUM(temps_conduite_h), 0) INTO v_cumul_hebdo
  FROM public.obc_temps_conduite
  WHERE chauffeur_id = NEW.chauffeur_id
    AND date_jour > (NEW.date_jour - INTERVAL '7 days')
    AND date_jour <= NEW.date_jour;

  IF v_cumul_hebdo > COALESCE(v_seuil_hebdo, 56) THEN
    INSERT INTO public.obc_violations
      (chauffeur_id, date_violation, type_violation, commentaire, points_retires, auto_generee)
    VALUES
      (NEW.chauffeur_id, NEW.date_jour::timestamptz, 'conduite_hebdomadaire',
       'Cumul 7j: ' || v_cumul_hebdo || 'h > ' || v_seuil_hebdo || 'h', 2, true);

    INSERT INTO public.obc_alertes (chauffeur_id, type_alerte, niveau, message)
    VALUES (NEW.chauffeur_id, 'depassement_hebdo', 'critique',
            'Cumul hebdo dépassé: ' || v_cumul_hebdo || 'h');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_obc_check_seuils
  AFTER INSERT OR UPDATE ON public.obc_temps_conduite
  FOR EACH ROW EXECUTE FUNCTION public.obc_check_seuils_temps();

-- =========================================
-- 7. RLS
-- =========================================
ALTER TABLE public.obc_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obc_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obc_chauffeur_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obc_points_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obc_temps_conduite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obc_alertes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_obc_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id
      AND status = 'active'
      AND (
        'admin'::user_role = ANY(roles)
        OR 'obc'::user_role = ANY(roles)
        OR 'hsecq'::user_role = ANY(roles)
        OR 'direction'::user_role = ANY(roles)
        OR 'directeur_exploitation'::user_role = ANY(roles)
      )
  );
$$;

-- Policies génériques pour chaque table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['obc_config','obc_violations','obc_chauffeur_points','obc_points_historique','obc_temps_conduite','obc_alertes']
  LOOP
    EXECUTE format('CREATE POLICY "obc_select_%s" ON public.%I FOR SELECT USING (public.has_obc_access(auth.uid()));', t, t);
    EXECUTE format('CREATE POLICY "obc_insert_%s" ON public.%I FOR INSERT WITH CHECK (public.has_obc_access(auth.uid()));', t, t);
    EXECUTE format('CREATE POLICY "obc_update_%s" ON public.%I FOR UPDATE USING (public.has_obc_access(auth.uid()));', t, t);
    EXECUTE format('CREATE POLICY "obc_delete_%s" ON public.%I FOR DELETE USING (public.is_admin());', t, t);
  END LOOP;
END $$;

-- =========================================
-- 8. STORAGE BUCKET POUR PREUVES
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('obc-preuves', 'obc-preuves', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "obc_preuves_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'obc-preuves' AND public.has_obc_access(auth.uid()));
CREATE POLICY "obc_preuves_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'obc-preuves' AND public.has_obc_access(auth.uid()));
CREATE POLICY "obc_preuves_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'obc-preuves' AND public.has_obc_access(auth.uid()));
CREATE POLICY "obc_preuves_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'obc-preuves' AND public.is_admin());
