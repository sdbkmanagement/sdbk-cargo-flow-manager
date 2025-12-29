-- Corriger le trigger update_workflow_statut_vehicule pour utiliser 'hors_service' au lieu de 'indisponible'
CREATE OR REPLACE FUNCTION public.update_workflow_statut_vehicule()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  workflow_record RECORD;
  valides_count INTEGER;
  rejetes_count INTEGER;
  nouveau_statut VARCHAR(50);
  nouveau_statut_vehicule VARCHAR(50);
BEGIN
  -- Récupérer le workflow_id et vehicule_id
  SELECT vw.id, vw.vehicule_id INTO workflow_record 
  FROM public.validation_workflows vw
  INNER JOIN public.validation_etapes ve ON ve.workflow_id = vw.id
  WHERE ve.id = NEW.id;
  
  -- Compter les statuts des 4 étapes
  SELECT 
    COUNT(CASE WHEN statut = 'valide' THEN 1 END),
    COUNT(CASE WHEN statut = 'rejete' THEN 1 END)
  INTO valides_count, rejetes_count
  FROM public.validation_etapes 
  WHERE workflow_id = workflow_record.id;
  
  -- Déterminer le nouveau statut global
  IF rejetes_count > 0 THEN
    nouveau_statut := 'rejete';
    nouveau_statut_vehicule := 'hors_service'; -- CORRIGÉ: utiliser 'hors_service' au lieu de 'indisponible'
  ELSIF valides_count = 4 THEN
    nouveau_statut := 'valide';
    nouveau_statut_vehicule := 'disponible';
  ELSE
    nouveau_statut := 'en_validation';
    nouveau_statut_vehicule := 'validation_requise';
  END IF;
  
  -- Mettre à jour le workflow
  UPDATE public.validation_workflows 
  SET statut_global = nouveau_statut, updated_at = NOW()
  WHERE id = workflow_record.id;
  
  -- Mettre à jour le statut du véhicule
  UPDATE public.vehicules 
  SET 
    statut = nouveau_statut_vehicule,
    validation_requise = CASE 
      WHEN nouveau_statut = 'valide' THEN FALSE
      ELSE TRUE
    END,
    updated_at = NOW()
  WHERE id = workflow_record.vehicule_id;
  
  RAISE NOTICE 'Workflow % mis à jour: % (% validés, % rejetés). Véhicule %: %', 
    workflow_record.id, nouveau_statut, valides_count, rejetes_count, 
    workflow_record.vehicule_id, nouveau_statut_vehicule;
  
  RETURN NEW;
END;
$function$;