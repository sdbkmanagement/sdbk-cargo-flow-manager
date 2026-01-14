-- 1. Mettre à jour le tarif: changer la destination de Forecariah vers Maferenya
UPDATE tarifs_hydrocarbures 
SET destination = 'PL Maferinyah Forecariah',
    observations = 'Tarif client Maferenya'
WHERE id = '4a09df82-4627-4ab6-9ffd-dbbfd657419b';

-- 2. Mettre à jour les BL pour avoir la bonne destination
UPDATE bons_livraison 
SET destination = 'PL Maferinyah Forecariah',
    lieu_arrivee = 'Maferenya'
WHERE numero IN ('BL-3022532494', 'BL-3022531979');