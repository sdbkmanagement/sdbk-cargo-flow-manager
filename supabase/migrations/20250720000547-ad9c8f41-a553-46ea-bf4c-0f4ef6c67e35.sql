
-- Corriger la fonction de calcul des jours avant expiration
CREATE OR REPLACE FUNCTION public.calculer_jours_avant_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
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

-- Mettre à jour la fonction de mise à jour du statut des documents
CREATE OR REPLACE FUNCTION public.update_document_statut()
 RETURNS trigger
 LANGUAGE plpgsql
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
