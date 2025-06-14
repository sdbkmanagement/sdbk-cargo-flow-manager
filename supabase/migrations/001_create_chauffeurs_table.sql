
-- Créer la table des chauffeurs
CREATE TABLE IF NOT EXISTS chauffeurs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  numero_permis VARCHAR(50) NOT NULL,
  type_permis TEXT[] NOT NULL DEFAULT '{}',
  date_expiration_permis DATE NOT NULL,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'conge', 'maladie', 'suspendu')),
  vehicule_assigne VARCHAR(50),
  photo_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chauffeur_id UUID REFERENCES chauffeurs(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  taille INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_chauffeurs_statut ON chauffeurs(statut);
CREATE INDEX IF NOT EXISTS idx_chauffeurs_nom ON chauffeurs(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_documents_chauffeur ON documents(chauffeur_id);

-- Créer les policies RLS (Row Level Security)
ALTER TABLE chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tous les utilisateurs authentifiés de voir et modifier les chauffeurs
CREATE POLICY "Les utilisateurs peuvent voir tous les chauffeurs" ON chauffeurs
  FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent créer des chauffeurs" ON chauffeurs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent modifier des chauffeurs" ON chauffeurs
  FOR UPDATE USING (true);

CREATE POLICY "Les utilisateurs peuvent supprimer des chauffeurs" ON chauffeurs
  FOR DELETE USING (true);

-- Policy similaire pour les documents
CREATE POLICY "Les utilisateurs peuvent voir tous les documents" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent créer des documents" ON documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent modifier des documents" ON documents
  FOR UPDATE USING (true);

CREATE POLICY "Les utilisateurs peuvent supprimer des documents" ON documents
  FOR DELETE USING (true);

-- Créer le bucket de stockage pour les documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour le stockage
CREATE POLICY "Les utilisateurs peuvent uploader des fichiers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Les utilisateurs peuvent voir les fichiers" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Les utilisateurs peuvent supprimer les fichiers" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');
