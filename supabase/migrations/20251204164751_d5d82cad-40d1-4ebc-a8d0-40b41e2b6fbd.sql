-- Insérer les clients avec leurs destinations
INSERT INTO clients_total (code_client, nom_client, destination)
VALUES 
  ('CLI-KALEAH-001', 'Kaleah', 'Forecariah'),
  ('CLI-EIFFAGE-KIN', 'EIFFAGE', 'Kindia'),
  ('CLI-EIFFAGE-LAB', 'EIFFAGE', 'Labe'),
  ('CLI-BEVERAGE-MAF', 'Beverage', 'Maferenya'),
  ('CLI-BEVERAGE-GOM', 'Beverage', 'Gomboya'),
  ('CLI-TOTAL-DIXIN', 'Station Total Dixin Oasis', 'Conakry'),
  ('CLI-TOTAL-MATOTO', 'Station Total Matoto Mosquée', 'Conakry'),
  ('CLI-TOTAL-RATOMA', 'Station Total Ratoma', 'Conakry'),
  ('CLI-SGESCO-001', 'SGESCO', 'N''zerekore'),
  ('CLI-SOGUPAH-001', 'SOGUPAH', 'N''zerekore'),
  ('CLI-DABIS-001', 'Dabis', 'Boke'),
  ('CLI-ROUGE-001', 'Rouge Mining', 'Telemele')
ON CONFLICT (code_client) DO NOTHING;

-- Insérer les tarifs de péréquation pour ces destinations (lieu_depart = 'Conakry' par défaut)
INSERT INTO tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations)
VALUES 
  (100, 'Conakry', 'Forecariah', 107.78, 'Client: Kaleah'),
  (101, 'Conakry', 'Kindia', 147.65, 'Client: EIFFAGE'),
  (102, 'Conakry', 'Labe', 447.27, 'Client: EIFFAGE'),
  (103, 'Conakry', 'Maferenya', 99.93, 'Client: Beverage'),
  (104, 'Conakry', 'Gomboya', 90.23, 'Client: Beverage'),
  (105, 'Conakry', 'N''zerekore', 1160.71, 'Clients: SGESCO, SOGUPAH'),
  (106, 'Conakry', 'Boke', 286.69, 'Client: Dabis'),
  (107, 'Conakry', 'Telemele', 332.28, 'Client: Rouge Mining')
ON CONFLICT DO NOTHING;