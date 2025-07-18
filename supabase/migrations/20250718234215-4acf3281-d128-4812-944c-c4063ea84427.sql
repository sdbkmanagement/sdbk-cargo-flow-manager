
-- Mise à jour de la table vehicules pour supporter les nouveaux champs du formulaire

-- Ajouter les champs de dates de fabrication (remplacer annee_fabrication par date_fabrication)
ALTER TABLE public.vehicules 
ADD COLUMN IF NOT EXISTS tracteur_date_fabrication DATE,
ADD COLUMN IF NOT EXISTS remorque_date_fabrication DATE,
ADD COLUMN IF NOT EXISTS date_fabrication DATE;

-- Supprimer les anciennes colonnes d'année si elles existent
ALTER TABLE public.vehicules 
DROP COLUMN IF EXISTS tracteur_annee_fabrication,
DROP COLUMN IF EXISTS remorque_annee_fabrication,
DROP COLUMN IF EXISTS annee_fabrication;

-- Assurer que les champs obligatoires ont des valeurs par défaut appropriées
ALTER TABLE public.vehicules 
ALTER COLUMN type_transport SET DEFAULT 'hydrocarbures',
ALTER COLUMN type_vehicule SET DEFAULT 'porteur',
ALTER COLUMN statut SET DEFAULT 'validation_requise';

-- Mettre à jour les contraintes pour les champs obligatoires
ALTER TABLE public.vehicules 
ALTER COLUMN numero SET NOT NULL,
ALTER COLUMN type_transport SET NOT NULL,
ALTER COLUMN type_vehicule SET NOT NULL,
ALTER COLUMN statut SET NOT NULL;

-- Créer une fonction pour générer automatiquement les numéros de véhicules
CREATE OR REPLACE FUNCTION public.generate_vehicle_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'V' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'V(\d+)') AS INTEGER)), 0) + 1 
      FROM public.vehicules 
      WHERE numero ~ '^V\d+$'
    )::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la génération automatique des numéros
DROP TRIGGER IF EXISTS generate_numero_before_insert ON public.vehicules;
CREATE TRIGGER generate_numero_before_insert
  BEFORE INSERT ON public.vehicules
  FOR EACH ROW EXECUTE FUNCTION generate_vehicle_numero();

-- Créer une table pour stocker les documents des véhicules avec dates d'expiration
CREATE TABLE IF NOT EXISTS public.documents_vehicules_temp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  url TEXT,
  date_expiration DATE,
  has_expiration BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_documents_vehicules_temp_vehicule_id ON public.documents_vehicules_temp(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicules_temp_expiration ON public.documents_vehicules_temp(date_expiration) WHERE has_expiration = TRUE;

-- RLS pour la table des documents
ALTER TABLE public.documents_vehicules_temp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on documents_vehicules_temp" 
  ON public.documents_vehicules_temp FOR ALL USING (true) WITH CHECK (true);
