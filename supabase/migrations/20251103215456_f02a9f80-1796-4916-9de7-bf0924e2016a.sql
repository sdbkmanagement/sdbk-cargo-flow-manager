-- Supprimer toutes les données de test pour missions et factures

-- Supprimer les bons de livraison
DELETE FROM public.bons_livraison;

-- Supprimer les chargements
DELETE FROM public.chargements;

-- Supprimer l'historique des chargements
DELETE FROM public.chargements_historique;

-- Supprimer l'historique des missions
DELETE FROM public.missions_historique;

-- Supprimer les missions
DELETE FROM public.missions;

-- Supprimer les lignes de factures
DELETE FROM public.facture_lignes;

-- Supprimer les factures
DELETE FROM public.factures;

-- Supprimer les devis
DELETE FROM public.devis;