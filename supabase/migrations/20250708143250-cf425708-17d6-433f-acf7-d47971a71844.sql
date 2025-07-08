-- Étendre la table véhicules pour supporter tracteur + remorque
ALTER TABLE public.vehicules 
ADD COLUMN type_vehicule VARCHAR(50) NOT NULL DEFAULT 'porteur',
ADD COLUMN base VARCHAR(100),
ADD COLUMN integration VARCHAR(100),

-- Champs pour le tracteur
ADD COLUMN tracteur_immatriculation VARCHAR(50),
ADD COLUMN tracteur_marque VARCHAR(100),
ADD COLUMN tracteur_modele VARCHAR(100),
ADD COLUMN tracteur_configuration VARCHAR(200),
ADD COLUMN tracteur_numero_chassis VARCHAR(100),
ADD COLUMN tracteur_annee_fabrication INTEGER,
ADD COLUMN tracteur_date_mise_circulation DATE,

-- Champs pour la remorque
ADD COLUMN remorque_immatriculation VARCHAR(50),
ADD COLUMN remorque_volume_litres DECIMAL(10,2),
ADD COLUMN remorque_marque VARCHAR(100),
ADD COLUMN remorque_modele VARCHAR(100),
ADD COLUMN remorque_configuration VARCHAR(200),
ADD COLUMN remorque_numero_chassis VARCHAR(100),
ADD COLUMN remorque_annee_fabrication INTEGER,
ADD COLUMN remorque_date_mise_circulation DATE;

-- Ajouter des contraintes pour assurer la cohérence des données
ALTER TABLE public.vehicules 
ADD CONSTRAINT check_type_vehicule CHECK (type_vehicule IN ('porteur', 'tracteur_remorque')),
ADD CONSTRAINT check_tracteur_required 
  CHECK (
    (type_vehicule = 'porteur') OR 
    (type_vehicule = 'tracteur_remorque' AND tracteur_immatriculation IS NOT NULL AND remorque_immatriculation IS NOT NULL)
  );

-- Créer des index pour améliorer les performances de recherche
CREATE INDEX idx_vehicules_type_vehicule ON public.vehicules(type_vehicule);
CREATE INDEX idx_vehicules_tracteur_immat ON public.vehicules(tracteur_immatriculation) WHERE tracteur_immatriculation IS NOT NULL;
CREATE INDEX idx_vehicules_remorque_immat ON public.vehicules(remorque_immatriculation) WHERE remorque_immatriculation IS NOT NULL;
CREATE INDEX idx_vehicules_base ON public.vehicules(base) WHERE base IS NOT NULL;

-- Mettre à jour les véhicules existants pour qu'ils soient de type 'porteur'
UPDATE public.vehicules SET type_vehicule = 'porteur' WHERE type_vehicule IS NULL;