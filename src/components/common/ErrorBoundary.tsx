import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Root and component-level ErrorBoundary for graceful runtime crash recovery.
 * Provides accessible fallback UI without leaking stack traces or sensitive credentials.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate an opaque, non-sensitive reference code for error correlation
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const errorId = `ERR-${timestampStr}-${randomSuffix}`;

    return {
      hasError: true,
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // Clean console logging; stack trace is NOT exposed to user UI
    console.error(`[ErrorBoundary ${this.state.errorId}] Caught render exception:`, error.message);
  }

  public resetError = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
    try {
      this.setState({
        hasError: false,
        error: null,
        errorId: null
      });
    } catch {
      // Ignored in non-DOM/SSR test harnesses
    }
  };

  public handleNavigateHome = (): void => {
    this.resetError();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error || new Error('Render error'),
          resetError: this.resetError
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[420px] flex items-center justify-center p-6 bg-slate-50 text-text-primary"
        >
          <div className="max-w-md w-full bg-surface border border-border rounded-xl shadow-lg p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                An unexpected view error occurred
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                The application encountered an unexpected issue while rendering this section.
                Your authenticated session and underlying ticket data remain secure.
              </p>
            </div>

            {this.state.errorId && (
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Reference Code:</span>
                <span className="font-bold">{this.state.errorId}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.resetError}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors shadow-xs"
              >
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
