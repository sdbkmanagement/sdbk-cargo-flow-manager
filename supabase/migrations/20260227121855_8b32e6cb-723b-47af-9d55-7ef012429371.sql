INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES (1, 'Conakry', 'Amg Sarl', 90.23, 'Destination Conakry')
ON CONFLICT DO NOTHING;