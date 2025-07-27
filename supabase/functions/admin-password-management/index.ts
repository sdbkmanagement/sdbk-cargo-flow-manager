
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordRequest {
  action: 'reset' | 'update' | 'create_user';
  userId?: string;
  newPassword?: string;
  email?: string;
  password?: string;
  user_metadata?: any;
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
    const { action, userId, newPassword, email, password, user_metadata }: PasswordRequest = await req.json();
    
    console.log('🔧 Processing action:', action, 'for user:', userId || email);

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

    let finalUserId = userId;

    // Traiter les actions
    if (action === 'create_user') {
      console.log('🔧 Creating new user with email:', email);
      
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email et mot de passe requis pour la création' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata
      });

      if (authError) {
        console.error('❌ User creation failed:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ User created successfully:', authUser.user?.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authUser.user 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'reset') {
      const generatedPassword = generateSecurePassword();
      console.log('🔧 Attempting to reset password');

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        finalUserId,
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
        finalUserId,
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
