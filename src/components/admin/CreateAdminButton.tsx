
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
      console.log('Creating admin user via standard signup...');
      
      // 1. Créer l'utilisateur via la méthode standard de signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'sdbkmanagement@gmail.com',
        password: 'Admin@2025',
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'Système'
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        throw new Error(`Erreur de création: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      console.log('User created successfully via signup:', authData.user.id);

      // 2. Attendre un peu pour que le trigger fonctionne
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Mettre à jour le rôle en admin directement dans la base
      console.log('Updating user role to admin...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          roles: ['admin'],
          first_name: 'Admin',
          last_name: 'Système',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'sdbkmanagement@gmail.com');

      if (updateError) {
        console.error('User profile update error:', updateError);
        throw new Error(`Erreur de mise à jour du profil: ${updateError.message}`);
      }

      console.log('User role updated to admin successfully');

      toast({
        title: "Compte admin créé avec succès !",
        description: "Vous pouvez maintenant vous connecter avec sdbkmanagement@gmail.com / Admin@2025"
      });

    } catch (error: any) {
      console.error('Complete error in createAdmin:', error);
      
      let errorMessage = "Impossible de créer le compte admin.";
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = "Un compte avec cet email existe déjà. Essayez de vous connecter directement.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Format d'email invalide.";
        } else if (error.message.includes('Password should be')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Email non confirmé. Vérifiez votre boîte mail ou contactez l'administrateur.";
        } else {
          errorMessage = `Erreur : ${error.message}`;
        }
      }
      
      toast({
        title: "Erreur de création",
        description: errorMessage,
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
