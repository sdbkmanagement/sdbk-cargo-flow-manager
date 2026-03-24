-- Mettre à jour les 5 BL avec le tarif Niagassola (1297.62 GNF/L) et quantité 40000 L
UPDATE bons_livraison 
SET 
  prix_unitaire = 1297.62,
  montant_total = 40000.00 * 1297.62,
  destination = 'Niagassola - PL Niagassola welly Mining',
  updated_at = NOW()
WHERE numero IN ('BL-3022537999','BL-3022537543','BL-3022536639','BL-3022536725','BL-3022536088');
