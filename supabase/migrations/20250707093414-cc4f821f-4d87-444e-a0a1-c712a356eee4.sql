
-- Ajouter les colonnes manquantes à la table documents pour le système générique
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'valide',
ADD COLUMN IF NOT EXISTS date_expiration DATE;

-- Migrer les données existantes (si il y en a)
UPDATE public.documents 
SET entity_type = 'chauffeur', entity_id = chauffeur_id 
WHERE chauffeur_id IS NOT NULL AND entity_type IS NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);

-- Optionnel: supprimer l'ancienne colonne chauffeur_id après migration
-- ALTER TABLE public.documents DROP COLUMN IF EXISTS chauffeur_id;
