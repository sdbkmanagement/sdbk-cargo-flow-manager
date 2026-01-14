-- Ajouter les nouveaux tarifs pour les clients de l'image
-- Senko - Sinko Diaraguerela - 1409.59 (depuis Conakry)
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Sinko Diaraguerela', 1409.59, 200, 'Tarif client Senko')
ON CONFLICT DO NOTHING;

-- Conakry - Ministère de la Défense Nationale - 90.23
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Ministère de la Défense Nationale', 90.23, 201, 'Tarif client Conakry')
ON CONFLICT DO NOTHING;

-- Mamou - Ministère de la Défense Nationale - 296.39
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Mamou', 'Ministère de la Défense Nationale', 296.39, 202, 'Tarif client Mamou')
ON CONFLICT DO NOTHING;

-- Labe - Ministère de la Défense Nationale - 447.27
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Labe', 'Ministère de la Défense Nationale', 447.27, 203, 'Tarif client Labe')
ON CONFLICT DO NOTHING;

-- Tanene - Sogeac/Satom - 103.47
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Sogeac/Satom Tanene', 103.47, 204, 'Tarif client Tanene')
ON CONFLICT DO NOTHING;

-- Mamou - Henanchine Mamou - 296.39
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Henanchine Mamou', 296.39, 205, 'Tarif client Mamou')
ON CONFLICT DO NOTHING;