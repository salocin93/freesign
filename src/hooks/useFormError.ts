import { useState, useCallback } from 'react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { ValidationError } from '@/utils/errorTypes';

interface FormError {
  field: string;
  message: string;
  code?: string;
}

interface UseFormErrorReturn {
  errors: FormError[];
  setError: (field: string, message: string, code?: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getFieldError: (field: string) => FormError | undefined;
  handleFormError: (error: unknown, context: string) => AppError;
}

export function useFormError(): UseFormErrorReturn {
  const [errors, setErrors] = useState<FormError[]>([]);

  const setError = useCallback((field: string, message: string, code?: string) => {
    setErrors(prev => {
      const existingErrorIndex = prev.findIndex(e => e.field === field);
      if (existingErrorIndex >= 0) {
        const newErrors = [...prev];
        newErrors[existingErrorIndex] = { field, message, code };
        return newErrors;
      }
      return [...prev, { field, message, code }];
    });
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field);
  }, [errors]);

  const handleFormError = useCallback((error: unknown, context: string) => {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          'FORM_ERROR',
          error
        );
    
    // Track the error
    trackError(appError, context);
    
    // If the error has field information, set it as a form error
    if (appError instanceof ValidationError) {
      const field = appError.details?.field as string;
      if (field) {
        setError(field, appError.message, appError.code);
      }
    } else if (appError.details && typeof appError.details === 'object' && 'field' in appError.details) {
      const details = appError.details as { field: string };
      setError(details.field, appError.message, appError.code);
    }
    
    return appError;
  }, [setError]);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors: errors.length > 0,
    getFieldError,
    handleFormError,
  };
} 