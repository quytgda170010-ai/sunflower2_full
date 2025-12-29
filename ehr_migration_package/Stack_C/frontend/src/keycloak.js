import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: window.REACT_APP_KEYCLOAK_URL || process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: window.REACT_APP_KEYCLOAK_REALM || process.env.REACT_APP_KEYCLOAK_REALM || 'ClinicRealm',
  clientId: window.REACT_APP_KEYCLOAK_CLIENT_ID || process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'siem-dashboard',
};

console.log('Keycloak Config:', keycloakConfig);

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

