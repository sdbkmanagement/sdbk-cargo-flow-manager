
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateName = (name: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
  } else if (name.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s+/g, ''))) {
    errors.push('Please enter a valid phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Password should contain at least one special character');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: Date; blockedUntil?: Date }>();

export const checkRateLimit = async (email: string): Promise<boolean> => {
  const now = new Date();
  const key = email.toLowerCase();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
    return true;
  }
  
  // Check if user is currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return false;
  }
  
  // Reset attempts if more than 15 minutes have passed
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  if (record.lastAttempt < fifteenMinutesAgo) {
    record.attempts = 1;
    record.lastAttempt = now;
    delete record.blockedUntil;
    return true;
  }
  
  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  
  // Block if too many attempts
  if (record.attempts > 5) {
    record.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
    return false;
  }
  
  return true;
};

export const calculateAnciennete = (dateEmbauche: string): string => {
  if (!dateEmbauche) return 'N/A';
  
  const embauche = new Date(dateEmbauche);
  const aujourd = new Date();
  
  let annees = aujourd.getFullYear() - embauche.getFullYear();
  let mois = aujourd.getMonth() - embauche.getMonth();
  
  if (mois < 0) {
    annees--;
    mois += 12;
  }
  
  if (annees === 0) {
    return `${mois} mois`;
  } else if (mois === 0) {
    return `${annees} an${annees > 1 ? 's' : ''}`;
  } else {
    return `${annees} an${annees > 1 ? 's' : ''} et ${mois} mois`;
  }
};
