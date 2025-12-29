#!/bin/sh
set -e

# Generate config.js from environment variables
cat > /app/build/config.js <<EOF
window.REACT_APP_API_URL = "${REACT_APP_API_URL:-http://localhost:3000/gateway}";
window.REACT_APP_KEYCLOAK_URL = "${REACT_APP_KEYCLOAK_URL:-http://localhost:8080}";
window.REACT_APP_KEYCLOAK_REALM = "${REACT_APP_KEYCLOAK_REALM:-ClinicRealm}";
window.REACT_APP_KEYCLOAK_CLIENT_ID = "${REACT_APP_KEYCLOAK_CLIENT_ID:-web-ui}";
EOF

echo "Config generated:"
cat /app/build/config.js

# Start serve
exec serve -s /app/build -l 3000
