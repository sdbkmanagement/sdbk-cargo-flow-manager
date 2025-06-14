
-- Créer une table pour les véhicules
CREATE TABLE public.vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  marque VARCHAR(100) NOT NULL,
  modele VARCHAR(100) NOT NULL,
  immatriculation VARCHAR(20) NOT NULL UNIQUE,
  type_transport VARCHAR(20) NOT NULL CHECK (type_transport IN ('hydrocarbures', 'bauxite')),
  statut VARCHAR(30) NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'en_mission', 'maintenance', 'validation_requise')),
  derniere_maintenance DATE,
  prochaine_maintenance DATE,
  chauffeur_assigne UUID REFERENCES public.chauffeurs(id),
  capacite_max DECIMAL(10,2),
  unite_capacite VARCHAR(20),
  annee_fabrication INTEGER,
  numero_chassis VARCHAR(100),
  consommation_moyenne DECIMAL(5,2),
  kilometrage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les documents des véhicules
CREATE TABLE public.documents_vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE CASCADE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  date_expiration DATE,
  statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'expire', 'a_renouveler')),
  taille INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour l'historique de maintenance
CREATE TABLE public.maintenance_vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE CASCADE NOT NULL,
  type_maintenance VARCHAR(50) NOT NULL,
  description TEXT,
  date_maintenance DATE NOT NULL,
  cout DECIMAL(10,2),
  garage VARCHAR(255),
  pieces_changees TEXT[],
  kilometrage_maintenance INTEGER,
  prochaine_maintenance_prevue DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_vehicules ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les véhicules (accessible à tous les utilisateurs authentifiés)
CREATE POLICY "Tous les utilisateurs peuvent voir les véhicules" 
  ON public.vehicules 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent créer des véhicules" 
  ON public.vehicules 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilisateurs autorisés peuvent modifier les véhicules" 
  ON public.vehicules 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent supprimer les véhicules" 
  ON public.vehicules 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Politiques RLS pour les documents des véhicules
CREATE POLICY "Tous les utilisateurs peuvent voir les documents des véhicules" 
  ON public.documents_vehicules 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent créer des documents de véhicules" 
  ON public.documents_vehicules 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilisateurs autorisés peuvent modifier les documents de véhicules" 
  ON public.documents_vehicules 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent supprimer les documents de véhicules" 
  ON public.documents_vehicules 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Politiques RLS pour la maintenance des véhicules
CREATE POLICY "Tous les utilisateurs peuvent voir la maintenance des véhicules" 
  ON public.maintenance_vehicules 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent créer des maintenances" 
  ON public.maintenance_vehicules 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilisateurs autorisés peuvent modifier les maintenances" 
  ON public.maintenance_vehicules 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs autorisés peuvent supprimer les maintenances" 
  ON public.maintenance_vehicules 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Créer des index pour optimiser les performances
CREATE INDEX idx_vehicules_statut ON public.vehicules(statut);
CREATE INDEX idx_vehicules_type_transport ON public.vehicules(type_transport);
CREATE INDEX idx_vehicules_chauffeur_assigne ON public.vehicules(chauffeur_assigne);
CREATE INDEX idx_documents_vehicules_vehicule_id ON public.documents_vehicules(vehicule_id);
CREATE INDEX idx_maintenance_vehicules_vehicule_id ON public.maintenance_vehicules(vehicule_id);
CREATE INDEX idx_maintenance_vehicules_date ON public.maintenance_vehicules(date_maintenance);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicules_updated_at 
  BEFORE UPDATE ON public.vehicules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
