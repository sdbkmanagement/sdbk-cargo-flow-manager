-- Ajouter Station Total Sanoyah pour Conakry avec péréquation 90.23
INSERT INTO public.tarifs_hydrocarbures (destination, lieu_depart, tarif_au_litre, observations, numero_ordre)
VALUES ('Conakry', 'CONAKRY', 90.23, 'Client: Station Total Sanoyah', 
  (SELECT COALESCE(MAX(numero_ordre), 0) + 1 FROM public.tarifs_hydrocarbures));