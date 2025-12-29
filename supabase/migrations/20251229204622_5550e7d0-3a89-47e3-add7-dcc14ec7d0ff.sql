-- Supprimer les lignes de factures associées
DELETE FROM facture_lignes WHERE facture_id IN ('418d21c0-1b60-4f54-a3c7-cb4509d34dd3', '063042f0-1f8c-442e-95d1-8a8c5f238c59');

-- Supprimer les factures
DELETE FROM factures WHERE id IN ('418d21c0-1b60-4f54-a3c7-cb4509d34dd3', '063042f0-1f8c-442e-95d1-8a8c5f238c59');