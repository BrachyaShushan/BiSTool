import React from 'react';

interface ErrorBoundaryProps {
    children?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ error, errorInfo });
        // You can log error to an error reporting service here
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Something went wrong.</h2>
                    <p className="text-gray-700 dark:text-gray-200 mb-4">An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.</p>
                    {this.state.error && (
                        <pre className="bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200 rounded p-4 text-xs overflow-x-auto max-w-xl mb-2">
                            {this.state.error.toString()}
                        </pre>
                    )}
                    {this.state.errorInfo && (
                        <details className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-w-xl">
                            {this.state.errorInfo.componentStack}
                        </details>
                    )}
                </div>
            );
        }
        return this.props.children ?? null;
    }
}

export default ErrorBoundary; 