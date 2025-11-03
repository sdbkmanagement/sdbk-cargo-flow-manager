-- Resynchronisation des statuts des véhicules depuis les workflows validés
-- Un véhicule avec un workflow validé doit être marqué comme disponible

UPDATE public.vehicules v
SET 
  statut = 'disponible',
  validation_requise = false,
  updated_at = now()
FROM public.validation_workflows w
WHERE v.id = w.vehicule_id
  AND w.statut_global = 'valide'
  AND (v.validation_requise = true OR v.statut = 'validation_requise');