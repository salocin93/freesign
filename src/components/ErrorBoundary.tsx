import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Bug, Home, Copy, Check } from 'lucide-react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { env } from '@/utils/env';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number | boolean>;
  isolate?: boolean;
  name?: string;
  enableRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
  copied: boolean;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      eventId: null,
      copied: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          'BOUNDARY_ERROR',
          error
        );
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          'BOUNDARY_ERROR',
          error
        );
    
    // Enhanced error tracking with more context
    let eventId: string | null = null;
    try {
      eventId = trackError(appError, 'ErrorBoundary', {
        componentStack: errorInfo.componentStack,
        component: this.props.name || 'Unknown',
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isolate: this.props.isolate,
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }

    this.setState({
      error: appError,
      errorInfo,
      eventId,
    });

    // Call custom error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Error in error boundary callback:', callbackError);
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset error state if any resetKeys changed
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevResetKeys[idx]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      copied: false,
    });
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
        copied: false,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // If max retries reached, reload the page
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const { error, errorInfo, eventId } = this.state;
    const errorDetails = `
Error ID: ${eventId || 'N/A'}
Component: ${this.props.name || 'Unknown'}
Message: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, eventId, copied, retryCount } = this.state;
      const isDevelopment = env.isDevelopment;
      const componentName = this.props.name || 'Component';
      const canRetry = this.props.enableRetry !== false && retryCount < this.maxRetries;

      return (
        <div className="error-boundary-container p-4">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong in {componentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred. The error has been logged automatically.
                  {eventId && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Error ID: {eventId}
                    </span>
                  )}
                  {retryCount > 0 && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Retry attempts: {retryCount}/{this.maxRetries}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {isDevelopment && error && (
                <div className="bg-muted p-4 rounded-md text-sm font-mono space-y-2">
                  <div className="font-semibold text-destructive">Error Details:</div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Type:</strong> {error.name}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  
                  <Button
                    onClick={this.handleCopyError}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Error Details
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {canRetry && (
                  <Button onClick={this.handleRetry} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {retryCount > 0 && `(${this.maxRetries - retryCount} left)`}
                  </Button>
                )}
                
                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {!this.props.isolate && (
                <div className="text-xs text-muted-foreground">
                  If this problem persists, please contact support with the error ID above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
} 