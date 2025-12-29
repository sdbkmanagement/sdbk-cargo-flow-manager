-- Ajout du tarif pour Henanchine à Boke
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES (
  (SELECT COALESCE(MAX(numero_ordre), 0) + 1 FROM tarifs_hydrocarbures WHERE lieu_depart = 'CONAKRY'),
  'CONAKRY',
  'Boke - Henanchine',
  286.69,
  'Client Henanchine - Boke'
);