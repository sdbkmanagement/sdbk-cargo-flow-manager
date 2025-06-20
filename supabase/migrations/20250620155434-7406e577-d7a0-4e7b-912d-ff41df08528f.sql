
-- Création de la table vehicules avec tous les champs requis
CREATE TABLE IF NOT EXISTS public.vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  immatriculation VARCHAR(20) NOT NULL UNIQUE,
  marque VARCHAR(100) NOT NULL,
  modele VARCHAR(100) NOT NULL,
  type_transport VARCHAR(50) NOT NULL CHECK (type_transport IN ('hydrocarbures', 'bauxite')),
  statut VARCHAR(50) NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'en_mission', 'maintenance', 'validation_requise')),
  capacite_max DECIMAL(10,2),
  unite_capacite VARCHAR(20),
  type_carburant VARCHAR(50),
  date_mise_service DATE,
  kilometrage INTEGER DEFAULT 0,
  annee_fabrication INTEGER,
  numero_chassis VARCHAR(100),
  consommation_moyenne DECIMAL(5,2),
  chauffeur_assigne UUID REFERENCES public.chauffeurs(id),
  derniere_maintenance DATE,
  prochaine_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table documents_vehicules pour gérer tous les documents
CREATE TABLE IF NOT EXISTS public.documents_vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  taille INTEGER,
  date_expiration DATE,
  statut VARCHAR(50) DEFAULT 'valide' CHECK (statut IN ('valide', 'expire', 'a_renouveler')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table maintenance_vehicules pour l'historique complet
CREATE TABLE IF NOT EXISTS public.maintenance_vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  type_maintenance VARCHAR(100) NOT NULL,
  date_maintenance DATE NOT NULL,
  kilometrage_maintenance INTEGER,
  description TEXT,
  cout DECIMAL(10,2),
  garage VARCHAR(200),
  pieces_changees TEXT[],
  prochaine_maintenance_prevue DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_vehicules_immatriculation ON public.vehicules(immatriculation);
CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON public.vehicules(statut);
CREATE INDEX IF NOT EXISTS idx_vehicules_type_transport ON public.vehicules(type_transport);
CREATE INDEX IF NOT EXISTS idx_documents_vehicules_vehicule_id ON public.documents_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicules_type ON public.documents_vehicules(type);
CREATE INDEX IF NOT EXISTS idx_documents_vehicules_expiration ON public.documents_vehicules(date_expiration);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicules_vehicule_id ON public.maintenance_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicules_date ON public.maintenance_vehicules(date_maintenance);

-- Trigger pour mettre à jour updated_at automatiquement
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicules_updated_at') THEN
        CREATE TRIGGER update_vehicules_updated_at 
            BEFORE UPDATE ON public.vehicules 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Policies RLS (Row Level Security) - permissives pour le moment
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_vehicules ENABLE ROW LEVEL SECURITY;

-- Policies temporaires permissives (sans IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicules' AND policyname = 'Allow all operations on vehicules') THEN
        CREATE POLICY "Allow all operations on vehicules" ON public.vehicules FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents_vehicules' AND policyname = 'Allow all operations on documents_vehicules') THEN
        CREATE POLICY "Allow all operations on documents_vehicules" ON public.documents_vehicules FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_vehicules' AND policyname = 'Allow all operations on maintenance_vehicules') THEN
        CREATE POLICY "Allow all operations on maintenance_vehicules" ON public.maintenance_vehicules FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;
