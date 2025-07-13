
-- Fonction pour créer directement un utilisateur admin dans la base de données
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS TEXT AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Générer un UUID pour l'admin
  admin_id := gen_random_uuid();
  
  -- Insérer directement dans la table users (sans passer par Auth)
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    roles,
    status,
    password_hash,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    'sdbkmanagement@gmail.com',
    'Admin',
    'SDBK',
    ARRAY['admin']::user_role[],
    'active',
    'temporary_hash_to_replace',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO UPDATE SET
    roles = ARRAY['admin']::user_role[],
    status = 'active',
    first_name = 'Admin',
    last_name = 'SDBK';
    
  RETURN 'Utilisateur admin créé avec ID: ' || admin_id::text || '. Vous devez maintenant créer ce compte dans Supabase Auth avec email: sdbkmanagement@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction pour créer l'admin
SELECT create_admin_user();

-- Supprimer la fonction après utilisation
DROP FUNCTION create_admin_user();
