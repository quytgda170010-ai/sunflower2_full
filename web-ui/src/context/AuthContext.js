import React, { createContext, useContext, useEffect } from 'react';
import { useKeycloak } from './KeycloakContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { keycloak } = useKeycloak();

  useEffect(() => {
    if (keycloak?.token) {
      localStorage.setItem('keycloak_token', keycloak.token);
    }
  }, [keycloak?.token]);

  const value = {
    isAuthenticated: keycloak?.authenticated,
    user: keycloak?.tokenParsed,
    token: keycloak?.token,
    roles: keycloak?.tokenParsed?.roles || [],
    logout: () => keycloak?.logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

