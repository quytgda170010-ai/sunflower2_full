import { useState, useEffect } from 'react';
import keycloak from '../keycloak';

export const useKeycloakInit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('useKeycloakInit: Starting Keycloak initialization');

    const initKeycloak = async () => {
      try {
        console.log('useKeycloakInit: Calling keycloak.init()');

        const authenticated = await keycloak.init({
          onLoad: 'login-required',
          checkLoginIframe: false,
          enableLogging: true,
        });

        console.log('useKeycloakInit: Keycloak initialized, authenticated:', authenticated);

        // Save token to localStorage
        if (keycloak.token) {
          localStorage.setItem('keycloak_token', keycloak.token);
          console.log('useKeycloakInit: Token saved to localStorage');
        }

        // Setup token refresh
        keycloak.onTokenExpired = () => {
          console.log('Token expired, refreshing...');
          keycloak.updateToken(30).then((refreshed) => {
            if (refreshed) {
              localStorage.setItem('keycloak_token', keycloak.token);
              console.log('Token refreshed');
            }
          }).catch(() => {
            console.error('Failed to refresh token');
            keycloak.login();
          });
        };

        setInitialized(true);
        setIsLoading(false);
      } catch (err) {
        console.error('useKeycloakInit: Error initializing Keycloak:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  return {
    keycloak,
    isLoading,
    error,
    initialized,
  };
};

