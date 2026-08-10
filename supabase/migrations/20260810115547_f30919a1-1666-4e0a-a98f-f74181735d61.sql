
-- ============ CATEGORIES ============
CREATE TABLE public.gmao_categories_equipement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle text NOT NULL UNIQUE,
  description text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type text NOT NULL DEFAULT 'prestataire',
  contact_nom text,
  telephone text,
  email text,
  adresse text,
  specialites text[],
  actif boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_equipements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  designation text NOT NULL,
  categorie_id uuid REFERENCES public.gmao_categories_equipement(id) ON DELETE SET NULL,
  vehicule_id uuid,
  marque text,
  modele text,
  numero_serie text,
  site text,
  departement text,
  date_mise_service date,
  valeur_acquisition numeric,
  statut text NOT NULL DEFAULT 'operationnel',
  criticite text NOT NULL DEFAULT 'normale',
  compteur_km numeric DEFAULT 0,
  compteur_heures numeric DEFAULT 0,
  photo_url text,
  observations text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gmao_equipements_vehicule ON public.gmao_equipements(vehicule_id);

CREATE TABLE public.gmao_techniciens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid,
  nom text NOT NULL,
  prenom text,
  specialites text[],
  telephone text,
  email text,
  cout_horaire numeric DEFAULT 0,
  disponible boolean NOT NULL DEFAULT true,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle text NOT NULL,
  description text,
  categorie_id uuid REFERENCES public.gmao_categories_equipement(id) ON DELETE SET NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.gmao_checklists(id) ON DELETE CASCADE,
  libelle text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  obligatoire boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_plans_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE CASCADE,
  categorie_id uuid REFERENCES public.gmao_categories_equipement(id) ON DELETE SET NULL,
  libelle text NOT NULL,
  description text,
  type_declencheur text NOT NULL DEFAULT 'date',
  periodicite_jours integer,
  periodicite_km numeric,
  periodicite_heures numeric,
  checklist_id uuid REFERENCES public.gmao_checklists(id) ON DELETE SET NULL,
  duree_estimee_heures numeric,
  cout_estime numeric,
  derniere_execution date,
  dernier_compteur_km numeric,
  dernier_compteur_heures numeric,
  prochaine_echeance date,
  prochain_km numeric,
  prochaines_heures numeric,
  alerte_avant_jours integer DEFAULT 7,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_demandes_intervention (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  vehicule_id uuid,
  source_nc_id uuid,
  titre text NOT NULL,
  description text,
  priorite text NOT NULL DEFAULT 'normale',
  statut text NOT NULL DEFAULT 'nouvelle',
  demandeur_nom text,
  demandeur_id uuid,
  date_demande timestamptz NOT NULL DEFAULT now(),
  date_traitement timestamptz,
  motif_rejet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_ordres_travail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  demande_id uuid REFERENCES public.gmao_demandes_intervention(id) ON DELETE SET NULL,
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.gmao_plans_maintenance(id) ON DELETE SET NULL,
  checklist_id uuid REFERENCES public.gmao_checklists(id) ON DELETE SET NULL,
  fournisseur_id uuid REFERENCES public.gmao_fournisseurs(id) ON DELETE SET NULL,
  titre text NOT NULL,
  description text,
  type_maintenance text NOT NULL DEFAULT 'correctif',
  priorite text NOT NULL DEFAULT 'normale',
  statut text NOT NULL DEFAULT 'planifie',
  date_planifiee date,
  date_debut timestamptz,
  date_fin timestamptz,
  duree_immobilisation_heures numeric,
  diagnostic text,
  travaux_realises text,
  cout_pieces numeric NOT NULL DEFAULT 0,
  cout_main_oeuvre numeric NOT NULL DEFAULT 0,
  cout_prestation numeric NOT NULL DEFAULT 0,
  cout_autres numeric NOT NULL DEFAULT 0,
  cout_total numeric NOT NULL DEFAULT 0,
  cloture boolean NOT NULL DEFAULT false,
  cloture_par text,
  date_cloture timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_ot_taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id uuid NOT NULL REFERENCES public.gmao_ordres_travail(id) ON DELETE CASCADE,
  libelle text NOT NULL,
  fait boolean NOT NULL DEFAULT false,
  ordre integer NOT NULL DEFAULT 0,
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_ot_checklist_resultats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id uuid NOT NULL REFERENCES public.gmao_ordres_travail(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.gmao_checklist_items(id) ON DELETE SET NULL,
  libelle text NOT NULL,
  resultat text NOT NULL DEFAULT 'na',
  commentaire text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_ot_techniciens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id uuid NOT NULL REFERENCES public.gmao_ordres_travail(id) ON DELETE CASCADE,
  technicien_id uuid NOT NULL REFERENCES public.gmao_techniciens(id) ON DELETE CASCADE,
  heures numeric NOT NULL DEFAULT 0,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ot_id, technicien_id)
);

