
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const createSecureAdminUser = async (data: AdminCreationData) => {
  try {
    // Validate input data
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new Error('Tous les champs sont requis');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Format d\'email invalide');
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    console.log('Creating secure admin user...');
    
    // Create user via Supabase Auth Admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw new Error(`Impossible de créer le compte admin: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Aucun utilisateur créé');
    }

    console.log('Admin user created successfully:', authData.user.id);

    // Wait for trigger to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update role to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        roles: ['admin'],
        first_name: data.firstName,
        last_name: data.lastName,
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
    
    // Log security event
    await logSecurityEvent('admin_created', {
      admin_id: authData.user.id,
      admin_email: data.email,
      created_by: 'system'
    });

    return {
      success: true,
      user: authData.user,
      profile: updatedUser
    };

  } catch (error: any) {
    console.error('Complete error in createSecureAdminUser:', error);
    
    // Log security event for failed attempt
    await logSecurityEvent('admin_creation_failed', {
      email: data.email,
      error: error.message
    });
    
    throw error;
  }
};

const logSecurityEvent = async (eventType: string, details: any) => {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: eventType,
        event_details: details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
