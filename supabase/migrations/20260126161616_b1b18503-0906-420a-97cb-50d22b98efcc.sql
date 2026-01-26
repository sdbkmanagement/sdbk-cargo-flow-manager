-- Ajouter les nouveaux tarifs hydrocarbures
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES 
  (1, 'Conakry', 'Station Kouremale', 1175.72, 'Destination Kouremale'),
  (2, 'Conakry', 'Areeba/N''zerekore', 1160.71, 'Destination N''zerekore'),
  (3, 'Conakry', 'Kagbelen GmG', 90.23, 'Destination Conakry')
ON CONFLICT DO NOTHING;