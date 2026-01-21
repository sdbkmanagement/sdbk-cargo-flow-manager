-- Mettre à jour le prix du BL-3022531487 avec la péréquation Dian Dian (376.29 GNF/L)
UPDATE bons_livraison 
SET prix_unitaire = 376.29, 
    montant_total = quantite_prevue * 376.29,
    updated_at = now()
WHERE numero = 'BL-3022531487';