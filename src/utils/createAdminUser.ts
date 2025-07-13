
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    console.log('Creating admin user with Supabase Auth Admin...');
    
    // Créer l'utilisateur via Supabase Auth Admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'ben.wemmert@gmail.com',
      password: 'Dpstarz57!',
      user_metadata: {
        first_name: 'Ben',
        last_name: 'Wemmert'
      },
      email_confirm: true // Auto-confirmer l'email en mode admin
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw new Error(`Impossible de créer le compte admin: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Aucun utilisateur créé');
    }

    console.log('Admin user created successfully:', authData.user.id);

    // Attendre un peu pour que le trigger handle_new_user fonctionne
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mettre à jour le rôle en admin dans notre table users
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        roles: ['admin'],
        first_name: 'Ben',
        last_name: 'Wemmert',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('User profile update error:', updateError);
      throw new Error(`Impossible de configurer le profil admin: ${updateError.message}`);
    }

    console.log('Admin profile updated successfully:', updatedUser);
    
    return {
      success: true,
      user: authData.user,
      profile: updatedUser
    };

  } catch (error: any) {
    console.error('Complete error in createAdminUser:', error);
    throw error;
  }
};
