
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordRequest {
  action: 'reset' | 'update';
  userId: string;
  newPassword?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔧 Starting password management function');
    
    // Créer le client Supabase avec les permissions admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Vérifier que l'utilisateur actuel est admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Token d\'authentification manquant' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.log('❌ User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Current user authenticated:', user.email);

    // Vérifier si l'utilisateur a le rôle admin
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (roleError || !userData || !userData.roles.includes('admin')) {
      console.log('❌ Admin role check failed:', roleError, userData);
      return new Response(
        JSON.stringify({ error: 'Permissions administrateur requises' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Admin role verified');

    // Traiter la demande
    const { action, userId, newPassword }: PasswordRequest = await req.json();
    
    console.log('🔧 Processing action:', action, 'for user:', userId);

    // Vérifier d'abord si l'utilisateur existe dans auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authUserError) {
      console.log('❌ User not found in auth.users:', authUserError);
      
      // Vérifier si l'utilisateur existe dans la table users
      const { data: dbUser, error: dbUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (dbUserError || !dbUser) {
        console.log('❌ User not found in users table either:', dbUserError);
        return new Response(
          JSON.stringify({ error: 'Utilisateur introuvable dans le système' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('ℹ️ User exists in users table but not in auth.users, attempting to create auth user');
      
      // Essayer de créer l'utilisateur dans auth.users
      const tempPassword = generateSecurePassword();
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: dbUser.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          roles: dbUser.roles
        }
      });
      
      if (createError) {
        console.log('❌ Failed to create auth user:', createError);
        return new Response(
          JSON.stringify({ error: `Impossible de créer l'utilisateur dans le système d'authentification: ${createError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('✅ Auth user created successfully');
      
      // Mettre à jour l'ID si nécessaire
      if (createdUser.user?.id !== userId) {
        await supabaseAdmin
          .from('users')
          .update({ id: createdUser.user.id })
          .eq('id', userId);
        
        console.log('✅ User ID updated in users table');
      }
    } else {
      console.log('✅ User found in auth.users:', authUser.user?.email);
    }

    // Fonction pour générer un mot de passe sécurisé
    function generateSecurePassword(): string {
      const length = 16;
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    }

    if (action === 'reset') {
      const generatedPassword = generateSecurePassword();
      console.log('🔧 Attempting to reset password with generated password');

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: generatedPassword }
      );

      if (updateError) {
        console.log('❌ Password reset failed:', updateError);
        return new Response(
          JSON.stringify({ error: `Erreur lors de la réinitialisation: ${updateError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Password reset successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          password: generatedPassword,
          message: 'Mot de passe réinitialisé avec succès' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'update') {
      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('🔧 Attempting to update password');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.log('❌ Password update failed:', updateError);
        return new Response(
          JSON.stringify({ error: `Erreur lors de la mise à jour: ${updateError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Password update successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Mot de passe mis à jour avec succès' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Critical error in admin-password-management:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
