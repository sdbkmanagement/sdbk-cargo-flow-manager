-- Ajouter le tarif hydrocarbures pour Alame SARL à Conakry
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
SELECT 
  COALESCE((SELECT MAX(numero_ordre) FROM tarifs_hydrocarbures), 0) + 1,
  'Conakry',
  'Conakry Alame SARL',
  90.23,
  'Client Alame SARL - Conakry'
WHERE NOT EXISTS (
  SELECT 1 FROM tarifs_hydrocarbures WHERE destination = 'Conakry Alame SARL'
);