import { useState, useCallback, useEffect } from 'react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { attemptErrorRecovery } from '@/utils/errorRecovery';
import { ValidationError, NetworkError, ApiError } from '@/utils/errorTypes';

interface UseErrorHandlingOptions {
  context: string;
  onError?: (error: AppError) => void;
  onRecovery?: () => void;
  autoRecover?: boolean;
  maxRecoveryAttempts?: number;
}

interface UseErrorHandlingReturn {
  error: AppError | null;
  isRecovering: boolean;
  handleError: (error: unknown) => void;
  clearError: () => void;
  retry: () => Promise<void>;
}

export function useErrorHandling(options: UseErrorHandlingOptions): UseErrorHandlingReturn {
  const { context, onError, onRecovery, autoRecover = true, maxRecoveryAttempts = 3 } = options;
  const [error, setError] = useState<AppError | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const handleError = useCallback(async (error: unknown) => {
    const appError = error instanceof AppError ? error : new AppError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      error
    );

    setError(appError);
    onError?.(appError);

    // Track error
    await trackError(appError, context);

    // Attempt recovery if enabled
    if (autoRecover && (error instanceof NetworkError || error instanceof ApiError)) {
      setIsRecovering(true);
      try {
        const recovered = await attemptErrorRecovery(appError, {
          maxAttempts: maxRecoveryAttempts,
          onRecovery: () => {
            setError(null);
            onRecovery?.();
          },
        });
        if (!recovered) {
          console.error('Failed to recover from error:', appError);
        }
      } finally {
        setIsRecovering(false);
      }
    }
  }, [context, onError, onRecovery, autoRecover, maxRecoveryAttempts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async () => {
    if (!error) return;

    setIsRecovering(true);
    try {
      const recovered = await attemptErrorRecovery(error, {
        maxAttempts: maxRecoveryAttempts,
        onRecovery: () => {
          setError(null);
          onRecovery?.();
        },
      });
      if (!recovered) {
        console.error('Failed to recover from error:', error);
      }
    } finally {
      setIsRecovering(false);
    }
  }, [error, maxRecoveryAttempts, onRecovery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setIsRecovering(false);
    };
  }, []);

  return {
    error,
    isRecovering,
    handleError,
    clearError,
    retry,
  };
}

// Specialized hook for form validation errors
export function useValidationErrorHandling(options: UseErrorHandlingOptions) {
  const errorHandling = useErrorHandling(options);

  const handleValidationError = useCallback((error: unknown) => {
    if (error instanceof ValidationError) {
      errorHandling.handleError(error);
    } else {
      errorHandling.handleError(new ValidationError(
        error instanceof Error ? error.message : 'Validation failed',
        'unknown'
      ));
    }
  }, [errorHandling]);

  return {
    ...errorHandling,
    handleValidationError,
  };
}

// Specialized hook for API errors
export function useApiErrorHandling(options: UseErrorHandlingOptions) {
  const errorHandling = useErrorHandling({
    ...options,
    autoRecover: true,
  });

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      errorHandling.handleError(error);
    } else {
      errorHandling.handleError(new ApiError(
        error instanceof Error ? error.message : 'API request failed',
        undefined,
        'unknown'
      ));
    }
  }, [errorHandling]);

  return {
    ...errorHandling,
    handleApiError,
  };
}

// Specialized hook for network errors
export function useNetworkErrorHandling(options: UseErrorHandlingOptions) {
  const errorHandling = useErrorHandling({
    ...options,
    autoRecover: true,
  });

  const handleNetworkError = useCallback((error: unknown) => {
    if (error instanceof NetworkError) {
      errorHandling.handleError(error);
    } else {
      errorHandling.handleError(new NetworkError(
        error instanceof Error ? error.message : 'Network error occurred'
      ));
    }
  }, [errorHandling]);

  return {
    ...errorHandling,
    handleNetworkError,
  };
} 