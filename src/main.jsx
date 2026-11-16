import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { keepAppUpdated } from '@/app/appUpdate';
import './index.css';

keepAppUpdated();

// Hooks for the automated tests; only in `vite --mode emulator`, never in the production bundle.
if (import.meta.env.MODE === 'emulator') import('@/dev/testHooks');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
