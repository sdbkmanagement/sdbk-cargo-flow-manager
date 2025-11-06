-- Synchroniser tous les véhicules avec leurs missions actives
-- Mettre en "en_mission" tous les véhicules qui ont des missions en_attente ou en_cours
UPDATE vehicules v
SET 
  statut = 'en_mission',
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM missions m 
  WHERE m.vehicule_id = v.id 
  AND m.statut IN ('en_attente', 'en_cours')
)
AND v.statut != 'en_mission';

-- Log pour vérifier
DO $$
DECLARE
  vehicules_mis_a_jour INTEGER;
BEGIN
  SELECT COUNT(*) INTO vehicules_mis_a_jour
  FROM vehicules v
  WHERE EXISTS (
    SELECT 1 FROM missions m 
    WHERE m.vehicule_id = v.id 
    AND m.statut IN ('en_attente', 'en_cours')
  );
  
  RAISE NOTICE 'Synchronisation terminée: % véhicules mis à jour', vehicules_mis_a_jour;
END $$;