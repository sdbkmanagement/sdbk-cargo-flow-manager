
-- Corriger complètement la fonction trigger pour éviter l'erreur EXTRACT
CREATE OR REPLACE FUNCTION public.update_document_statut()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculer le statut uniquement si une date d'expiration est fournie
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.statut := public.calculer_statut_document(NEW.date_expiration);
    -- Calculer les jours avant expiration avec un cast explicite
    NEW.jours_avant_expiration := (NEW.date_expiration - CURRENT_DATE)::integer;
  ELSE
    NEW.statut := 'valide';
    NEW.jours_avant_expiration := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;
