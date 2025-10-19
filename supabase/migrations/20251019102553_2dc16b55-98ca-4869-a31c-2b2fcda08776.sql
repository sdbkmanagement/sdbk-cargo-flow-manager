-- Modifier les colonnes de montants pour supporter des valeurs plus grandes
-- En utilisant numeric sans limite de précision pour les montants en GNF

ALTER TABLE public.factures 
ALTER COLUMN montant_ht TYPE numeric USING montant_ht::numeric,
ALTER COLUMN montant_tva TYPE numeric USING montant_tva::numeric,
ALTER COLUMN montant_ttc TYPE numeric USING montant_ttc::numeric;

-- Modifier également la table facture_lignes
ALTER TABLE public.facture_lignes 
ALTER COLUMN quantite TYPE numeric USING quantite::numeric,
ALTER COLUMN prix_unitaire TYPE numeric USING prix_unitaire::numeric,
ALTER COLUMN total TYPE numeric USING total::numeric;

-- Modifier la table devis pour cohérence
ALTER TABLE public.devis 
ALTER COLUMN montant_ht TYPE numeric USING montant_ht::numeric,
ALTER COLUMN montant_tva TYPE numeric USING montant_tva::numeric,
ALTER COLUMN montant_ttc TYPE numeric USING montant_ttc::numeric;

-- Commenter la modification
COMMENT ON COLUMN public.factures.montant_ht IS 'Montant HT sans limite de précision pour supporter les grandes valeurs en GNF';
COMMENT ON COLUMN public.factures.montant_ttc IS 'Montant TTC sans limite de précision pour supporter les grandes valeurs en GNF';