CREATE TABLE public.gmao_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  designation text NOT NULL,
  categorie text,
  unite text DEFAULT 'unite',
  quantite_stock numeric NOT NULL DEFAULT 0,
  seuil_mini numeric NOT NULL DEFAULT 0,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  emplacement text,
  fournisseur_id uuid REFERENCES public.gmao_fournisseurs(id) ON DELETE SET NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_mouvements_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.gmao_pieces(id) ON DELETE CASCADE,
  type_mouvement text NOT NULL,
  quantite numeric NOT NULL,
  ot_id uuid REFERENCES public.gmao_ordres_travail(id) ON DELETE SET NULL,
  motif text,
  utilisateur_nom text,
  date_mouvement timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_ot_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id uuid NOT NULL REFERENCES public.gmao_ordres_travail(id) ON DELETE CASCADE,
  piece_id uuid NOT NULL REFERENCES public.gmao_pieces(id) ON DELETE CASCADE,
  quantite numeric NOT NULL DEFAULT 1,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  montant numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_contrats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fournisseur_id uuid REFERENCES public.gmao_fournisseurs(id) ON DELETE SET NULL,
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  reference text,
  objet text NOT NULL,
  date_debut date,
  date_fin date,
  montant numeric,
  alerte_avant_jours integer DEFAULT 30,
  statut text NOT NULL DEFAULT 'actif',
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_alertes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_alerte text NOT NULL,
  niveau text NOT NULL DEFAULT 'info',
  titre text NOT NULL,
  message text,
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE CASCADE,
  piece_id uuid REFERENCES public.gmao_pieces(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.gmao_plans_maintenance(id) ON DELETE CASCADE,
  contrat_id uuid REFERENCES public.gmao_contrats(id) ON DELETE CASCADE,
  ot_id uuid REFERENCES public.gmao_ordres_travail(id) ON DELETE CASCADE,
  traitee boolean NOT NULL DEFAULT false,
  date_echeance date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_historique_equipement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid NOT NULL REFERENCES public.gmao_equipements(id) ON DELETE CASCADE,
  type_evenement text NOT NULL,
  ancien_statut text,
  nouveau_statut text,
  description text,
  utilisateur_nom text,
  date_evenement timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gmao_pieces_jointes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text NOT NULL,
  entite_id uuid NOT NULL,
  nom text NOT NULL,
  url text NOT NULL,
  type_fichier text,
  taille integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_categories_equipement TO authenticated;
GRANT ALL ON public.gmao_categories_equipement TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_fournisseurs TO authenticated;
GRANT ALL ON public.gmao_fournisseurs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_equipements TO authenticated;
GRANT ALL ON public.gmao_equipements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_techniciens TO authenticated;
GRANT ALL ON public.gmao_techniciens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_checklists TO authenticated;
GRANT ALL ON public.gmao_checklists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_checklist_items TO authenticated;
GRANT ALL ON public.gmao_checklist_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_plans_maintenance TO authenticated;
GRANT ALL ON public.gmao_plans_maintenance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_demandes_intervention TO authenticated;
GRANT ALL ON public.gmao_demandes_intervention TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_ordres_travail TO authenticated;
GRANT ALL ON public.gmao_ordres_travail TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_ot_taches TO authenticated;
GRANT ALL ON public.gmao_ot_taches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_ot_checklist_resultats TO authenticated;
GRANT ALL ON public.gmao_ot_checklist_resultats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_ot_techniciens TO authenticated;
GRANT ALL ON public.gmao_ot_techniciens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_pieces TO authenticated;
GRANT ALL ON public.gmao_pieces TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_mouvements_stock TO authenticated;
GRANT ALL ON public.gmao_mouvements_stock TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_ot_pieces TO authenticated;
GRANT ALL ON public.gmao_ot_pieces TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_contrats TO authenticated;
GRANT ALL ON public.gmao_contrats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_alertes TO authenticated;
GRANT ALL ON public.gmao_alertes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_historique_equipement TO authenticated;
GRANT ALL ON public.gmao_historique_equipement TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmao_pieces_jointes TO authenticated;
GRANT ALL ON public.gmao_pieces_jointes TO service_role;

-- ============ RLS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'gmao_categories_equipement','gmao_fournisseurs','gmao_equipements','gmao_techniciens',
    'gmao_checklists','gmao_checklist_items','gmao_plans_maintenance','gmao_demandes_intervention',
    'gmao_ordres_travail','gmao_ot_taches','gmao_ot_checklist_resultats','gmao_ot_techniciens',
    'gmao_pieces','gmao_mouvements_stock','gmao_ot_pieces','gmao_contrats','gmao_alertes',
    'gmao_historique_equipement','gmao_pieces_jointes'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "gmao_select_authenticated" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format($f$CREATE POLICY "gmao_write_roles" ON public.%I FOR ALL TO authenticated
      USING (public.current_user_has_role('admin') OR public.current_user_has_role('maintenance') OR public.current_user_has_role('direction') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport'))
      WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('maintenance') OR public.current_user_has_role('direction') OR public.current_user_has_role('hsecq') OR public.current_user_has_role('transport'))$f$, t);
  END LOOP;
END $$;

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.gmao_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'gmao_categories_equipement','gmao_fournisseurs','gmao_equipements','gmao_techniciens',
    'gmao_checklists','gmao_checklist_items','gmao_plans_maintenance','gmao_demandes_intervention',
    'gmao_ordres_travail','gmao_ot_taches','gmao_ot_checklist_resultats','gmao_ot_techniciens',
    'gmao_pieces','gmao_ot_pieces','gmao_contrats','gmao_alertes'
  ] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.gmao_set_updated_at()', t, t);
  END LOOP;
