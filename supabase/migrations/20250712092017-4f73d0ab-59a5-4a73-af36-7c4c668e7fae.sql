-- Amélioration du système de documents pour les véhicules et chauffeurs
-- Ajout des champs nécessaires pour les alertes documentaires

-- Modification de la table documents pour les chauffeurs (types spécifiques et dates)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS date_delivrance DATE,
ADD COLUMN IF NOT EXISTS commentaire TEXT;

-- Mise à jour des types de documents pour véhicules
ALTER TABLE public.documents_vehicules 
ADD COLUMN IF NOT EXISTS date_delivrance DATE,
ADD COLUMN IF NOT EXISTS commentaire TEXT;

-- Fonction pour calculer automatiquement le statut des documents
CREATE OR REPLACE FUNCTION public.calculer_statut_document(date_expiration DATE)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger pour mettre à jour automatiquement le statut des documents véhicules
CREATE OR REPLACE FUNCTION public.update_document_statut()
RETURNS TRIGGER AS $$
BEGIN
  NEW.statut := public.calculer_statut_document(NEW.date_expiration);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour les documents
DROP TRIGGER IF EXISTS trigger_update_document_vehicule_statut ON public.documents_vehicules;
CREATE TRIGGER trigger_update_document_vehicule_statut
  BEFORE INSERT OR UPDATE ON public.documents_vehicules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_statut();

DROP TRIGGER IF EXISTS trigger_update_document_statut ON public.documents;
CREATE TRIGGER trigger_update_document_statut
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_statut();

-- Ajout d'un champ pour marquer si un véhicule nécessite une revalidation après mission
ALTER TABLE public.vehicules 
ADD COLUMN IF NOT EXISTS validation_requise BOOLEAN DEFAULT FALSE;

-- Fonction pour marquer un véhicule comme nécessitant une revalidation
CREATE OR REPLACE FUNCTION public.marquer_revalidation_vehicule()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la revalidation post-mission
DROP TRIGGER IF EXISTS trigger_revalidation_post_mission ON public.missions;
CREATE TRIGGER trigger_revalidation_post_mission
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.marquer_revalidation_vehicule();

-- Modifier la fonction de mise à jour du workflow pour gérer la revalidation
CREATE OR REPLACE FUNCTION public.update_workflow_statut_revalidation()
RETURNS TRIGGER AS $$
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
  
  -- Mettre à jour le statut du véhicule et la validation requise
  UPDATE public.vehicules 
  SET 
    statut = CASE 
      WHEN nouveau_statut = 'valide' THEN 'disponible'
      WHEN nouveau_statut = 'rejete' THEN 'validation_requise'
      ELSE 'validation_requise'
    END,
    validation_requise = CASE 
      WHEN nouveau_statut = 'valide' THEN FALSE
      ELSE TRUE
    END,
    updated_at = now()
  WHERE id = (SELECT vehicule_id FROM public.validation_workflows WHERE id = workflow_record.workflow_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remplacer l'ancien trigger par le nouveau
DROP TRIGGER IF EXISTS trigger_update_workflow_statut ON public.validation_etapes;
CREATE TRIGGER trigger_update_workflow_statut
  AFTER UPDATE ON public.validation_etapes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_statut_revalidation();

-- Vue pour les alertes de documents véhicules
CREATE OR REPLACE VIEW public.alertes_documents_vehicules AS
SELECT 
  dv.id,
  dv.vehicule_id,
  v.numero as vehicule_numero,
  v.immatriculation,
  dv.nom as document_nom,
  dv.type as document_type,
  dv.date_expiration,
  dv.statut,
  CASE 
    WHEN dv.date_expiration < CURRENT_DATE THEN 'expire'
    WHEN dv.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'a_renouveler'
    ELSE 'valide'
  END as niveau_alerte,
  dv.date_expiration - CURRENT_DATE as jours_restants
FROM public.documents_vehicules dv
JOIN public.vehicules v ON dv.vehicule_id = v.id
WHERE dv.date_expiration IS NOT NULL
  AND (dv.date_expiration <= (CURRENT_DATE + INTERVAL '30 days'))
ORDER BY dv.date_expiration ASC;

-- Vue pour les alertes de documents chauffeurs
CREATE OR REPLACE VIEW public.alertes_documents_chauffeurs AS
SELECT 
  d.id,
  d.chauffeur_id,
  c.nom || ' ' || c.prenom as chauffeur_nom,
  d.nom as document_nom,
  d.type as document_type,
  d.date_expiration,
  d.statut,
  CASE 
    WHEN d.date_expiration < CURRENT_DATE THEN 'expire'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'a_renouveler'
    ELSE 'valide'
  END as niveau_alerte,
  d.date_expiration - CURRENT_DATE as jours_restants
FROM public.documents d
JOIN public.chauffeurs c ON d.chauffeur_id = c.id
WHERE d.date_expiration IS NOT NULL
  AND (d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days'))
ORDER BY d.date_expiration ASC;