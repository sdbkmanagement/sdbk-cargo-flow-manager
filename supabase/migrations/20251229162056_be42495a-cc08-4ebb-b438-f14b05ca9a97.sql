-- Fix: supprimer la contrainte obsolete qui interdit 'hors_service' et 'en_validation'
-- (une autre contrainte 'check_statut_vehicule' existe déjà avec la liste complète)
ALTER TABLE public.vehicules
DROP CONSTRAINT IF EXISTS vehicules_statut_check;