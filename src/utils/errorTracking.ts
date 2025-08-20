import { AppError } from './errorHandling';

// Type declarations for third-party error tracking services
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: { tags?: Record<string, string> }) => void;
      setUser: (user: { id: string } | null) => void;
    };
    LogRocket?: {
      captureException: (error: Error) => void;
    };
  }
}

interface ErrorTrackingConfig {
  enabled: boolean;
  service?: 'sentry' | 'logrocket' | 'custom';
  customEndpoint?: string;
  environment: 'development' | 'production' | 'staging';
}

interface ErrorEvent {
  error: AppError;
  context: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackingConfig;
  private queue: ErrorEvent[] = [];
  private isProcessing = false;

  private constructor(config: ErrorTrackingConfig) {
    this.config = config;
  }

  static initialize(config: ErrorTrackingConfig): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(config);
    }
    return ErrorTracker.instance;
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      throw new Error('ErrorTracker not initialized');
    }
    return ErrorTracker.instance;
  }

  private async sendToSentry(event: ErrorEvent): Promise<void> {
    // Implement Sentry integration
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(event.error, {
        extra: {
          context: event.context,
          metadata: event.metadata,
        },
      });
    }
  }

  private async sendToLogRocket(event: ErrorEvent): Promise<void> {
    // Implement LogRocket integration
    if (typeof window !== 'undefined' && window.LogRocket) {
      window.LogRocket.captureException(event.error);
    }
  }

  private async sendToCustomEndpoint(event: ErrorEvent): Promise<void> {
    if (!this.config.customEndpoint) return;

    try {
      await fetch(this.config.customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send error to custom endpoint:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, 10);

    try {
      await Promise.all(
        batch.map(async (event) => {
          switch (this.config.service) {
            case 'sentry':
              await this.sendToSentry(event);
              break;
            case 'logrocket':
              await this.sendToLogRocket(event);
              break;
            case 'custom':
              await this.sendToCustomEndpoint(event);
              break;
          }
        })
      );
    } catch (error) {
      console.error('Error processing error tracking queue:', error);
      // Put failed events back in the queue
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  async trackError(error: AppError, context: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;

    const event: ErrorEvent = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata,
    };

    this.queue.push(event);
    await this.processQueue();
  }

  setUserId(userId: string): void {
    if (this.config.service === 'sentry' && typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser({ id: userId });
    }
  }

  clearUserId(): void {
    if (this.config.service === 'sentry' && typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser(null);
    }
  }
}

export const initializeErrorTracking = (config: ErrorTrackingConfig) => {
  ErrorTracker.initialize(config);
};

export const trackError = async (
  error: AppError,
  context: string,
  metadata?: Record<string, unknown>
) => {
  await ErrorTracker.getInstance().trackError(error, context, metadata);
};

export const setErrorTrackingUserId = (userId: string) => {
  ErrorTracker.getInstance().setUserId(userId);
};

export const clearErrorTrackingUserId = () => {
  ErrorTracker.getInstance().clearUserId();
}; 