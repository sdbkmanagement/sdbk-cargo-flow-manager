
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
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier si l'utilisateur a le rôle admin
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (roleError || !userData || !userData.roles.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Permissions administrateur requises' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Traiter la demande
    const { action, userId, newPassword }: PasswordRequest = await req.json();

    if (action === 'reset') {
      // Générer un mot de passe aléatoire sécurisé
      const generatePassword = () => {
        const length = 16;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const generatedPassword = generatePassword();

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: generatedPassword }
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Erreur lors de la réinitialisation: ${updateError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

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

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Erreur lors de la mise à jour: ${updateError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

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
    console.error('Erreur dans admin-password-management:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
