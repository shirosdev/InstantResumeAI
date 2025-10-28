// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import './styles/Auth.css';
import App from './App';

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render WITHOUT StrictMode to avoid double-rendering issues

root.render(
  <App />
);

// Optional: Register service worker for PWA features
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();