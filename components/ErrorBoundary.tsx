import React, { ReactNode, ErrorInfo } from 'react';
import { loggerService } from '../services/loggerService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary Component - Catches and displays errors gracefully
 * Prevents entire app crash from component errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Log error
    loggerService.error(
      'ErrorBoundary',
      `Component error caught: ${error.message}`,
      error,
      { componentStack: errorInfo.componentStack }
    );

    // Update error count
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }));

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // If too many errors, clear and reset
    if (this.state.errorCount > 5) {
      this.setState({ hasError: false, error: null, errorCount: 0 });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-white p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-black uppercase tracking-widest mb-2">
                Something Went Wrong
              </h1>
              <p className="text-text-secondary text-sm">
                We encountered an unexpected error. Please try again or contact support.
              </p>
            </div>

            {error && process.env.NODE_ENV === 'development' && (
              <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 space-y-2">
                <h3 className="text-accent-red font-bold text-xs uppercase">Error Details (Dev Only)</h3>
                <p className="text-xs font-mono text-white break-all">{error.message}</p>
                {error.stack && (
                  <details className="cursor-pointer">
                    <summary className="text-xs text-accent-red hover:text-accent-red/80">Stack Trace</summary>
                    <pre className="text-xs text-white/60 mt-2 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-lg bg-primary text-white font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 rounded-lg bg-slate-700 text-white font-bold uppercase tracking-widest hover:bg-slate-600 transition-all"
              >
                Go Home
              </button>
            </div>

            <div className="text-xs text-text-secondary text-center">
              Error Reference: {Date.now()}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
