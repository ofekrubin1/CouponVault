import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { keepAppUpdated } from '@/app/appUpdate';
import './index.css';

keepAppUpdated();

// Save the app on the device so it opens without signal (public/sw.js). Not with the dev server: it serves
// unbuilt files and reloads them live, which a saved copy would get in the way of.
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[offline]', e)));
}

// Hooks for the automated tests; only in `vite --mode emulator`, never in the production bundle.
if (import.meta.env.MODE === 'emulator') import('@/dev/testHooks');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
