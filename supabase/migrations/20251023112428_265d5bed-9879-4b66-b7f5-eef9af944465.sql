-- Rendre la colonne URL nullable dans la table documents
-- Cela permet de créer des entrées de documents sans fichier
-- (utile pour noter les dates d'expiration à venir)
ALTER TABLE public.documents 
ALTER COLUMN url DROP NOT NULL;

-- Mettre à jour les contraintes de validation
-- Un document doit avoir au moins un nom ou une URL
ALTER TABLE public.documents 
ADD CONSTRAINT documents_has_content 
CHECK (
  (nom IS NOT NULL AND nom != '') OR 
  (url IS NOT NULL AND url != '')
);