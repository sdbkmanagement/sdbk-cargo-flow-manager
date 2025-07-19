
-- Corriger la fonction calculer_statut_document qui cause l'erreur PostgreSQL
DROP FUNCTION IF EXISTS public.calculer_statut_document(date);

CREATE OR REPLACE FUNCTION public.calculer_statut_document(date_expiration date)
RETURNS character varying
LANGUAGE plpgsql
AS $function$
BEGIN
  IF date_expiration IS NULL THEN
    RETURN 'valide';
  END IF;
  
  IF date_expiration < CURRENT_DATE THEN
    RETURN 'expire';
  ELSIF date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN
    RETURN 'a_renouveler';
  ELSE
    RETURN 'valide';
  END IF;
END;
$function$;

-- Supprimer le trigger problématique s'il existe
DROP TRIGGER IF EXISTS update_document_statut_trigger ON documents;

-- Recréer le trigger avec la fonction corrigée
CREATE TRIGGER update_document_statut_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_statut();
