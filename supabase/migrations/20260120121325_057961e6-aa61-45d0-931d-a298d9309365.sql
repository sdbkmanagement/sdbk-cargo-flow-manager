-- Ajouter les nouveaux tarifs hydrocarbures pour les 3 clients

-- 1. Boke - Dingsheng Sarl - 286.69 GNF/L
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Dingsheng Sarl', 286.69, 100, 'Tarif client Boke');

-- 2. Kankan - Guiter Kankan - 935.37 GNF/L
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Guiter Kankan', 935.37, 101, 'Tarif client Kankan');

-- 3. Conakry - Africa Global Logistiques - 90.23 GNF/L
INSERT INTO tarifs_hydrocarbures (lieu_depart, destination, tarif_au_litre, numero_ordre, observations)
VALUES ('Conakry', 'Africa Global Logistiques', 90.23, 102, 'Tarif client Conakry');