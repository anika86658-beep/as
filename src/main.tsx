import './utils/fetchPolyfill';
import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runVersionMigration, forceClearCacheAndReload } from './utils/versionCheck';

// Execute automatic version check and client cache migration
runVersionMigration();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Arishten App Error Boundary Caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fdfa',
          color: '#1a3826',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            padding: '36px 30px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 50, 20, 0.08)',
            border: '1px solid #e1eee4'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#eaf5ee',
              color: '#1b6b37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 18px auto'
            }}>
              🌿
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: '#123820' }}>
              অ্যারিশটেন অর্গানিক পিওর
            </h1>
            <p style={{ fontSize: '15px', color: '#526e5a', marginBottom: '20px', lineHeight: 1.6 }}>
              ওয়েবসাইট লোড হতে সাময়িক সমস্যা হয়েছে। দয়া করে পেইজটি রিফ্রেশ দিন অথবা ক্যাশ ক্লিয়ার করুন।
            </p>
            <button
              onClick={() => forceClearCacheAndReload()}
              style={{
                backgroundColor: '#1b6b37',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              🔄 পেইজ রিফ্রেশ দিন
            </button>
            {this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left', fontSize: '12px', color: '#888' }}>
                <summary style={{ cursor: 'pointer', color: '#555' }}>Technical Details</summary>
                <pre style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '6px', overflowX: 'auto' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
