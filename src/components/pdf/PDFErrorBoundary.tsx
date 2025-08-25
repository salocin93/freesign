import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, FileX, AlertTriangle, Upload, Home } from 'lucide-react';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { DocumentError } from '@/utils/errorTypes';
import { env } from '@/utils/env';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  documentId?: string;
  documentName?: string;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  key: number;
  retryCount: number;
  errorInfo: React.ErrorInfo | null;
}

export class PDFErrorBoundary extends React.Component<Props, State> {
  private maxRetries = 3;

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
      : new DocumentError(
          error instanceof Error ? error.message : 'Failed to load PDF viewer',
          'VIEWER_ERROR'
        );
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = error instanceof AppError 
      ? error 
      : new DocumentError(
          error instanceof Error ? error.message : 'Failed to load PDF viewer',
          'VIEWER_ERROR'
        );
    
    // Enhanced error tracking with PDF-specific context
    trackError(appError, 'PDFErrorBoundary', {
      componentStack: errorInfo.componentStack,
      documentId: this.props.documentId,
      documentName: this.props.documentName,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      pdfSpecific: true,
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
        console.error('Error in PDF error boundary callback:', callbackError);
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
    } else {
      // If max retries reached, suggest reloading the page
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleUploadNew = () => {
    window.location.href = '/upload';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const isDevelopment = env.isDevelopment;
      const canRetry = retryCount < this.maxRetries;
      const documentName = this.props.documentName || 'document';

      return (
        <div className="pdf-error-boundary w-full h-full flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <FileX className="h-5 w-5" />
                PDF Viewer Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load the PDF viewer for {documentName}.
                  {retryCount > 0 && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Retry attempts: {retryCount}/{this.maxRetries}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">This could be due to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Corrupted PDF file</li>
                  <li>Browser compatibility issues</li>
                  <li>Large file size causing timeout</li>
                </ul>
              </div>

              {isDevelopment && error && (
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div className="font-semibold text-destructive mb-1">Technical Details:</div>
                  <div className="text-xs">
                    <strong>Error:</strong> {error.message}
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
                  <Button onClick={this.resetComponent} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {retryCount > 0 && `(${this.maxRetries - retryCount} left)`}
                  </Button>
                )}
                
                <Button onClick={this.handleReload} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button onClick={this.handleUploadNew} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                If this issue persists, try using a different browser or contact support.
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