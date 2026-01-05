-- Ajout du module 'hseq' aux permissions de yomalo.guemana@societedbk.com
UPDATE users 
SET module_permissions = array_append(module_permissions, 'hseq'),
    updated_at = now()
WHERE email = 'yomalo.guemana@societedbk.com' 
  AND NOT ('hseq' = ANY(module_permissions));