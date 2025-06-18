
-- Créer la table pour les clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR NOT NULL,
  societe VARCHAR,
  contact VARCHAR,
  email VARCHAR,
  adresse TEXT,
  ville VARCHAR,
  code_postal VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les factures
CREATE TABLE public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  client_nom VARCHAR NOT NULL,
  client_societe VARCHAR,
  client_contact VARCHAR,
  client_email VARCHAR,
  mission_numero VARCHAR,
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  chauffeur VARCHAR,
  vehicule VARCHAR,
  type_transport VARCHAR,
  montant_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  montant_tva DECIMAL(10,2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
  statut VARCHAR NOT NULL DEFAULT 'en_attente',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les lignes de facture
CREATE TABLE public.facture_lignes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES public.factures(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite DECIMAL(10,2) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les devis
CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR NOT NULL UNIQUE,
  client_nom VARCHAR NOT NULL,
  client_societe VARCHAR,
  client_email VARCHAR,
  description TEXT NOT NULL,
  date_creation DATE NOT NULL,
  date_validite DATE NOT NULL,
  montant_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  montant_tva DECIMAL(10,2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
  statut VARCHAR NOT NULL DEFAULT 'en_attente',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facture_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS permissives pour le développement
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on factures" ON public.factures FOR ALL USING (true);
CREATE POLICY "Allow all operations on facture_lignes" ON public.facture_lignes FOR ALL USING (true);
CREATE POLICY "Allow all operations on devis" ON public.devis FOR ALL USING (true);

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
