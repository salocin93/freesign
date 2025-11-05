import { useState, useCallback } from 'react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { attemptErrorRecovery } from '@/utils/errorRecovery';
import { NetworkError, ApiError } from '@/utils/errorTypes';

interface UseApiOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: AppError) => void;
}

interface UseApiReturn<T, Args extends unknown[]> {
  data: T | null;
  error: AppError | null;
  isLoading: boolean;
  execute: (...args: Args) => Promise<void>;
  reset: () => void;
}

export function useApi<T, Args extends unknown[] = []>(
  operation: (...args: Args) => Promise<T>,
  context: string,
  options: UseApiOptions = {}
): UseApiReturn<T, Args> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
  }, []);

  const execute = useCallback(async (...args: Args) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation(...args);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'An unexpected error occurred',
            'API_ERROR',
            err
          );

      // Track the error
      await trackError(appError, context);

      // Attempt recovery for network and API errors
      if (appError instanceof NetworkError || appError instanceof ApiError) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          setRetryCount(prev => prev + 1);
          return execute(...args);
        }

        const recovered = await attemptErrorRecovery(appError, {
          maxAttempts: maxRetries,
          onRecovery: () => {
            setError(null);
            onSuccess?.(data);
          },
        });

        if (!recovered) {
          setError(appError);
          onError?.(appError);
        }
      } else {
        setError(appError);
        onError?.(appError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [operation, context, retryCount, maxRetries, retryDelay, onSuccess, onError, data]);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
} 