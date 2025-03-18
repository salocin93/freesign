import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, context: string): AppError => {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'UNKNOWN_ERROR',
        error
      );

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, appError);
  }

  // Show user-friendly toast
  toast.error(appError.message);

  return appError;
};

export const handleApiError = async (
  operation: () => Promise<unknown>,
  context: string
): Promise<unknown> => {
  try {
    return await operation();
  } catch (error) {
    throw handleError(error, context);
  }
};

export const createErrorBoundary = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    'An unexpected error occurred in the application',
    'BOUNDARY_ERROR',
    error
  );
}; 