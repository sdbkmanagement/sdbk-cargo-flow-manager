INSERT INTO public.gmao_demandes_intervention (equipement_id, titre, description, priorite, statut, demandeur_nom, date_demande)
SELECT o.equipement_id, o.titre,
       COALESCE(NULLIF(TRIM(COALESCE(o.description,'')),''), NULL),
       COALESCE(o.priorite,'normale'), 'nouvelle', NULL, COALESCE(o.created_at, now())
FROM public.gmao_ordres_travail o
WHERE o.numero = 'OT-2026-000001';

DELETE FROM public.gmao_ordres_travail WHERE numero = 'OT-2026-000001';