CREATE OR REPLACE FUNCTION public.calculer_statut_document_societe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.date_expiration IS NULL THEN
        IF NEW.statut = 'archive' THEN
            NEW.statut := 'archive';
        ELSE
            NEW.statut := 'valide';
        END IF;
    ELSIF NEW.date_expiration < CURRENT_DATE THEN
        NEW.statut := 'archive';
    ELSE
        IF NEW.statut = 'archive' THEN
            NEW.statut := 'archive';
        ELSE
            NEW.statut := 'valide';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;