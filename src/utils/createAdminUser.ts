
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    console.log('🔧 Création du compte admin...');
    
    // Données du compte admin
    const adminEmail = 'sdbkmanagement@gmail.com';
    const adminPassword = 'Admin123!';
    const adminId = '3e884fae-6dd9-436f-a6f5-595672045409';
    
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

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Erreur création Auth:', authError);
      throw authError;
    }

    if (authData.user) {
      console.log('✅ Utilisateur Auth créé avec l\'ID:', authData.user.id);
      
      // Mettre à jour l'enregistrement dans la table users avec le bon ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', adminEmail);

      if (updateError) {
        console.warn('⚠️ Mise à jour ID utilisateur:', updateError);
      }
    }

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
