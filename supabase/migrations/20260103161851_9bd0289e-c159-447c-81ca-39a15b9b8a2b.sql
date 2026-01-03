-- Insertion du tarif hydrocarbures pour Station Total Kerouan (départ: Kankan)
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES (214, 'Kankan', 'Kérouané - Station Total Kerouan', 270.34, 'Tarif péréquation Station Total Kerouan au départ de Kankan')
ON CONFLICT DO NOTHING;