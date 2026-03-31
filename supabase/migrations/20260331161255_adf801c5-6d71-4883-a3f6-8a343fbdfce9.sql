-- Ajouter le rôle 'hsecq' à yomalo.guemana@societedbk.com pour les contrôles HSEQ
UPDATE users 
SET roles = array_append(roles, 'hsecq'),
    updated_at = now()
WHERE email = 'yomalo.guemana@societedbk.com' 
  AND NOT ('hsecq' = ANY(coalesce(roles, '{}')));