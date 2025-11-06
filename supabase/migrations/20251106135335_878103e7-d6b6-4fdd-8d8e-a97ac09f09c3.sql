-- Corriger la fonction pour ajouter le search_path sécurisé
CREATE OR REPLACE FUNCTION update_vehicule_status_on_mission()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la mission passe en_attente ou en_cours, marquer le véhicule comme en_mission
  IF (NEW.statut IN ('en_attente', 'en_cours')) THEN
    UPDATE vehicules
    SET 
      statut = 'en_mission',
      updated_at = NOW()
    WHERE id = NEW.vehicule_id;
    
    RAISE NOTICE 'Véhicule % mis en mission pour mission %', NEW.vehicule_id, NEW.numero;
  
  -- Si la mission est terminée ou annulée, marquer le véhicule pour validation
  ELSIF (NEW.statut IN ('terminee', 'annulee')) THEN
    UPDATE vehicules
    SET 
      statut = 'validation_requise',
      validation_requise = true,
      updated_at = NOW()
    WHERE id = NEW.vehicule_id;
    
    RAISE NOTICE 'Véhicule % marqué pour validation après mission %', NEW.vehicule_id, NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp';

COMMENT ON FUNCTION update_vehicule_status_on_mission() IS 
'Met à jour automatiquement le statut du véhicule en fonction du statut de la mission:
- en_attente/en_cours -> véhicule en_mission
- terminee/annulee -> véhicule validation_requise';