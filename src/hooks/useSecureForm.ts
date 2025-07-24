
import { useState, useCallback } from 'react';
import { ValidationResult, sanitizeInput } from '@/utils/securityValidation';

interface FormField {
  value: string;
  error: string;
  touched: boolean;
}

interface UseSecureFormProps {
  initialValues: Record<string, string>;
  validators: Record<string, (value: string) => ValidationResult>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

export const useSecureForm = ({ initialValues, validators, onSubmit }: UseSecureFormProps) => {
  const [fields, setFields] = useState<Record<string, FormField>>(() => {
    const initial: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(key => {
      initial[key] = {
        value: initialValues[key],
        error: '',
        touched: false
      };
    });
    return initial;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const updateField = useCallback((name: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value: sanitizedValue,
        touched: true,
        error: ''
      }
    }));
  }, []);

  const validateField = useCallback((name: string) => {
    const field = fields[name];
    if (!field || !validators[name]) return;

    const validation = validators[name](field.value);
    
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error: validation.errors.join(', ')
      }
    }));
  }, [fields, validators]);

  const validateAllFields = useCallback(() => {
    let isValid = true;
    const newFields = { ...fields };

    Object.keys(fields).forEach(name => {
      if (validators[name]) {
        const validation = validators[name](fields[name].value);
        newFields[name] = {
          ...newFields[name],
          error: validation.errors.join(', ')
        };
        if (!validation.isValid) {
          isValid = false;
        }
      }
    });

    setFields(newFields);
    return isValid;
  }, [fields, validators]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setSubmitError('');
    
    if (!validateAllFields()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const values: Record<string, string> = {};
      Object.keys(fields).forEach(key => {
        values[key] = fields[key].value;
      });
      
      await onSubmit(values);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, isSubmitting, validateAllFields, onSubmit]);

  const resetForm = useCallback(() => {
    setFields(prev => {
      const reset: Record<string, FormField> = {};
      Object.keys(prev).forEach(key => {
        reset[key] = {
          value: initialValues[key] || '',
          error: '',
          touched: false
        };
      });
      return reset;
    });
    setSubmitError('');
  }, [initialValues]);

  const getFieldProps = useCallback((name: string) => ({
    value: fields[name]?.value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateField(name, e.target.value),
    onBlur: () => validateField(name),
    error: fields[name]?.error || '',
    required: true
  }), [fields, updateField, validateField]);

  const hasErrors = Object.values(fields).some(field => field.error);
  const isFormValid = Object.values(fields).every(field => !field.error && field.touched);

  return {
    fields,
    isSubmitting,
    submitError,
    hasErrors,
    isFormValid,
    updateField,
    validateField,
    handleSubmit,
    resetForm,
    getFieldProps
  };
};
