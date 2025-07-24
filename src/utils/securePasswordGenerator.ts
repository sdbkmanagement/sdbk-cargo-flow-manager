
/**
 * Cryptographically secure password generator
 */
export const generateSecurePassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure we have at least one character from each category
  let password = '';
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(numbers);
  password += getRandomChar(special);
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += getRandomChar(allChars);
  }
  
  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
};

const getRandomChar = (chars: string): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return chars[array[0] % chars.length];
};

const shuffleString = (str: string): string => {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const j = randomValues[0] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
};

export const generateTempPassword = (): string => {
  return generateSecurePassword(12);
};

export const generateApiKey = (): string => {
  return generateSecurePassword(32);
};
