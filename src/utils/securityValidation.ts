
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  if (email.length > 254) {
    errors.push('Email too long');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings };
  }
  
  if (name.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }
  
  if (name.length > 100) {
    errors.push(`${fieldName} must be less than 100 characters`);
  }
  
  // Check for potentially dangerous characters
  const dangerousChars = /[<>]/;
  if (dangerousChars.test(name)) {
    errors.push(`${fieldName} contains invalid characters`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!phone) {
    errors.push('Phone number is required');
    return { isValid: false, errors, warnings };
  }
  
  // Basic international phone format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.push('Invalid phone number format');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    warnings.push('Password should contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    warnings.push('Password should contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    warnings.push('Password should contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    warnings.push('Password should contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/["\x00-\x1F\x7F]/g, '')
    .trim();
};

export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${fieldName} is required`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

export const validateLength = (value: string, min: number, max: number, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters long`);
  }
  
  if (value.length > max) {
    errors.push(`${fieldName} must be less than ${max} characters long`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};