END $$;

-- Numérotation DI
CREATE OR REPLACE FUNCTION public.gmao_numero_di()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(numero FROM '\d+$')::int), 0) + 1 INTO n
    FROM public.gmao_demandes_intervention
    WHERE numero LIKE 'DI-' || to_char(now(), 'YYYY') || '-%';
    NEW.numero := 'DI-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_gmao_numero_di BEFORE INSERT ON public.gmao_demandes_intervention
FOR EACH ROW EXECUTE FUNCTION public.gmao_numero_di();

-- Numérotation OT
CREATE OR REPLACE FUNCTION public.gmao_numero_ot()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(numero FROM '\d+$')::int), 0) + 1 INTO n
    FROM public.gmao_ordres_travail
    WHERE numero LIKE 'OT-' || to_char(now(), 'YYYY') || '-%';
    NEW.numero := 'OT-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_gmao_numero_ot BEFORE INSERT ON public.gmao_ordres_travail
FOR EACH ROW EXECUTE FUNCTION public.gmao_numero_ot();

-- Coût total OT
CREATE OR REPLACE FUNCTION public.gmao_calc_cout_ot()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.cout_total := COALESCE(NEW.cout_pieces,0) + COALESCE(NEW.cout_main_oeuvre,0) + COALESCE(NEW.cout_prestation,0) + COALESCE(NEW.cout_autres,0);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_gmao_calc_cout_ot BEFORE INSERT OR UPDATE ON public.gmao_ordres_travail
FOR EACH ROW EXECUTE FUNCTION public.gmao_calc_cout_ot();

-- Consommation de pièces
CREATE OR REPLACE FUNCTION public.gmao_consommation_piece()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p RECORD;
BEGIN
  SELECT * INTO p FROM public.gmao_pieces WHERE id = NEW.piece_id;
  IF NEW.prix_unitaire IS NULL OR NEW.prix_unitaire = 0 THEN
    NEW.prix_unitaire := COALESCE(p.prix_unitaire, 0);
  END IF;
  NEW.montant := COALESCE(NEW.quantite,0) * COALESCE(NEW.prix_unitaire,0);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_gmao_ot_piece_montant BEFORE INSERT OR UPDATE ON public.gmao_ot_pieces
