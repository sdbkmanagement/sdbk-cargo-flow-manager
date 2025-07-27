
-- Ajouter les colonnes manquantes pour l'import de véhicules tracteur+remorque
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS configuration_remorque TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS proprietaire_nom TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS proprietaire_prenom TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_immatriculation TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_immatriculation TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_marque TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_modele TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_configuration TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_numero_chassis TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_date_fabrication DATE;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS tracteur_date_mise_circulation DATE;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_volume_litres NUMERIC;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_marque TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_modele TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_numero_chassis TEXT;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_date_fabrication DATE;
ALTER TABLE public.vehicules ADD COLUMN IF NOT EXISTS remorque_date_mise_circulation DATE;

-- Ajouter une colonne pour le chiffre d'affaires dans la table des factures si elle n'existe pas
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS chiffre_affaire_associe NUMERIC DEFAULT 0;
