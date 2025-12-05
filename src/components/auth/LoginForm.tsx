
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login } = useAuth();
  const { toast } = useToast();

  // Input validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Rate limiting check
  const checkRateLimit = async (email: string): Promise<boolean> => {
    try {
      const { data: attempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
        .order('created_at', { ascending: false });

      return (attempts?.length || 0) >= 5; // Max 5 failed attempts in 15 minutes
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  };

  // Log login attempt
  const logLoginAttempt = async (email: string, success: boolean, errorMessage?: string) => {
    try {
      await supabase
        .from('login_attempts')
        .insert({
          email: sanitizeInput(email),
          success,
          error_message: errorMessage,
          ip_address: null // Could be enhanced with actual IP detection
        });
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!email || !password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Format d'email invalide",
        description: "Veuillez entrer un email valide",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    const sanitizedEmail = sanitizeInput(email);

    // Check rate limiting
    const isRateLimited = await checkRateLimit(sanitizedEmail);
    if (isRateLimited) {
      toast({
        title: "Trop de tentatives",
        description: "Veuillez attendre 15 minutes avant de réessayer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(sanitizedEmail, password);
      
      if (result.success) {
        // Log successful login
        await logLoginAttempt(sanitizedEmail, true);
        
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur SDBK Transport",
        });
        
        // Reset login attempts counter
        setLoginAttempts(0);
        
        // Rediriger vers la page d'accueil/dashboard
        navigate('/');
      } else {
        // Log failed login
        await logLoginAttempt(sanitizedEmail, false, result.error);
        
        // Increment local login attempts
        setLoginAttempts(prev => prev + 1);
        
        let errorMessage = result.error || "Identifiants invalides";
        
        // Provide specific error messages without revealing too much
        if (result.error?.includes('Invalid login credentials')) {
          errorMessage = "Email ou mot de passe incorrect";
        } else if (result.error?.includes('Email not confirmed')) {
          errorMessage = "Email non confirmé. Vérifiez votre boîte mail.";
        } else if (result.error?.includes('Too many requests')) {
          errorMessage = "Trop de tentatives. Veuillez attendre avant de réessayer.";
        }
        
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      // Log the error attempt
      await logLoginAttempt(sanitizedEmail, false, error.message);
      
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">SDBK Transport</CardTitle>
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
                placeholder="votre-email@sdbk.com"
                required
                disabled={isSubmitting}
                autoComplete="email"
                maxLength={254} // RFC 5321 limit
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
                maxLength={128} // Reasonable password length limit
              />
            </div>
            
            {loginAttempts > 0 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Tentative {loginAttempts}/5</span>
              </div>
            )}
            
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
        </CardContent>
      </Card>
    </div>
  );
};
