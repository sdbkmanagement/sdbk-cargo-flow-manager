UPDATE bons_livraison 
SET prix_unitaire = 1297.62, 
    montant_total = 40000 * 1297.62,
    updated_at = now()
WHERE numero = 'BL-3022538713';