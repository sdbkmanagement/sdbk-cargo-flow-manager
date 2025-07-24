
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email sanitization
  return email
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .trim();
};

export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  return phone.replace(/[^+\d]/g, '');
};

export const sanitizeNumeric = (input: string): string => {
  if (!input) return '';
  
  // Only allow digits and decimal point
  return input.replace(/[^0-9.]/g, '');
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) {
    return `${fieldName} est requis`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Format d\'email invalide';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
  }
  
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return 'Format de téléphone invalide';
  }
  return null;
};
