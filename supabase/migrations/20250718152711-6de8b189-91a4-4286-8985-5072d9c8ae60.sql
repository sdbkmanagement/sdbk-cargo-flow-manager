
-- Mettre à jour la table documents pour supporter l'assignation de documents sans fichier
ALTER TABLE documents 
ADD COLUMN assigne_automatiquement BOOLEAN DEFAULT FALSE,
ADD COLUMN document_requis BOOLEAN DEFAULT FALSE,
ADD COLUMN date_assignation TIMESTAMP WITH TIME ZONE;

-- Créer une table pour les types de documents requis pour les chauffeurs
CREATE TABLE IF NOT EXISTS types_documents_chauffeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR NOT NULL,
  description TEXT,
  requis_par_defaut BOOLEAN DEFAULT FALSE,
  delai_alerte_jours INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les types de documents standard
INSERT INTO types_documents_chauffeurs (nom, description, requis_par_defaut, delai_alerte_jours) VALUES
('carte_qualification_conducteur', 'Carte de qualification conducteur', TRUE, 30),
('carte_conducteur', 'Carte conducteur', TRUE, 30),
('certificat_capacite_professionnelle', 'Certificat de capacité professionnelle', TRUE, 60),
('attestation_formation', 'Attestation de formation', TRUE, 30),
('certificat_medical_aptitude', 'Certificat médical d''aptitude à la conduite', TRUE, 30),
('permis_conduire', 'Permis de conduire', TRUE, 30),
('visite_medicale', 'Visite médicale', TRUE, 365),
('autre', 'Autre document', FALSE, 30);

-- Créer une table pour le statut des chauffeurs avec historique
CREATE TABLE IF NOT EXISTS statuts_chauffeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id UUID REFERENCES chauffeurs(id) ON DELETE CASCADE,
  statut VARCHAR NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  motif TEXT,
  created_by VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer une vue pour les alertes documents chauffeurs
CREATE OR REPLACE VIEW alertes_documents_chauffeurs_v2 AS
SELECT 
  d.id,
  d.chauffeur_id,
  d.entity_id,
  c.nom || ' ' || c.prenom AS chauffeur_nom,
  d.nom AS document_nom,
  d.type AS document_type,
  d.date_expiration,
  CASE 
    WHEN d.date_expiration IS NULL AND d.document_requis = TRUE AND d.url IS NULL THEN 999
    WHEN d.date_expiration IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM d.date_expiration - CURRENT_DATE)::INTEGER
  END AS jours_restants,
  CASE 
    WHEN d.url IS NULL AND d.document_requis = TRUE THEN 'manquant'
    WHEN d.date_expiration IS NULL THEN 'valide'
    WHEN d.date_expiration < CURRENT_DATE THEN 'expire'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'a_renouveler'
    ELSE 'valide'
  END AS statut,
  CASE 
    WHEN d.url IS NULL AND d.document_requis = TRUE THEN 'URGENT - Document manquant'
    WHEN d.date_expiration < CURRENT_DATE THEN 'URGENT - Document expiré'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '7 days') THEN 'URGENT - Expire dans 7 jours'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'ATTENTION - Expire dans 30 jours'
    ELSE 'OK'
  END AS niveau_alerte
FROM documents d
LEFT JOIN chauffeurs c ON d.entity_id = c.id
WHERE d.entity_type = 'chauffeur'
AND (
  d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days')
  OR (d.url IS NULL AND d.document_requis = TRUE)
);

-- Fonction pour assigner automatiquement les documents requis aux nouveaux chauffeurs
CREATE OR REPLACE FUNCTION assigner_documents_requis_chauffeur()
RETURNS TRIGGER AS $$
BEGIN
  -- Assigner tous les documents requis par défaut
  INSERT INTO documents (
    entity_type,
    entity_id,
    nom,
    type,
    url,
    document_requis,
    assigne_automatiquement,
    date_assignation,
    statut
  )
  SELECT 
    'chauffeur',
    NEW.id,
    tdc.nom,
    tdc.nom,
    '',
    TRUE,
    TRUE,
    NOW(),
    'manquant'
  FROM types_documents_chauffeurs tdc
  WHERE tdc.requis_par_defaut = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour l'assignation automatique
DROP TRIGGER IF EXISTS trigger_assigner_documents_chauffeur ON chauffeurs;
CREATE TRIGGER trigger_assigner_documents_chauffeur
  AFTER INSERT ON chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION assigner_documents_requis_chauffeur();

-- Fonction pour vérifier la conformité d'un chauffeur
CREATE OR REPLACE FUNCTION chauffeur_est_conforme(chauffeur_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  documents_non_conformes INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO documents_non_conformes
  FROM documents d
  WHERE d.entity_id = chauffeur_id
  AND d.entity_type = 'chauffeur'
  AND d.document_requis = TRUE
  AND (
    d.url IS NULL OR d.url = '' OR
    (d.date_expiration IS NOT NULL AND d.date_expiration < CURRENT_DATE)
  );
  
  RETURN documents_non_conformes = 0;
END;
$$ LANGUAGE plpgsql;
