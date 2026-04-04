
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Lock, Mail } from 'lucide-react';
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

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
    const sanitizedEmail = sanitizeInput(email);
    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide",
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
          description: "Bienvenue sur SDBK - AMS",
        });
        setLoginAttempts(0);
        navigate('/');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(222,47%,11%)] to-[hsl(217,33%,17%)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-info/8 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-glow">
              <img src="/images/logo-sdbk.png" alt="SDBK" className="h-14 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SDBK - AMS</h1>
          <p className="text-white/50 mt-2 text-sm font-medium">Administration Management System</p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-elegant">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Connexion</h2>
            <p className="text-white/40 text-sm mt-1">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
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
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm font-medium">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
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
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
            </div>
            
            {loginAttempts > 0 && (
              <div className="flex items-center gap-2 text-amber-400/80 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tentative {loginAttempts}/5</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 active:scale-[0.98]" 
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
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} SDBK — Société Diallo-Bah-Kane
        </p>
      </div>
    </div>
  );
};
