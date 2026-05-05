-- Permettre plusieurs saisies de temps de conduite par chauffeur et par jour
ALTER TABLE public.obc_temps_conduite DROP CONSTRAINT IF EXISTS obc_temps_conduite_chauffeur_id_date_jour_key;