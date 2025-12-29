import axios from 'axios';

// Use the same API URL as the main API service
// For login/logout logging, we need to call through the gateway (port 8081) like other API calls
// However, if there's a CORS issue, we can try calling directly to ehr-core (port 8000)
// Try to get from window (set by docker-entrypoint.sh), fallback to env or default
const getApiBaseUrl = () => {
  // Check window first (set by docker-entrypoint.sh)
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  // Fallback to env variable or default
  // Note: Use gateway (8081) which should handle CORS properly
  return process.env.REACT_APP_API_URL || 'https://localhost:8443';
};

const API_BASE_URL = getApiBaseUrl();

// For login/logout logging, we can try ehr-core directly if gateway fails
// This endpoint is exempt from authentication, so direct call should work
const EHR_CORE_URL = 'http://localhost:8000';

/**
 * Log login/logout events to the backend
 * @param {Object} params - Logging parameters
 * @param {string} params.username - Username
 * @param {boolean} params.success - Whether login/logout was successful
 * @param {string[]} params.roles - User roles
 * @param {string} params.eventType - 'login' or 'logout'
 */
export const logAuthEvent = async ({ username, success, roles = [], eventType = 'login' }) => {
  // Tách biệt 2 loại log:
  // 1. SESSION_LOG (user login log) - khi đăng nhập thành công → gửi đến /api/user/login
  // 2. SYSTEM_AUTH_LOG (system auth log) - cho tất cả sự kiện xác thực → gửi đến /api/system/logs

  // Use gateway URL for SIEM backend calls to avoid CORS issues
  // The gateway at port 8081 proxies /api/ to siem-backend
  const gatewayUrl = typeof window !== 'undefined' && window.REACT_APP_API_URL
    ? window.REACT_APP_API_URL
    : (process.env.REACT_APP_API_URL || 'http://localhost:8081');
  const userLoginEndpoint = `${gatewayUrl}/api/user/login`;
  const systemLogEndpoint = `${gatewayUrl}/api/system/logs`;

  try {
    // Map eventType to system log event types
    const systemEventType = eventType === 'login' ? 'LOGIN_REMOTE' :
      eventType === 'logout' ? 'LOGOUT' :
        'AUTH_EVENT';

    console.log(`[AUTH LOG] Attempting to log ${eventType}:`, { username, success, roles, systemEventType });

    // CRITICAL: Check if MFA is required and enabled
    // If MFA is required but not used, authentication should fail
    // Default to true (MFA is required) unless explicitly disabled
    const MFA_REQUIRED = process.env.REACT_APP_MFA_REQUIRED !== 'false' &&
      window.REACT_APP_MFA_REQUIRED !== 'false';
    const mfaUsed = false; // Currently not implemented, always false

    // CRITICAL: If MFA is required but not used, authentication fails
    let actualSuccess = success;
    let failureReason = null;

    if (MFA_REQUIRED && !mfaUsed && success) {
      // MFA is required but not used → authentication fails
      actualSuccess = false;
      failureReason = 'MFA_REQUIRED_BUT_NOT_USED';
    } else if (!success) {
      // Try to determine specific failure reason for other failures
      if (username === 'unknown' || !username) {
        failureReason = 'INVALID_CREDENTIALS';
      } else {
        failureReason = 'AUTHENTICATION_FAILED';
      }
    }

    // 1. Ghi SESSION_LOG cho cả thành công và thất bại (để log đăng nhập hiển thị đầy đủ)
    if (eventType === 'login') {
      try {
        const userLoginPayload = {
          username: username || 'unknown',
          success: !!success,
          roles: roles || [],
          event_type: 'login',
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
          failure_reason: failureReason
        };

        const userLoginResponse = await axios.post(userLoginEndpoint, userLoginPayload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log(`[AUTH LOG] User login log (SESSION_LOG) created:`, userLoginResponse.data);
      } catch (userLoginError) {
        console.warn(`[AUTH LOG] Failed to create user login log (SESSION_LOG):`, userLoginError);
      }
    }

    // 2. Luôn tạo SYSTEM_AUTH_LOG cho tất cả sự kiện xác thực (thành công/thất bại)
    const systemLogPayload = {
      event_id: `auth_${username || 'unknown'}_${eventType}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      rule_group: 'auth',
      event_type: systemEventType,
      actor_id: username || 'unknown',
      actor_role: 'user',
      user_id: username || 'unknown',
      username: username || 'unknown',
      auth_method: 'SSO',
      mfa_used: mfaUsed,
      result: actualSuccess ? 'SUCCESS' : 'FAILED',
      failure_reason: failureReason,
      roles: roles || [],
      src_ip: window.location.hostname, // Browser can't get real IP, use hostname
      user_agent: navigator.userAgent,
      status: actualSuccess ? 200 : 401
    };

    const response = await axios.post(systemLogEndpoint, systemLogPayload, {
      timeout: 10000, // Increase timeout to 10 seconds
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`[AUTH LOG] ${eventType} logged successfully as system log (SYSTEM_AUTH_LOG):`, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[AUTH LOG] Failed to log ${eventType} as system log:`, {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Fallback to old endpoint for backward compatibility
    const fallbackEndpoint = `${API_BASE_URL}/admin/login/log`;
    try {
      console.log(`[AUTH LOG] Trying fallback endpoint:`, fallbackEndpoint);
      const response = await axios.post(fallbackEndpoint, {
        username: username || 'unknown',
        success: success,
        roles: roles || [],
        event_type: eventType,
      }, {
        timeout: 10000, // Increase timeout to 10 seconds
        headers: {
          'Content-Type': 'application/json',
          'X-User': username || 'unknown',
          'X-User-Id': username || 'unknown',
          'X-Roles': (roles || []).join(','),
        }
      });
      console.log(`[AUTH LOG] ${eventType} logged successfully to fallback endpoint:`, response.data);
      return response.data;
    } catch (fallbackError) {
      console.error(`[AUTH LOG] All endpoints failed for ${eventType}`);
      return null;
    }
  }
};

/**
 * Extract user info from Keycloak token
 * @param {Object} keycloak - Keycloak instance
 * @returns {Object} User info including username and roles
 */
export const getUserInfoFromKeycloak = (keycloak) => {
  if (!keycloak || !keycloak.token) {
    return { username: 'unknown', roles: [] };
  }

  try {
    const tokenParts = keycloak.token.split('.');
    if (tokenParts.length !== 3) {
      return { username: 'unknown', roles: [] };
    }

    const tokenPayload = JSON.parse(atob(tokenParts[1]));
    const username = tokenPayload.preferred_username || tokenPayload.name || tokenPayload.sub || 'unknown';

    // Extract roles
    const realmRoles = tokenPayload.realm_access?.roles || [];
    const resourceRoles = Object.values(tokenPayload.resource_access || {}).flatMap(
      (client) => client.roles || []
    );
    const allRoles = [...new Set([...realmRoles, ...resourceRoles])];

    // Filter out non-user roles
    const userRoles = allRoles.filter(role =>
      !['offline_access', 'uma_authorization', 'default-roles-clinicrealm'].includes(role)
    );

    return { username, roles: userRoles };
  } catch (error) {
    console.error('[AUTH LOG] Failed to parse token:', error);
    return { username: 'unknown', roles: [] };
  }
};

