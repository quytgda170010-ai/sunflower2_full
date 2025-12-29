import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useKeycloakInit } from './hooks/useKeycloakInit';
import { KeycloakProvider } from './context/KeycloakContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SecurityMonitoring from './pages/SecurityMonitoring';
import UserManagement from './pages/UserManagement';
import LoginRedirect from './pages/LoginRedirect';
import LawRuleCatalog from './pages/LawRuleCatalog';
import MySQLLogs from './pages/MySQLLogs';

// Light theme matching port 3000
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('keycloak_token');

  if (!token) {
    return <LoginRedirect />;
  }

  return children;
}

function App() {
  const { keycloak, isLoading, error, initialized } = useKeycloakInit();

  console.log('App rendering - isLoading:', isLoading, 'keycloak:', !!keycloak, 'authenticated:', keycloak?.authenticated, 'initialized:', initialized, 'error:', error);

  if (error) {
    console.error('Keycloak initialization error:', error);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ color: 'red' }}>Error initializing Keycloak</div>
        <div style={{ color: '#666', fontSize: '14px', fontFamily: 'monospace' }}>{error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        backgroundColor: '#f5f5f5'
      }}>
        Loading...
      </div>
    );
  }

  if (!keycloak?.authenticated) {
    return <LoginRedirect />;
  }

  return (
    <KeycloakProvider keycloak={keycloak} isLoading={isLoading} initialized={initialized}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/security-monitoring" element={<SecurityMonitoring />} />
                    <Route path="/behavior-monitoring" element={<SecurityMonitoring initialMode="behavior" />} />
                    <Route path="/law-rules" element={<LawRuleCatalog />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/mysql-logs" element={<MySQLLogs />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ThemeProvider>
    </KeycloakProvider>
  );
}

export default App;


