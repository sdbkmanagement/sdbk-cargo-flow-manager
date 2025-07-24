
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else if (!phone.match(/^\+?[1-9]\d{1,14}$/)) {
    errors.push('Please enter a valid phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '')
    .replace(/["\x00-\x1F\x7F]/g, '')
    .trim();
};

export const validateName = (name: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length === 0) {
    errors.push(`${fieldName} is required`);
  } else if (sanitized.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  } else if (sanitized.length > 50) {
    errors.push(`${fieldName} must be less than 50 characters long`);
  } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitized)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const checkRateLimit = async (userIdentifier: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      user_identifier: userIdentifier,
      max_attempts: 5,
      window_minutes: 15
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      return false; // Fail closed for security
    }
    
    return data === true;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return false; // Fail closed for security
  }
};

export const validatePermisNumber = (permisNumber: string): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(permisNumber);
  
  if (!sanitized || sanitized.length === 0) {
    errors.push('Permit number is required');
  } else if (sanitized.length < 5) {
    errors.push('Permit number must be at least 5 characters long');
  } else if (sanitized.length > 20) {
    errors.push('Permit number must be less than 20 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateImmatriculation = (immatriculation: string): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(immatriculation);
  
  if (!sanitized || sanitized.length === 0) {
    errors.push('Registration number is required');
  } else if (sanitized.length < 3) {
    errors.push('Registration number must be at least 3 characters long');
  } else if (sanitized.length > 15) {
    errors.push('Registration number must be less than 15 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
