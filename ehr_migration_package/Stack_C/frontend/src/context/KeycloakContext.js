import React, { createContext, useContext } from 'react';

const KeycloakContext = createContext(null);

export const KeycloakProvider = ({ children, keycloak, isLoading, initialized }) => {
  return (
    <KeycloakContext.Provider value={{ keycloak, initialized }}>
      {children}
    </KeycloakContext.Provider>
  );
};

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within KeycloakProvider');
  }
  return context;
};

