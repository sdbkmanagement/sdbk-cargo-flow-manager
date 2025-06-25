
-- Créer la table des chargements
CREATE TABLE public.chargements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero CHARACTER VARYING NOT NULL,
  mission_id UUID NOT NULL,
  type_chargement CHARACTER VARYING NOT NULL CHECK (type_chargement IN ('hydrocarbures', 'bauxite')),
  volume_poids NUMERIC NOT NULL,
  unite_mesure CHARACTER VARYING NOT NULL DEFAULT 'tonnes' CHECK (unite_mesure IN ('tonnes', 'litres')),
  vehicule_id UUID NOT NULL,
  chauffeur_id UUID NOT NULL,
  date_heure_chargement TIMESTAMP WITH TIME ZONE NOT NULL,
  lieu_chargement CHARACTER VARYING NOT NULL,
  lieu_livraison CHARACTER VARYING NOT NULL,
  client_nom CHARACTER VARYING NOT NULL,
  statut CHARACTER VARYING NOT NULL DEFAULT 'charge' CHECK (statut IN ('charge', 'livre', 'annule')),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by CHARACTER VARYING
);

-- Créer un index sur mission_id pour améliorer les performances
CREATE INDEX idx_chargements_mission_id ON public.chargements(mission_id);

-- Créer un index sur date_heure_chargement pour les filtres temporels
CREATE INDEX idx_chargements_date_heure ON public.chargements(date_heure_chargement);

-- Créer un index sur statut pour les filtres
CREATE INDEX idx_chargements_statut ON public.chargements(statut);

-- Fonction pour générer automatiquement le numéro de chargement
CREATE OR REPLACE FUNCTION public.generate_chargement_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.chargements WHERE numero LIKE 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Créer le trigger pour la génération automatique du numéro
CREATE TRIGGER trigger_generate_chargement_numero
  BEFORE INSERT ON public.chargements
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_chargement_numero();

-- Créer le trigger pour la mise à jour automatique du updated_at
CREATE TRIGGER trigger_update_chargements_updated_at
  BEFORE UPDATE ON public.chargements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer la table pour l'historique des chargements
CREATE TABLE public.chargements_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chargement_id UUID NOT NULL,
  action CHARACTER VARYING NOT NULL,
  ancien_statut CHARACTER VARYING,
  nouveau_statut CHARACTER VARYING,
  utilisateur_nom CHARACTER VARYING,
  utilisateur_role CHARACTER VARYING,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fonction pour ajouter automatiquement les changements à l'historique
CREATE OR REPLACE FUNCTION public.add_chargement_to_historique()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.chargements_historique (chargement_id, action, nouveau_statut, details)
    VALUES (NEW.id, 'creation', NEW.statut, 'Chargement créé');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ajouter à l'historique si le statut change
    IF OLD.statut != NEW.statut THEN
      INSERT INTO public.chargements_historique (chargement_id, action, ancien_statut, nouveau_statut, details)
      VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Créer les triggers pour l'historique
CREATE TRIGGER trigger_add_chargement_to_historique
  AFTER INSERT OR UPDATE ON public.chargements
  FOR EACH ROW
  EXECUTE FUNCTION public.add_chargement_to_historique();
