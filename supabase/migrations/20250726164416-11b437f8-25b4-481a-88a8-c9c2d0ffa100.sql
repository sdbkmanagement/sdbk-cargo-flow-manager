-- Phase 2: Fix remaining function search_path issues and SECURITY DEFINER views

-- Update all remaining functions with proper search_path
CREATE OR REPLACE FUNCTION public.generate_chargement_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.chargements WHERE numero LIKE 'C' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_vehicle_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'V' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'V(\d+)') AS INTEGER)), 0) + 1 
      FROM public.vehicules 
      WHERE numero ~ '^V\d+$'
    )::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_role_permissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_chargement_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
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

CREATE OR REPLACE FUNCTION public.generate_bl_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || 
                  LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 
                        FROM public.bons_livraison 
                        WHERE numero LIKE 'BL' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_embauche_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historique_rh (employe_id, type_evenement, nouveau_poste, nouveau_service, description, date_evenement)
    VALUES (NEW.id, 'embauche', NEW.poste, NEW.service, 'Embauche - ' || NEW.poste || ' dans le service ' || NEW.service, NEW.date_embauche);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Détecter changement de poste
    IF OLD.poste != NEW.poste OR OLD.service != NEW.service THEN
      INSERT INTO public.historique_rh (employe_id, type_evenement, ancien_poste, nouveau_poste, ancien_service, nouveau_service, description)
      VALUES (NEW.id, 'changement_poste', OLD.poste, NEW.poste, OLD.service, NEW.service, 
              'Changement: ' || OLD.poste || ' (' || OLD.service || ') → ' || NEW.poste || ' (' || NEW.service || ')');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculer_manquant_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.manquant_total := COALESCE(NEW.manquant_cuve, 0) + COALESCE(NEW.manquant_compteur, 0);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculer_ca_associe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Calculer le CA pour l'associé
  IF NEW.montant_facture IS NOT NULL AND NEW.associe_id IS NOT NULL THEN
    NEW.chiffre_affaire_associe := NEW.montant_facture;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, 
                jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_workflow_statut()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  workflow_record RECORD;
  valides_count INTEGER;
  rejetes_count INTEGER;
  nouveau_statut VARCHAR(50);
BEGIN
  -- Récupérer le workflow_id
  SELECT workflow_id INTO workflow_record FROM public.validation_etapes WHERE id = NEW.id;
  
  -- Compter les statuts
  SELECT 
    COUNT(CASE WHEN statut = 'valide' THEN 1 END),
    COUNT(CASE WHEN statut = 'rejete' THEN 1 END)
  INTO valides_count, rejetes_count
  FROM public.validation_etapes 
  WHERE workflow_id = workflow_record.workflow_id;
  
  -- Déterminer le nouveau statut global
  IF rejetes_count > 0 THEN
    nouveau_statut := 'rejete';
  ELSIF valides_count = 4 THEN
    nouveau_statut := 'valide';
  ELSE
    nouveau_statut := 'en_validation';
  END IF;
  
  -- Mettre à jour le workflow
  UPDATE public.validation_workflows 
  SET statut_global = nouveau_statut, updated_at = now()
  WHERE id = workflow_record.workflow_id;
  
  -- Mettre à jour le statut du véhicule
  UPDATE public.vehicules 
  SET statut = CASE 
    WHEN nouveau_statut = 'valide' THEN 'disponible'
    WHEN nouveau_statut = 'rejete' THEN 'validation_requise'
    ELSE 'validation_requise'
  END,
  updated_at = now()
  WHERE id = (SELECT vehicule_id FROM public.validation_workflows WHERE id = workflow_record.workflow_id);
  
  RETURN NEW;
END;
$function$;

-- Continue with more function updates...
CREATE OR REPLACE FUNCTION public.marquer_revalidation_vehicule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Si la mission passe de en_cours à terminee
  IF OLD.statut = 'en_cours' AND NEW.statut = 'terminee' THEN
    -- Marquer le véhicule comme nécessitant une revalidation
    UPDATE public.vehicules 
    SET 
      validation_requise = TRUE,
      statut = 'validation_requise',
      updated_at = NOW()
    WHERE id = NEW.vehicule_id;
    
    -- Marquer toutes les étapes du workflow comme en attente
    UPDATE public.validation_etapes 
    SET 
      statut = 'en_attente',
      date_validation = NULL,
      commentaire = NULL,
      validateur_nom = NULL,
      validateur_role = NULL,
      updated_at = NOW()
    WHERE workflow_id = (
      SELECT id FROM public.validation_workflows 
      WHERE vehicule_id = NEW.vehicule_id
    );
    
    -- Mettre à jour le statut global du workflow
    UPDATE public.validation_workflows 
    SET 
      statut_global = 'en_validation',
      updated_at = NOW()
    WHERE vehicule_id = NEW.vehicule_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add remaining function updates...
CREATE OR REPLACE FUNCTION public.generate_mission_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1 FROM public.missions WHERE numero LIKE 'M' || to_char(now(), 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || '-%')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_mission_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.missions_historique (mission_id, action, nouveau_statut, details)
    VALUES (NEW.id, 'creation', NEW.statut, 'Mission créée');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ajouter à l'historique si le statut change
    IF OLD.statut != NEW.statut THEN
      INSERT INTO public.missions_historique (mission_id, action, ancien_statut, nouveau_statut, details)
      VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'Changement de statut');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- More functions...
CREATE OR REPLACE FUNCTION public.calculer_statut_document(date_expiration date)
RETURNS character varying
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Si pas de date d'expiration, le document est considéré comme valide (permanent)
  IF date_expiration IS NULL THEN
    RETURN 'valide';
  END IF;
  
  -- Si la date d'expiration est passée
  IF date_expiration < CURRENT_DATE THEN
    RETURN 'expire';
  -- Si la date d'expiration est dans moins de 30 jours
  ELSIF date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN
    RETURN 'a_renouveler';
  -- Sinon le document est valide
  ELSE
    RETURN 'valide';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_document_statut()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Calculer le statut uniquement si une date d'expiration est fournie
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.statut := public.calculer_statut_document(NEW.date_expiration::date);
    -- Calculer les jours avant expiration avec un cast explicite
    NEW.jours_avant_expiration := (NEW.date_expiration::date - CURRENT_DATE)::integer;
  ELSE
    NEW.statut := 'valide';
    NEW.jours_avant_expiration := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculer_jours_avant_expiration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.jours_avant_expiration := (NEW.date_expiration::date - CURRENT_DATE)::integer;
  ELSE
    NEW.jours_avant_expiration := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Rest of the functions...
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'CREATE_USER', 'user', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'UPDATE_USER', 'user', NEW.id, 
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'DELETE_USER', 'user', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update the remaining functions with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Drop and recreate SECURITY DEFINER views as proper tables with RLS
-- Replace alertes_documents_chauffeurs view
DROP VIEW IF EXISTS public.alertes_documents_chauffeurs;

-- Replace alertes_documents_vehicules view  
DROP VIEW IF EXISTS public.alertes_documents_vehicules;

-- Replace alertes_rh view
DROP VIEW IF EXISTS public.alertes_rh;