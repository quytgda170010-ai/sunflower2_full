import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('index.js loading...');
console.log('window.REACT_APP_KEYCLOAK_URL:', window.REACT_APP_KEYCLOAK_URL);
console.log('window.REACT_APP_KEYCLOAK_REALM:', window.REACT_APP_KEYCLOAK_REALM);
console.log('window.REACT_APP_KEYCLOAK_CLIENT_ID:', window.REACT_APP_KEYCLOAK_CLIENT_ID);
console.log('document.getElementById("root"):', document.getElementById('root'));

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('About to render React app...');

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace; white-space: pre-wrap;">Error rendering React app:<br/>${error.message}<br/><br/>Stack: ${error.stack}</div>`;
  }
}

// Fallback if root element doesn't exist
if (!document.getElementById('root')) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Root element not found!</div>';
}

