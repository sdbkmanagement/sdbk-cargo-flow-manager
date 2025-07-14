
-- Vérifier et corriger la contrainte sur le statut des véhicules
-- D'abord, supprimons l'ancienne contrainte si elle existe
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS check_statut_vehicule;

-- Créer une nouvelle contrainte avec les bons statuts
ALTER TABLE public.vehicules ADD CONSTRAINT check_statut_vehicule 
CHECK (statut IN ('disponible', 'en_mission', 'maintenance', 'validation_requise', 'hors_service', 'en_validation'));

-- Mettre à jour la fonction de trigger pour gérer correctement les statuts
CREATE OR REPLACE FUNCTION public.update_workflow_statut_vehicule()
RETURNS trigger
LANGUAGE plpgsql
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
  
  -- Compter les statuts
  SELECT 
    COUNT(CASE WHEN statut = 'valide' THEN 1 END),
    COUNT(CASE WHEN statut = 'rejete' THEN 1 END)
  INTO valides_count, rejetes_count
  FROM public.validation_etapes 
  WHERE workflow_id = workflow_record.id;
  
  -- Déterminer le nouveau statut global
  IF rejetes_count > 0 THEN
    nouveau_statut := 'rejete';
    nouveau_statut_vehicule := 'validation_requise';
  ELSIF valides_count = 4 THEN
    nouveau_statut := 'valide';
    nouveau_statut_vehicule := 'disponible';
  ELSE
    nouveau_statut := 'en_validation';
    nouveau_statut_vehicule := 'validation_requise';
  END IF;
  
  -- Mettre à jour le workflow
  UPDATE public.validation_workflows 
  SET statut_global = nouveau_statut, updated_at = now()
  WHERE id = workflow_record.id;
  
  -- Mettre à jour le statut du véhicule
  UPDATE public.vehicules 
  SET 
    statut = nouveau_statut_vehicule,
    validation_requise = CASE 
      WHEN nouveau_statut = 'valide' THEN FALSE
      ELSE TRUE
    END,
    updated_at = now()
  WHERE id = workflow_record.vehicule_id;
  
  RETURN NEW;
END;
$function$;

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS trigger_update_workflow_statut ON public.validation_etapes;
CREATE TRIGGER trigger_update_workflow_statut
  AFTER UPDATE OF statut ON public.validation_etapes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_statut_vehicule();
