
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const CreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    try {
      console.log('Creating admin user with Supabase Auth...');
      
      // Créer l'utilisateur via Supabase Auth Admin
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'sdbkmanagement@gmail.com',
        password: 'Admin@2025',
        user_metadata: {
          first_name: 'Admin',
          last_name: 'Système'
        },
        email_confirm: true // Auto-confirmer l'email
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Erreur de création: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      console.log('Admin user created successfully:', authData.user.id);

      // Attendre un peu pour que le trigger fonctionne
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Vérifier si l'utilisateur existe dans la table users
      console.log('Checking if user exists in users table...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
      }

      if (!existingUser) {
        console.log('User not found, creating manually...');
        // Créer manuellement si le trigger n'a pas fonctionné
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: 'sdbkmanagement@gmail.com',
            first_name: 'Admin',
            last_name: 'Système',
            roles: ['admin'],
            status: 'active',
            password_hash: 'managed_by_supabase_auth',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Manual user creation error:', createError);
          throw new Error(`Erreur de création manuelle: ${createError.message}`);
        }
        console.log('User created manually');
      } else {
        console.log('User found, updating role...');
        // Mettre à jour le rôle en admin
        const { error: updateError } = await supabase
          .from('users')
          .update({
            roles: ['admin'],
            first_name: 'Admin',
            last_name: 'Système',
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('User profile update error:', updateError);
          throw new Error(`Erreur de mise à jour du profil: ${updateError.message}`);
        }
        console.log('User role updated to admin');
      }

      toast({
        title: "Compte admin créé avec succès !",
        description: "Vous pouvez maintenant vous connecter avec sdbkmanagement@gmail.com / Admin@2025"
      });

    } catch (error: any) {
      console.error('Complete error in createAdmin:', error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le compte admin.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateAdmin}
      disabled={isCreating}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création du compte admin...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Créer compte admin (sdbkmanagement@gmail.com)
        </>
      )}
    </Button>
  );
};
