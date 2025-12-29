-- Types pour les documents société
CREATE TYPE document_societe_statut AS ENUM ('valide', 'expire', 'en_renouvellement', 'archive');

-- Table des entités/sociétés (support multi-sociétés)
CREATE TABLE public.societes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    siret VARCHAR(50),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays VARCHAR(100) DEFAULT 'Maroc',
    telephone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    statut VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des catégories de documents personnalisables
CREATE TABLE public.documents_societe_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    couleur VARCHAR(20) DEFAULT '#3b82f6',
    icone VARCHAR(50),
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer les catégories par défaut
INSERT INTO public.documents_societe_categories (nom, description, couleur, icone, ordre) VALUES
('Juridique', 'Documents juridiques et légaux', '#ef4444', 'Scale', 1),
('Fiscal', 'Documents fiscaux et comptables', '#f59e0b', 'Receipt', 2),
('Administratif', 'Documents administratifs généraux', '#3b82f6', 'FileText', 3),
('Assurance', 'Polices d''assurance et attestations', '#10b981', 'Shield', 4),
('Contrat', 'Contrats et accords', '#8b5cf6', 'FileSignature', 5),
('RH', 'Documents ressources humaines', '#ec4899', 'Users', 6),
('Technique', 'Documents techniques et certifications', '#06b6d4', 'Wrench', 7),
('Autre', 'Autres documents', '#6b7280', 'Folder', 8);

-- Table principale des documents société
CREATE TABLE public.documents_societe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    societe_id UUID REFERENCES public.societes(id) ON DELETE CASCADE,
    categorie_id UUID REFERENCES public.documents_societe_categories(id) ON DELETE SET NULL,
    nom VARCHAR(500) NOT NULL,
    type_document VARCHAR(100) NOT NULL,
    description TEXT,
    date_creation DATE DEFAULT CURRENT_DATE,
    date_delivrance DATE,
    date_expiration DATE,
    autorite_emettrice VARCHAR(255),
    numero_reference VARCHAR(100),
    commentaires TEXT,
    statut document_societe_statut DEFAULT 'valide',
    alerte_30j_envoyee BOOLEAN DEFAULT FALSE,
    alerte_15j_envoyee BOOLEAN DEFAULT FALSE,
    alerte_7j_envoyee BOOLEAN DEFAULT FALSE,
    version_actuelle INTEGER DEFAULT 1,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des fichiers attachés à un document
CREATE TABLE public.documents_societe_fichiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents_societe(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(500) NOT NULL,
    nom_original VARCHAR(500),
    url TEXT NOT NULL,
    type_mime VARCHAR(100),
    taille INTEGER,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des versions des documents (historique)
CREATE TABLE public.documents_societe_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents_societe(id) ON DELETE CASCADE,
    numero_version INTEGER NOT NULL,
    nom VARCHAR(500),
    description TEXT,
    fichiers JSONB,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_par UUID,
    modifie_par_nom VARCHAR(255),
    motif_modification TEXT
);

-- Journal d'audit des actions sur les documents
CREATE TABLE public.documents_societe_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents_societe(id) ON DELETE SET NULL,
    societe_id UUID REFERENCES public.societes(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    utilisateur_id UUID,
    utilisateur_nom VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.societes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_societe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_societe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_societe_fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_societe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_societe_audit ENABLE ROW LEVEL SECURITY;

-- Policies pour societes
CREATE POLICY "Admins peuvent gérer les sociétés"
ON public.societes FOR ALL
USING (current_user_has_role('admin'::user_role) OR current_user_has_role('direction'::user_role))
WITH CHECK (current_user_has_role('admin'::user_role) OR current_user_has_role('direction'::user_role));

CREATE POLICY "Utilisateurs actifs peuvent voir les sociétés"
ON public.societes FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active'));

-- Policies pour catégories
CREATE POLICY "Tous peuvent voir les catégories"
ON public.documents_societe_categories FOR SELECT
USING (true);

CREATE POLICY "Admins peuvent gérer les catégories"
ON public.documents_societe_categories FOR ALL
USING (current_user_has_role('admin'::user_role))
WITH CHECK (current_user_has_role('admin'::user_role));

-- Policies pour documents société
CREATE POLICY "Utilisateurs autorisés peuvent gérer les documents société"
ON public.documents_societe FOR ALL
USING (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
)
WITH CHECK (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
);

CREATE POLICY "Utilisateurs actifs peuvent voir les documents société"
ON public.documents_societe FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active'));

-- Policies pour fichiers
CREATE POLICY "Utilisateurs autorisés peuvent gérer les fichiers documents société"
ON public.documents_societe_fichiers FOR ALL
USING (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
)
WITH CHECK (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
);

CREATE POLICY "Utilisateurs actifs peuvent voir les fichiers"
ON public.documents_societe_fichiers FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active'));

-- Policies pour versions
CREATE POLICY "Utilisateurs autorisés peuvent gérer les versions"
ON public.documents_societe_versions FOR ALL
USING (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
)
WITH CHECK (
    current_user_has_role('admin'::user_role) OR 
    current_user_has_role('direction'::user_role) OR 
    current_user_has_role('administratif'::user_role)
);

CREATE POLICY "Utilisateurs actifs peuvent voir les versions"
ON public.documents_societe_versions FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active'));

-- Policies pour audit
CREATE POLICY "Admins peuvent voir l'audit"
ON public.documents_societe_audit FOR SELECT
USING (current_user_has_role('admin'::user_role) OR current_user_has_role('direction'::user_role));

CREATE POLICY "Insertion audit autorisée pour utilisateurs authentifiés"
ON public.documents_societe_audit FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fonction pour calculer le statut automatique
CREATE OR REPLACE FUNCTION public.calculer_statut_document_societe()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_expiration IS NULL THEN
        NEW.statut := 'valide';
    ELSIF NEW.date_expiration < CURRENT_DATE THEN
        NEW.statut := 'expire';
    ELSE
        NEW.statut := 'valide';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour mise à jour automatique du statut
CREATE TRIGGER update_document_societe_statut
    BEFORE INSERT OR UPDATE ON public.documents_societe
    FOR EACH ROW
    EXECUTE FUNCTION public.calculer_statut_document_societe();

-- Trigger pour updated_at
CREATE TRIGGER update_documents_societe_updated_at
    BEFORE UPDATE ON public.documents_societe
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_societes_updated_at
    BEFORE UPDATE ON public.societes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer une société par défaut (SDBK)
INSERT INTO public.societes (nom, statut) VALUES ('SDBK', 'active');