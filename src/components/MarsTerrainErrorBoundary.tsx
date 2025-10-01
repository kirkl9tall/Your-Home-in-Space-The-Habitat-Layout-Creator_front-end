import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MarsTerrainErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mars Terrain Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full bg-red-900 text-red-100">
            <div className="text-center max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2">🚨 Mars Terrain Error</h3>
              <p className="text-sm mb-4">
                {this.state.error?.message || 'An unexpected error occurred while loading the Mars terrain.'}
              </p>
              <div className="text-xs text-red-200 mb-4">
                <p>Common solutions:</p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Refresh the page</li>
                  <li>• Check internet connection</li>
                  <li>• Try a different browser</li>
                  <li>• Disable browser extensions</li>
                </ul>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors mr-2"
              >
                Reload Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined })} 
                className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}