
-- Créer le type énuméré user_role s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'transport', 
        'maintenance',
        'rh',
        'administratif',
        'hsecq',
        'obc',
        'facturation',
        'direction',
        'transitaire',
        'directeur_exploitation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vérifier et corriger la structure de la table users si nécessaire
ALTER TABLE public.users 
ALTER COLUMN roles SET DEFAULT ARRAY['transport']::user_role[];

-- S'assurer que la contrainte de colonne roles est correcte
DO $$ 
BEGIN
    -- Essayer de modifier le type de la colonne roles
    ALTER TABLE public.users ALTER COLUMN roles TYPE user_role[] USING roles::text[]::user_role[];
EXCEPTION
    WHEN OTHERS THEN
        -- Si ça échoue, recréer la colonne
        ALTER TABLE public.users DROP COLUMN IF EXISTS roles CASCADE;
        ALTER TABLE public.users ADD COLUMN roles user_role[] NOT NULL DEFAULT ARRAY['transport']::user_role[];
END $$;
