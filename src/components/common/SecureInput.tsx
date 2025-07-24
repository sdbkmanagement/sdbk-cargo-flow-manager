
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecureInputProps {
  id?: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

export const SecureInput = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  disabled,
  required,
  validation
}: SecureInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInput = (inputValue: string): string | null => {
    if (!validation) return null;

    if (validation.required && !inputValue.trim()) {
      return 'Ce champ est requis';
    }

    if (validation.minLength && inputValue.length < validation.minLength) {
      return `Minimum ${validation.minLength} caractères requis`;
    }

    if (validation.maxLength && inputValue.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} caractères autorisés`;
    }

    if (validation.pattern && !validation.pattern.test(inputValue)) {
      return 'Format invalide';
    }

    if (validation.custom) {
      return validation.custom(inputValue);
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Sanitize input - remove potentially dangerous characters
    const sanitizedValue = newValue.replace(/[<>]/g, '');
    
    const validationError = validateInput(sanitizedValue);
    setError(validationError);
    
    onChange(sanitizedValue);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            className,
            error && 'border-red-500 focus:border-red-500',
            type === 'password' && 'pr-10'
          )}
          disabled={disabled}
          required={required}
        />
        
        {type === 'password' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};
