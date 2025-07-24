
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureForm } from '@/hooks/useSecureForm';
import { validateEmail, validatePassword, checkRateLimit } from '@/utils/securityValidation';

export const SecureLoginForm = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string>('');

  const {
    fields,
    isSubmitting,
    submitError,
    hasErrors,
    handleSubmit,
    getFieldProps
  } = useSecureForm({
    initialValues: {
      email: '',
      password: ''
    },
    validators: {
      email: validateEmail,
      password: (value) => ({ isValid: value.length > 0, errors: value.length === 0 ? ['Password is required'] : [] })
    },
    onSubmit: async (values) => {
      // Check rate limiting before attempting login
      const canAttempt = await checkRateLimit(values.email);
      if (!canAttempt) {
        setRateLimitError('Too many failed attempts. Please try again in 15 minutes.');
        return;
      }

      setRateLimitError('');
      const result = await login(values.email, values.password);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Connexion sécurisée
          </CardTitle>
          <CardDescription className="text-center">
            Accédez à votre compte de manière sécurisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...getFieldProps('email')}
                className={fields.email?.error ? 'border-red-500' : ''}
              />
              {fields.email?.error && (
                <p className="text-sm text-red-600">{fields.email.error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  {...getFieldProps('password')}
                  className={fields.password?.error ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fields.password?.error && (
                <p className="text-sm text-red-600">{fields.password.error}</p>
              )}
            </div>

            {rateLimitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{rateLimitError}</AlertDescription>
              </Alert>
            )}

            {submitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || hasErrors || !fields.email?.value || !fields.password?.value}
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="mt-4 text-center text-sm text-gray-600">
              <p>🔒 Connexion sécurisée avec chiffrement SSL</p>
              <p>⚠️ 5 tentatives maximum par période de 15 minutes</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
