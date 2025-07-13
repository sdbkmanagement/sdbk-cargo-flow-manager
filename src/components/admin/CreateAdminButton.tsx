
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';
import { createAdminUser } from '@/utils/createAdminUser';
import { toast } from '@/hooks/use-toast';

export const CreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    try {
      await createAdminUser();
      toast({
        title: "Compte admin créé",
        description: "Le compte admin ben.wemmert@gmail.com a été créé avec succès."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
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
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création du compte admin...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Créer compte admin (ben.wemmert@gmail.com)
        </>
      )}
    </Button>
  );
};
