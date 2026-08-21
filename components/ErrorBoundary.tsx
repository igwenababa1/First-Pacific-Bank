
import React, { Component, ErrorInfo, ReactNode } from 'react';
// FIX: Replaced missing icon with correct one
import { PremiumReservedBankLogo } from './Icons';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    
    // SEND ERROR TO SERVER FOR LOGGING
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, componentStack: errorInfo.componentStack })
    }).catch(console.error);
  }

  private handleHardReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (err) {
      console.error("Failed to clear service worker cache:", err);
    } finally {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white flex flex-col items-center justify-center p-4">
              <div className="text-center max-w-lg">
                  <div className="inline-block p-4 rounded-full shadow-lg bg-slate-50 dark:bg-slate-900 mb-6">
                      <PremiumReservedBankLogo />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-100 glow-text">An Unexpected Error Occurred</h1>
                  <p className="mt-4 text-[#0F172A] dark:text-white">
                      We're sorry for the inconvenience. Our team has been notified of the issue.
                      Please try refreshing the page to continue.
                  </p>
                  
                  {this.state.error && (
                      <div className="mt-6 p-4 bg-red-900 text-red-200 border border-red-500/30 rounded-xl text-left overflow-auto max-w-full text-xs font-mono">
                          <p className="font-bold mb-2">Error Details:</p>
                          <p>{this.state.error.message}</p>
                          <pre className="mt-2 text-[10px] whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                  )}

                  <button
                      onClick={this.handleHardReload}
                      className="mt-8 inline-flex items-center space-x-3 px-6 py-3 text-md font-bold bg-primary rounded-lg shadow-lg cursor-pointer hover:opacity-90"
                  >
                      <span>Refresh Page</span>
                  </button>
              </div>
          </div>
      );
    }

    return (this as any).props.children;
  }
}
