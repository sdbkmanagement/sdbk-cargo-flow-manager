
-- Corriger "PL MCK Malapoula" -> "PL MCK Malapouya" dans les tarifs
UPDATE tarifs_hydrocarbures 
SET destination = REPLACE(destination, 'Malapoula', 'Malapouya')
WHERE destination ILIKE '%malapoula%';

-- Corriger dans les bons de livraison
UPDATE bons_livraison 
SET destination = REPLACE(destination, 'Malapoula', 'Malapouya'),
    lieu_arrivee = REPLACE(lieu_arrivee, 'Malapoula', 'Malapouya')
WHERE destination ILIKE '%malapoula%' OR lieu_arrivee ILIKE '%malapoula%';
