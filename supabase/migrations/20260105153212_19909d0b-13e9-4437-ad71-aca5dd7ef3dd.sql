-- Ajout du module 'societe' aux permissions de ousmane.balde@societedbk.com
UPDATE users 
SET module_permissions = array_append(module_permissions, 'societe'),
    updated_at = now()
WHERE email = 'ousmane.balde@societedbk.com' 
  AND NOT ('societe' = ANY(module_permissions));