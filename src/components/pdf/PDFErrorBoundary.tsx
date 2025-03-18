import React from 'react';
import { Button } from '@/components/ui/button';
import { AppError } from '@/utils/errorHandling';
import { trackError } from '@/utils/errorTracking';
import { DocumentError } from '@/utils/errorTypes';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  key: number;
}

export class PDFErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, key: 0 };
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
    
    // Track the error
    trackError(appError, 'PDFErrorBoundary', {
      componentStack: errorInfo.componentStack,
    });
  }

  resetComponent = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      key: prevState.key + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <p className="text-red-500 mb-2">Failed to load PDF viewer</p>
          <p className="text-sm text-gray-500 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            onClick={this.resetComponent}
          >
            Try again
          </Button>
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