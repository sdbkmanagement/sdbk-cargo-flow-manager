UPDATE bons_livraison 
SET lieu_arrivee = REPLACE(lieu_arrivee, 'Kamasar', 'Kamsar'),
    destination = REPLACE(destination, 'Kamasar', 'Kamsar')
WHERE destination ILIKE '%kamasar%' OR lieu_arrivee ILIKE '%kamasar%';

-- Corriger aussi la faute "Compaagnie Des Baux" -> "Compagnie des Bauxite de Guinée"
UPDATE bons_livraison 
SET lieu_arrivee = REPLACE(lieu_arrivee, 'Compaagnie Des Baux', 'Compagnie des Bauxite de Guinée')
WHERE lieu_arrivee ILIKE '%compaagnie%';