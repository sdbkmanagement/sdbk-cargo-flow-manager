INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES 
  (1, 'Conakry', 'PL Dapilon CDP Henanchine', 286.69, 'Destination Boke'),
  (2, 'Conakry', 'Bonagui', 90.23, 'Destination Conakry'),
  (3, 'Conakry', 'PL Videri Kouroussa', 750.61, 'Destination Kouroussa'),
  (4, 'Conakry', 'PL Chec Lalafangni', 161.73, 'Destination Boffa'),
  (5, 'Conakry', 'Station Total Hamdallaye Carrefour', 90.23, 'Destination Conakry'),
  (6, 'Conakry', 'Station Matoto Marche', 90.23, 'Destination Conakry')
ON CONFLICT DO NOTHING;