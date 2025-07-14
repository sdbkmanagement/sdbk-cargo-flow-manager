
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('🔐 Soumission du formulaire de connexion');
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Connexion réussie, redirection automatique...');
        toast({
          title: "Connexion réussie",
          description: "Bienvenue dans l'application",
        });
        // La redirection se fait automatiquement via le contexte
      } else {
        console.error('❌ Échec de la connexion:', result.error);
        toast({
          title: "Erreur de connexion",
          description: result.error || "Identifiants invalides",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Transport Manager</CardTitle>
          <CardDescription>
            Connexion au système de gestion de flotte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                required
                disabled={isSubmitting}
                autoComplete="email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                autoComplete="current-password"
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Pour les tests, vous pouvez utiliser n'importe quel email/mot de passe valide</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
