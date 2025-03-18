import { AppError } from './errorHandling';
import { NetworkError, ApiError, DatabaseError } from './errorTypes';

interface RecoveryStrategy {
  canHandle: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
  priority: number;
}

interface RecoveryOptions {
  maxAttempts?: number;
  timeout?: number;
  onRecovery?: () => void;
  onFailure?: (error: AppError) => void;
}

class ErrorRecovery {
  private static instance: ErrorRecovery;
  private strategies: RecoveryStrategy[] = [];
  private recoveryInProgress = false;

  private constructor() {}

  static getInstance(): ErrorRecovery {
    if (!ErrorRecovery.instance) {
      ErrorRecovery.instance = new ErrorRecovery();
    }
    return ErrorRecovery.instance;
  }

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    // Sort by priority (higher priority first)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  private async executeStrategy(
    strategy: RecoveryStrategy,
    error: AppError,
    options: RecoveryOptions
  ): Promise<boolean> {
    try {
      await Promise.race([
        strategy.recover(error),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Recovery timeout')), options.timeout || 5000)
        ),
      ]);
      options.onRecovery?.();
      return true;
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      return false;
    }
  }

  async attemptRecovery(error: AppError, options: RecoveryOptions = {}): Promise<boolean> {
    if (this.recoveryInProgress) {
      console.warn('Recovery already in progress');
      return false;
    }

    this.recoveryInProgress = true;
    const maxAttempts = options.maxAttempts || 3;
    let attempts = 0;

    try {
      for (const strategy of this.strategies) {
        if (!strategy.canHandle(error)) continue;

        while (attempts < maxAttempts) {
          attempts++;
          const success = await this.executeStrategy(strategy, error, options);
          if (success) {
            this.recoveryInProgress = false;
            return true;
          }
        }
      }

      options.onFailure?.(error);
      return false;
    } finally {
      this.recoveryInProgress = false;
    }
  }
}

// Predefined recovery strategies
const networkRecoveryStrategy: RecoveryStrategy = {
  canHandle: (error) => error instanceof NetworkError,
  recover: async () => {
    // Check network connectivity
    const isOnline = await fetch('/api/health').then(() => true).catch(() => false);
    if (!isOnline) {
      throw new Error('Network is still offline');
    }
  },
  priority: 100,
};

const apiRecoveryStrategy: RecoveryStrategy = {
  canHandle: (error) => error instanceof ApiError,
  recover: async (error) => {
    if (error instanceof ApiError && error.statusCode === 429) {
      // Handle rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  },
  priority: 90,
};

const databaseRecoveryStrategy: RecoveryStrategy = {
  canHandle: (error) => error instanceof DatabaseError,
  recover: async () => {
    // Attempt to reconnect to database
    // This would be implemented based on your database client
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  priority: 80,
};

// Initialize with default strategies
const errorRecovery = ErrorRecovery.getInstance();
errorRecovery.registerStrategy(networkRecoveryStrategy);
errorRecovery.registerStrategy(apiRecoveryStrategy);
errorRecovery.registerStrategy(databaseRecoveryStrategy);

export const attemptErrorRecovery = async (
  error: AppError,
  options: RecoveryOptions = {}
): Promise<boolean> => {
  return errorRecovery.attemptRecovery(error, options);
};

export const registerRecoveryStrategy = (strategy: RecoveryStrategy): void => {
  errorRecovery.registerStrategy(strategy);
}; 