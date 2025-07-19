
-- Ajouter les nouvelles colonnes à la table chauffeurs
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS matricule VARCHAR,
ADD COLUMN IF NOT EXISTS id_conducteur VARCHAR,
ADD COLUMN IF NOT EXISTS immatricule_cnss VARCHAR,
ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR,
ADD COLUMN IF NOT EXISTS groupe_sanguin VARCHAR,
ADD COLUMN IF NOT EXISTS filiation TEXT,
ADD COLUMN IF NOT EXISTS statut_matrimonial VARCHAR,
ADD COLUMN IF NOT EXISTS fonction VARCHAR,
ADD COLUMN IF NOT EXISTS base_chauffeur VARCHAR,
ADD COLUMN IF NOT EXISTS date_embauche DATE,
ADD COLUMN IF NOT EXISTS nationalite VARCHAR,
ADD COLUMN IF NOT EXISTS urgence_nom VARCHAR,
ADD COLUMN IF NOT EXISTS urgence_prenom VARCHAR,
ADD COLUMN IF NOT EXISTS urgence_telephone VARCHAR,
ADD COLUMN IF NOT EXISTS date_obtention_permis DATE,
ADD COLUMN IF NOT EXISTS type_contrat VARCHAR DEFAULT 'CDI',
ADD COLUMN IF NOT EXISTS contrat_url TEXT;

-- Ajouter un commentaire pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.chauffeurs.age IS 'Âge calculé automatiquement depuis la date de naissance';
COMMENT ON COLUMN public.chauffeurs.nationalite IS 'Nationalité du chauffeur';
COMMENT ON COLUMN public.chauffeurs.urgence_nom IS 'Nom de la personne à contacter en cas d''urgence';
COMMENT ON COLUMN public.chauffeurs.urgence_prenom IS 'Prénom de la personne à contacter en cas d''urgence';
COMMENT ON COLUMN public.chauffeurs.urgence_telephone IS 'Téléphone de la personne à contacter en cas d''urgence';
COMMENT ON COLUMN public.chauffeurs.date_obtention_permis IS 'Date d''obtention du permis de conduire';
COMMENT ON COLUMN public.chauffeurs.type_contrat IS 'Type de contrat : CDI, CDD, CA';
COMMENT ON COLUMN public.chauffeurs.contrat_url IS 'URL du contrat signé uploadé';
