
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
        email: 'admin@sdbk.com',
        password: 'Admin@2024',
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
      await new Promise(resolve => setTimeout(resolve, 2000));

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

      toast({
        title: "Compte admin créé avec succès !",
        description: "Vous pouvez maintenant vous connecter avec admin@sdbk.com / Admin@2024"
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
          Créer compte admin (admin@sdbk.com)
        </>
      )}
    </Button>
  );
};
