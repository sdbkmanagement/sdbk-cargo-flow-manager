-- Ajouter une colonne pour stocker les numéros de BL manuels dans les missions
ALTER TABLE public.missions 
ADD COLUMN numeros_bl_manuels text[] DEFAULT '{}';

COMMENT ON COLUMN public.missions.numeros_bl_manuels IS 'Liste des numéros de BL saisis manuellement lors de la création de la mission';
