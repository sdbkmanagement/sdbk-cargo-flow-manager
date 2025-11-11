import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const LoginForm = () => {
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
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      return (attempts?.length || 0) >= 5;
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
          ip_address: null
        });
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  };

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
        await logLoginAttempt(sanitizedEmail, true);
        
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur SDBK Transport",
        });
        
        setLoginAttempts(0);
      } else {
        await logLoginAttempt(sanitizedEmail, false, result.error);
        setLoginAttempts(prev => prev + 1);
        
        let errorMessage = result.error || "Identifiants invalides";
        
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background avec gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0QzMyLjY4NiAxNCAzMCAxMS4zMTQgMzAgOHMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnptMCAxMmMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      </div>

      {/* Floating elements décoratives */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Card de connexion moderne */}
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-2xl border-white/20 shadow-2xl animate-fade-in-scale">
        <CardHeader className="text-center space-y-6 pb-8">
          {/* Logo avec effet glow */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                <Truck className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Titre avec gradient */}
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              SDBK Transport
            </CardTitle>
            <CardDescription className="text-base text-gray-600 font-medium">
              Connectez-vous à votre espace de gestion
            </CardDescription>
          </div>

          {/* Badge de connexion sécurisée */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-semibold">Connexion sécurisée</span>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Adresse email
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@sdbk.com"
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                  maxLength={254}
                  className="modern-input h-12 text-base group-hover:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Mot de passe
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  maxLength={128}
                  className="modern-input h-12 text-base group-hover:border-primary/50 transition-all"
                />
              </div>
            </div>
            
            {loginAttempts > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl animate-fade-in-up">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-700 font-semibold">
                  Tentative {loginAttempts}/5 - Soyez vigilant
                </span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold rounded-xl relative overflow-hidden group"
              disabled={isSubmitting}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></span>
              <span className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </Button>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl">🚛</div>
                  <p className="text-xs text-gray-600 font-medium">Gestion flotte</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl">📊</div>
                  <p className="text-xs text-gray-600 font-medium">Analytics</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl">🔒</div>
                  <p className="text-xs text-gray-600 font-medium">Sécurisé</p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Badge version */}
      <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-sm text-white font-semibold">V2.0 Modern</span>
      </div>
    </div>
  );
};
