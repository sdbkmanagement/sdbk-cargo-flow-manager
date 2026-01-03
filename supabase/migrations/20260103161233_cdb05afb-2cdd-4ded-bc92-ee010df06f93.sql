-- Insertion des 5 tarifs hydrocarbures depuis l'image (départ: Conakry)
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES 
  (209, 'Conakry', 'Kamasar - PL Katibini Port', 342.74, 'Tarif péréquation PL Katibini Port'),
  (210, 'Conakry', 'N''zerekore - IPT PowerTech PL', 1160.71, 'Tarif péréquation IPT PowerTech PL'),
  (211, 'Conakry', 'Beyla - IPT PowerTech PL', 1309.22, 'Tarif péréquation IPT PowerTech PL'),
  (212, 'Conakry', 'Kissidougou - IPT PowerTech PL', 715.88, 'Tarif péréquation IPT PowerTech PL'),
  (213, 'Conakry', 'Labe - IPT PowerTech PL', 447.27, 'Tarif péréquation IPT PowerTech PL')
ON CONFLICT DO NOTHING;