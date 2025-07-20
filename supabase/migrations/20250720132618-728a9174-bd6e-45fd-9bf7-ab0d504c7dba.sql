
-- Créer ou recréer la vue pour les alertes documents chauffeurs
DROP VIEW IF EXISTS public.alertes_documents_chauffeurs;

CREATE VIEW public.alertes_documents_chauffeurs AS
SELECT 
    d.id,
    d.chauffeur_id,
    (c.prenom || ' ' || c.nom) as chauffeur_nom,
    d.nom as document_nom,
    d.type as document_type,
    d.date_expiration,
    CASE 
        WHEN d.date_expiration IS NULL THEN NULL
        ELSE (d.date_expiration - CURRENT_DATE)::integer
    END as jours_restants,
    CASE 
        WHEN d.date_expiration IS NULL THEN 'valide'
        WHEN d.date_expiration < CURRENT_DATE THEN 'expire'
        WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'a_renouveler'
        ELSE 'valide'
    END as statut,
    CASE 
        WHEN d.date_expiration IS NULL THEN 'INFO'
        WHEN d.date_expiration < CURRENT_DATE THEN 'URGENT - EXPIRÉ'
        WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '7 days') THEN 'URGENT'
        WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'ATTENTION'
        ELSE 'INFO'
    END as niveau_alerte
FROM public.documents d
INNER JOIN public.chauffeurs c ON d.chauffeur_id = c.id
WHERE d.chauffeur_id IS NOT NULL
AND d.date_expiration IS NOT NULL;

-- Accorder les permissions de lecture sur la vue
GRANT SELECT ON public.alertes_documents_chauffeurs TO authenticated;
GRANT SELECT ON public.alertes_documents_chauffeurs TO anon;
