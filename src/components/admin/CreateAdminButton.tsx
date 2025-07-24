
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createAdminUser } from '@/utils/createAdminUser';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

export const CreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    
    try {
      const result = await createAdminUser();
      
      if (result.success) {
        toast({
          title: "Compte admin créé",
          description: `Email: ${result.email} | Mot de passe: ${result.password}`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de la création du compte admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du compte admin",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateAdmin}
      disabled={isCreating}
      className="bg-orange-500 hover:bg-orange-600"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Créer compte admin
        </>
      )}
    </Button>
  );
};
