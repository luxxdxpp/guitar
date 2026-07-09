import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe polyfill/override for alert and confirm to prevent sandboxed iframe crashes
if (typeof window !== 'undefined') {
  window.alert = function (message) {
    console.info('[Sandbox Alert Intercepted]:', message);
    window.dispatchEvent(new CustomEvent('app-alert-toast', { detail: message }));
  };

  window.confirm = function (message) {
    console.info('[Sandbox Confirm Intercepted - auto-consented]:', message);
    return true; // Safe auto-consent fallback
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
