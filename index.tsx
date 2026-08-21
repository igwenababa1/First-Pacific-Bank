import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './components/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { RealTimeSyncProvider } from './components/RealTimeSyncProvider';

// Safety wrapper to catch mounting errors
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("FATAL: Could not find 'root' element in index.html");
  }

  // Clear existing content (e.g., error messages)
  rootElement.innerHTML = '';

  const root = createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <ThemeProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <BrandingProvider>
                  <RealTimeSyncProvider>
                    <App />
                  </RealTimeSyncProvider>
                </BrandingProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </ThemeProvider>
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log("App mounted successfully.");

  // Register Workbox Service Worker for offline resilience
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('🛡️ [Service Worker] Registered successfully with scope:', reg.scope);
        })
        .catch(err => {
          console.error('🛡️ [Service Worker] Registration failed:', err);
        });
    });
  }
} catch (e) {
  console.error("App failed to mount:", e);
  const root = document.getElementById('root') || document.body;
  root.innerHTML = `
    <div style="color:white; background:#7f1d1d; padding:20px; font-family:sans-serif; margin:20px; border-radius:8px;">
        <h3 style="margin-top:0">Failed to mount Application</h3>
        <pre>${e instanceof Error ? e.message : String(e)}</pre>
        <p>Check console for more details.</p>
    </div>
  `;
}