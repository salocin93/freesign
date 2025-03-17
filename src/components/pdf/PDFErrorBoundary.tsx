import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  key: number;
}

export class PDFErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, key: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PDF Viewer Error:', error, errorInfo);
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