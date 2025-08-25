/**
 * Signature Error Boundary Component
 * 
 * Specialized error boundary for signature-related components and operations.
 * Provides context-specific error handling for signature canvas, signing workflows,
 * and signature verification processes.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Pen, AlertTriangle, SkipForward } from 'lucide-react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { env } from '@/utils/env';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  onSkip?: () => void;
  fallback?: React.ReactNode;
  signatureType?: 'draw' | 'type' | 'upload';
  documentId?: string;
  allowSkip?: boolean;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  key: number;
  retryCount: number;
  errorInfo: React.ErrorInfo | null;
}

export class SignatureErrorBoundary extends React.Component<Props, State> {
  private maxRetries = 2; // Lower retry count for signature operations

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      key: 0, 
      retryCount: 0,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'Signature operation failed',
          'SIGNATURE_ERROR',
          error
        );
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'Signature operation failed',
          'SIGNATURE_ERROR',
          error
        );
    
    // Enhanced error tracking with signature-specific context
    trackError(appError, 'SignatureErrorBoundary', {
      componentStack: errorInfo.componentStack,
      signatureType: this.props.signatureType,
      documentId: this.props.documentId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      signatureSpecific: true,
    });

    this.setState({
      error: appError,
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      try {
        this.props.onError(error);
      } catch (callbackError) {
        console.error('Error in signature error boundary callback:', callbackError);
      }
    }
  }

  resetComponent = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        key: prevState.key + 1,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleSkip = () => {
    if (this.props.onSkip) {
      this.props.onSkip();
    }
  };

  getSignatureTypeLabel = () => {
    const { signatureType } = this.props;
    switch (signatureType) {
      case 'draw': return 'drawing signature';
      case 'type': return 'typing signature';
      case 'upload': return 'uploading signature';
      default: return 'signature operation';
    }
  };

  getSuggestions = () => {
    const { signatureType } = this.props;
    
    const commonSuggestions = [
      'Try refreshing the page',
      'Check your internet connection',
      'Clear your browser cache'
    ];

    const typeSuggestions = {
      draw: [
        'Try using a different signature method (Type or Upload)',
        'Ensure touch/mouse input is working',
        'Try a different browser if touch is not responsive'
      ],
      type: [
        'Try using a different signature method (Draw or Upload)',
        'Check if special characters are causing issues',
        'Try a simpler signature text'
      ],
      upload: [
        'Try using a different signature method (Draw or Type)',
        'Ensure the image file is not corrupted',
        'Try a smaller image file (under 5MB)',
        'Use supported formats: PNG, JPG, or SVG'
      ]
    };

    return [
      ...commonSuggestions,
      ...(signatureType ? typeSuggestions[signatureType] || [] : [])
    ];
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const isDevelopment = env.isDevelopment;
      const canRetry = retryCount < this.maxRetries;
      const signatureTypeLabel = this.getSignatureTypeLabel();
      const suggestions = this.getSuggestions();

      return (
        <div className="signature-error-boundary w-full flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Pen className="h-5 w-5" />
                Signature Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An error occurred while {signatureTypeLabel}.
                  {retryCount > 0 && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Retry attempts: {retryCount}/{this.maxRetries}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Try these solutions:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {isDevelopment && error && (
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div className="font-semibold text-destructive mb-1">Technical Details:</div>
                  <div className="text-xs">
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div className="text-xs mt-1">
                    <strong>Type:</strong> {this.props.signatureType || 'unknown'}
                  </div>
                  {error.code && (
                    <div className="text-xs mt-1">
                      <strong>Code:</strong> {error.code}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {canRetry && (
                  <Button onClick={this.resetComponent} variant="default" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {retryCount > 0 && `(${this.maxRetries - retryCount} left)`}
                  </Button>
                )}
                
                {this.props.allowSkip && this.props.onSkip && (
                  <Button onClick={this.handleSkip} variant="outline" size="sm">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip for Now
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {this.props.allowSkip ? (
                  'You can skip this step and add your signature later.'
                ) : (
                  'A signature is required to continue. Please try again or contact support if the issue persists.'
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div key={this.state.key}>
        {this.props.children}
      </div>
    );
  }
}

export default SignatureErrorBoundary;