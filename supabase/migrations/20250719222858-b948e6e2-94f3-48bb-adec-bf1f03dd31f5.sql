
-- Corriger la fonction de calcul de statut des documents
CREATE OR REPLACE FUNCTION public.calculer_statut_document(date_expiration date)
 RETURNS character varying
 LANGUAGE plpgsql
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

-- Corriger le trigger pour éviter les erreurs de calcul
CREATE OR REPLACE FUNCTION public.update_document_statut()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculer le statut uniquement si une date d'expiration est fournie
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.statut := public.calculer_statut_document(NEW.date_expiration);
  ELSE
    NEW.statut := 'valide';
  END IF;
  
  -- Calculer les jours avant expiration si applicable
  IF NEW.date_expiration IS NOT NULL THEN
    NEW.jours_avant_expiration := EXTRACT(DAY FROM (NEW.date_expiration - CURRENT_DATE));
  ELSE
    NEW.jours_avant_expiration := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;
