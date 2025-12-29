#!/bin/sh
set -e

# Generate config.js from environment variables
# REACT_APP_API_URL should be the base URL without /api suffix
# because api.js endpoints already include /api prefix
cat > /app/build/config.js <<EOF
window.REACT_APP_API_URL = "${REACT_APP_API_URL:-http://localhost:3000}";
window.REACT_APP_KEYCLOAK_URL = "${REACT_APP_KEYCLOAK_URL:-http://localhost:8080}";
window.REACT_APP_KEYCLOAK_REALM = "${REACT_APP_KEYCLOAK_REALM:-ClinicRealm}";
window.REACT_APP_KEYCLOAK_CLIENT_ID = "${REACT_APP_KEYCLOAK_CLIENT_ID:-siem-dashboard}";
EOF

echo "Config generated:"
cat /app/build/config.js

# Start serve
exec serve -s /app/build -l 3002