FOR EACH ROW EXECUTE FUNCTION public.gmao_consommation_piece();

CREATE OR REPLACE FUNCTION public.gmao_stock_apres_consommation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE reste numeric; seuil numeric; ref text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gmao_pieces SET quantite_stock = quantite_stock - NEW.quantite WHERE id = NEW.piece_id;
    INSERT INTO public.gmao_mouvements_stock (piece_id, type_mouvement, quantite, ot_id, motif)
    VALUES (NEW.piece_id, 'sortie', NEW.quantite, NEW.ot_id, 'Consommation sur ordre de travail');
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.gmao_pieces SET quantite_stock = quantite_stock + OLD.quantite - NEW.quantite WHERE id = NEW.piece_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.gmao_pieces SET quantite_stock = quantite_stock + OLD.quantite WHERE id = OLD.piece_id;
    INSERT INTO public.gmao_mouvements_stock (piece_id, type_mouvement, quantite, ot_id, motif)
    VALUES (OLD.piece_id, 'retour', OLD.quantite, OLD.ot_id, 'Annulation consommation');
    RETURN OLD;
  END IF;

  SELECT quantite_stock, seuil_mini, reference INTO reste, seuil, ref FROM public.gmao_pieces WHERE id = NEW.piece_id;
  IF reste IS NOT NULL AND seuil IS NOT NULL AND reste <= seuil THEN
    INSERT INTO public.gmao_alertes (type_alerte, niveau, titre, message, piece_id)
    VALUES ('stock_mini', 'critique', 'Stock minimum atteint', 'La pièce ' || ref || ' est à ' || reste || ' en stock (seuil ' || seuil || ')', NEW.piece_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_gmao_stock_conso AFTER INSERT OR UPDATE OR DELETE ON public.gmao_ot_pieces
FOR EACH ROW EXECUTE FUNCTION public.gmao_stock_apres_consommation();

-- Recalcul coût pièces de l'OT
CREATE OR REPLACE FUNCTION public.gmao_maj_cout_pieces_ot()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cible uuid; total numeric;
BEGIN
  cible := COALESCE(NEW.ot_id, OLD.ot_id);
  SELECT COALESCE(SUM(montant),0) INTO total FROM public.gmao_ot_pieces WHERE ot_id = cible;
  UPDATE public.gmao_ordres_travail SET cout_pieces = total WHERE id = cible;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_gmao_maj_cout_pieces AFTER INSERT OR UPDATE OR DELETE ON public.gmao_ot_pieces
FOR EACH ROW EXECUTE FUNCTION public.gmao_maj_cout_pieces_ot();

-- Historique statut équipement
CREATE OR REPLACE FUNCTION public.gmao_historique_statut_equipement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    INSERT INTO public.gmao_historique_equipement (equipement_id, type_evenement, ancien_statut, nouveau_statut, description)
    VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut de l''équipement');
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.gmao_historique_equipement (equipement_id, type_evenement, nouveau_statut, description)
    VALUES (NEW.id, 'creation', NEW.statut, 'Création de l''équipement');
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_gmao_hist_equipement AFTER INSERT OR UPDATE ON public.gmao_equipements
FOR EACH ROW EXECUTE FUNCTION public.gmao_historique_statut_equipement();

-- Statut équipement selon OT
CREATE OR REPLACE FUNCTION public.gmao_statut_equipement_ot()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.equipement_id IS NOT NULL THEN
    IF NEW.statut = 'en_cours' THEN
      UPDATE public.gmao_equipements SET statut = 'en_maintenance' WHERE id = NEW.equipement_id;
    ELSIF NEW.statut IN ('termine','cloture') THEN
      UPDATE public.gmao_equipements SET statut = 'operationnel' WHERE id = NEW.equipement_id;
    END IF;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_gmao_statut_equipement AFTER INSERT OR UPDATE OF statut ON public.gmao_ordres_travail
FOR EACH ROW EXECUTE FUNCTION public.gmao_statut_equipement_ot();
