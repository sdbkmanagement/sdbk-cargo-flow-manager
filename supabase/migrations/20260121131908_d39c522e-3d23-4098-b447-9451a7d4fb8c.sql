-- Ajouter le tarif pour Dian Dian - Cobad Dian Dian
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Cobad Dian Dian', 376.29, 103, 'Tarif client Dian Dian')
ON CONFLICT DO NOTHING;