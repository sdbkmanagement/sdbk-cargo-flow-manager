
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    console.log('🔧 Création du compte admin...');
    
    // Données du compte admin
    const adminEmail = 'sdbkmanagement@gmail.com';
    const adminPassword = 'Admin123!';
    
    // Vérifier si l'utilisateur existe déjà dans auth.users
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find((user: any) => user.email === adminEmail);
    
    // Vérifier si l'utilisateur existe dans la table users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    let authUserId: string;

    if (existingAuthUser) {
      console.log('✅ Utilisateur Auth existe déjà:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
    } else {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'SDBK',
          roles: ['admin']
        }
      });

      if (authError) {
        console.error('❌ Erreur création Auth:', authError);
        throw authError;
      }

      console.log('✅ Utilisateur Auth créé avec l\'ID:', authData.user.id);
      authUserId = authData.user.id;
    }

    // Synchroniser ou créer l'enregistrement dans la table users
    if (existingUser) {
      // Mettre à jour l'ID dans la table users pour qu'il corresponde à auth.users
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          id: authUserId,
          first_name: 'Admin',
          last_name: 'SDBK',
          status: 'active'
        })
        .eq('email', adminEmail);

      if (updateError) {
        console.error('❌ Erreur mise à jour utilisateur:', updateError);
        throw updateError;
      }
      console.log('✅ Utilisateur mis à jour dans la table users');
    } else {
      // Créer l'utilisateur dans la table users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'SDBK',
          status: 'active'
        });

      if (insertError) {
        console.error('❌ Erreur création utilisateur:', insertError);
        throw insertError;
      }
      console.log('✅ Utilisateur créé dans la table users');
    }

    // Ajouter le rôle admin dans la table user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: authUserId, role: 'admin' }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('❌ Erreur ajout rôle admin:', roleError);
      throw roleError;
    }
    console.log('✅ Rôle admin ajouté dans user_roles');

    console.log('✅ Compte admin configuré');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    
    return {
      email: adminEmail,
      password: adminPassword,
      success: true
    };
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
    return {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      success: false
    };
  }
};
