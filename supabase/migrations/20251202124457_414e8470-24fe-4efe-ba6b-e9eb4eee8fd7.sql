-- Ajouter le rôle transport pour l'utilisateur transport@societedbk.com
INSERT INTO user_roles (user_id, role)
VALUES ('454b8c2c-d16c-442e-bc71-5dfd8b43d85d', 'transport')
ON CONFLICT (user_id, role) DO NOTHING;