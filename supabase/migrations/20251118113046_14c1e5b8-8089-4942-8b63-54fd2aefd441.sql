
-- ============================================
-- MIGRATION : Workflow de validation automatique des véhicules
-- ============================================
-- Cette migration implémente le cycle complet de validation des véhicules
-- après chaque mission/bon de livraison

-- 1. Fonction pour créer ou réinitialiser le workflow de validation
CREATE OR REPLACE FUNCTION public.create_or_reset_validation_workflow(p_vehicule_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workflow_id UUID;
  v_existing_workflow_id UUID;
BEGIN
  -- Vérifier s'il existe déjà un workflow pour ce véhicule
  SELECT id INTO v_existing_workflow_id
  FROM public.validation_workflows
  WHERE vehicule_id = p_vehicule_id
  LIMIT 1;

  IF v_existing_workflow_id IS NOT NULL THEN
    -- Réinitialiser le workflow existant
    UPDATE public.validation_workflows
    SET 
      statut_global = 'en_validation',
      updated_at = NOW()
    WHERE id = v_existing_workflow_id;

    -- Réinitialiser toutes les étapes
    UPDATE public.validation_etapes
    SET 
      statut = 'en_attente',
      commentaire = NULL,
      date_validation = NULL,
      validateur_nom = NULL,
      validateur_role = NULL,
      updated_at = NOW()
    WHERE workflow_id = v_existing_workflow_id;

    v_workflow_id := v_existing_workflow_id;
    
    RAISE NOTICE 'Workflow % réinitialisé pour véhicule %', v_workflow_id, p_vehicule_id;
  ELSE
    -- Créer un nouveau workflow
    INSERT INTO public.validation_workflows (vehicule_id, statut_global)
    VALUES (p_vehicule_id, 'en_validation')
    RETURNING id INTO v_workflow_id;

    -- Créer les 4 étapes de validation
    INSERT INTO public.validation_etapes (workflow_id, etape, statut)
    VALUES
      (v_workflow_id, 'maintenance', 'en_attente'),
      (v_workflow_id, 'administratif', 'en_attente'),
      (v_workflow_id, 'hsecq', 'en_attente'),
      (v_workflow_id, 'obc', 'en_attente');

    RAISE NOTICE 'Nouveau workflow % créé pour véhicule %', v_workflow_id, p_vehicule_id;
  END IF;

  RETURN v_workflow_id;
END;
$$;

-- 2. Fonction trigger pour marquer le véhicule en validation après création d'un BL
CREATE OR REPLACE FUNCTION public.trigger_validation_after_bl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- Marquer le véhicule comme nécessitant une validation
  UPDATE public.vehicules
  SET 
    statut = 'validation_requise',
    validation_requise = TRUE,
    updated_at = NOW()
  WHERE id = NEW.vehicule_id;

  -- Créer ou réinitialiser le workflow de validation
  v_workflow_id := public.create_or_reset_validation_workflow(NEW.vehicule_id);

  RAISE NOTICE 'Véhicule % marqué pour validation après BL %. Workflow: %', 
    NEW.vehicule_id, NEW.numero, v_workflow_id;

  RETURN NEW;
END;
$$;

-- 3. Créer le trigger sur la table bons_livraison
DROP TRIGGER IF EXISTS trigger_validation_after_bl_insert ON public.bons_livraison;
CREATE TRIGGER trigger_validation_after_bl_insert
  AFTER INSERT ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_validation_after_bl();

-- 4. Améliorer la fonction de mise à jour du statut du workflow
CREATE OR REPLACE FUNCTION public.update_workflow_statut_vehicule()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
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
    nouveau_statut_vehicule := 'indisponible';
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
$$;

-- 5. Recréer le trigger de mise à jour du workflow
DROP TRIGGER IF EXISTS trigger_update_workflow_statut ON public.validation_etapes;
CREATE TRIGGER trigger_update_workflow_statut
  AFTER UPDATE OF statut ON public.validation_etapes
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION public.update_workflow_statut_vehicule();

-- 6. Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.create_or_reset_validation_workflow IS 
'Crée un nouveau workflow de validation ou réinitialise un workflow existant pour un véhicule. 
Cette fonction garantit que chaque mission déclenche un nouveau cycle de validation complet.';

COMMENT ON FUNCTION public.trigger_validation_after_bl IS 
'Déclenché après l''insertion d''un bon de livraison. 
Marque le véhicule comme nécessitant une validation et initialise le workflow de validation.';

COMMENT ON TRIGGER trigger_validation_after_bl_insert ON public.bons_livraison IS
'Déclenche automatiquement le processus de validation après la création d''un bon de livraison.
Le véhicule passe au statut "validation_requise" et un workflow de validation est créé/réinitialisé.';
