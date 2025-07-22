-- Supprimer les colonnes date_heure_depart et date_heure_arrivee_prevue de la table missions
ALTER TABLE public.missions 
DROP COLUMN IF EXISTS date_heure_depart,
DROP COLUMN IF EXISTS date_heure_arrivee_prevue;