import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { keepAppUpdated } from './appUpdate';

keepAppUpdated();

// Hooks for the automated tests; only in `vite --mode emulator`, never in the production bundle.
if (import.meta.env.MODE === 'emulator') import('./testHooks');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
