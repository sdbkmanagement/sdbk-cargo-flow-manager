CREATE TABLE public.socotac_controles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  equipement_remorque_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  immatriculation_tracteur text,
  immatriculation_remorque text,
  conducteur_nom text,
  conducteur_contact text,
  date_controle date NOT NULL,
  date_prochain_controle date,
  resultat text NOT NULL DEFAULT 'accepte',
  motif_rejet text,
  observations text,
  action_corrective text,
  responsable_action text,
  date_correction_prevue date,
  date_correction date,
  date_contre_visite date,
  resultat_contre_visite text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_by_nom text,
  updated_by uuid,
  updated_by_nom text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_socotac_equipement ON public.socotac_controles(equipement_id);
CREATE INDEX idx_socotac_date ON public.socotac_controles(date_controle);
CREATE INDEX idx_socotac_imm ON public.socotac_controles(immatriculation_tracteur);

CREATE TABLE public.socotac_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_id uuid,
  action text NOT NULL,
  champ text,
  ancienne_valeur text,
  nouvelle_valeur text,
  utilisateur_id uuid,
  utilisateur_nom text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_socotac_audit_controle ON public.socotac_audit(controle_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.socotac_controles TO authenticated;
GRANT ALL ON public.socotac_controles TO service_role;
GRANT SELECT, INSERT ON public.socotac_audit TO authenticated;
GRANT ALL ON public.socotac_audit TO service_role;

ALTER TABLE public.socotac_controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socotac_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socotac_lecture_authentifies" ON public.socotac_controles FOR SELECT TO authenticated USING (true);
CREATE POLICY "socotac_ecriture_authentifies" ON public.socotac_controles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "socotac_audit_lecture" ON public.socotac_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "socotac_audit_insertion" ON public.socotac_audit FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.socotac_calcul_echeance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.date_prochain_controle := (NEW.date_controle + INTERVAL '6 months')::date;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_socotac_echeance
BEFORE INSERT OR UPDATE ON public.socotac_controles
FOR EACH ROW EXECUTE FUNCTION public.socotac_calcul_echeance();

CREATE OR REPLACE FUNCTION public.socotac_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.socotac_audit(controle_id, action, nouvelle_valeur, utilisateur_id, utilisateur_nom)
    VALUES (NEW.id, 'creation', NEW.resultat, NEW.created_by, NEW.created_by_nom);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.resultat IS DISTINCT FROM OLD.resultat THEN
      INSERT INTO public.socotac_audit(controle_id, action, champ, ancienne_valeur, nouvelle_valeur, utilisateur_id, utilisateur_nom)
      VALUES (NEW.id, 'modification_resultat', 'resultat', OLD.resultat, NEW.resultat, NEW.updated_by, NEW.updated_by_nom);
    END IF;
    IF NEW.date_controle IS DISTINCT FROM OLD.date_controle THEN
      INSERT INTO public.socotac_audit(controle_id, action, champ, ancienne_valeur, nouvelle_valeur, utilisateur_id, utilisateur_nom)
      VALUES (NEW.id, 'modification_date', 'date_controle', OLD.date_controle::text, NEW.date_controle::text, NEW.updated_by, NEW.updated_by_nom);
    END IF;
    IF NEW.documents IS DISTINCT FROM OLD.documents THEN
      INSERT INTO public.socotac_audit(controle_id, action, champ, utilisateur_id, utilisateur_nom)
      VALUES (NEW.id, 'documents', 'documents', NEW.updated_by, NEW.updated_by_nom);
    END IF;
    IF NEW.action_corrective IS DISTINCT FROM OLD.action_corrective OR NEW.date_correction IS DISTINCT FROM OLD.date_correction THEN
      INSERT INTO public.socotac_audit(controle_id, action, champ, ancienne_valeur, nouvelle_valeur, utilisateur_id, utilisateur_nom)
      VALUES (NEW.id, 'action_corrective', 'action_corrective', OLD.action_corrective, NEW.action_corrective, NEW.updated_by, NEW.updated_by_nom);
    END IF;
    RETURN NEW;
  ELSE
    INSERT INTO public.socotac_audit(controle_id, action, ancienne_valeur)
    VALUES (OLD.id, 'suppression', OLD.resultat);
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_socotac_audit
AFTER INSERT OR UPDATE OR DELETE ON public.socotac_controles
FOR EACH ROW EXECUTE FUNCTION public.socotac_audit_trigger();