// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import { HelmetProvider } from 'react-helmet-async';
import './styles/Auth.css';
import App from './App';

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render app with HelmetProvider wrapper
root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);