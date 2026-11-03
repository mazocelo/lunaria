import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Contextos (default imports)
import ThemeProvider from './contexts/theme';
import LayoutProvider from './contexts/LayoutContext';
import AuthProvider from './contexts/AuthContext';

// Side-effect imports
import './utils/EventEmitter';
import './services/index';

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Lunaria: elemento #root nao encontrado no documento.');
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LayoutProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LayoutProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
