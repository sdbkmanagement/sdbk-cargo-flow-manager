
import { supabase } from '@/integrations/supabase/client';

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const checkRateLimit = async (
  userIdentifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', userIdentifier)
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error to prevent lockout
    }

    return (data?.length || 0) < maxAttempts;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true;
  }
};

export const logSecurityEvent = async (event: {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  user_id?: string;
  details?: Record<string, any>;
}) => {
  try {
    await supabase.from('admin_audit_log').insert({
      user_id: event.user_id,
      action: event.type,
      target_type: 'security_event',
      target_id: crypto.randomUUID(),
      details: {
        severity: event.severity,
        message: event.message,
        ...event.details
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
