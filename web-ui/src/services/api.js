import axios from 'axios';

// Get API URL from window config (set by docker-entrypoint.sh) or env or default
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  return process.env.REACT_APP_API_URL || 'https://localhost:8443';
};

const API_BASE_URL = getApiBaseUrl();

// Export API_BASE_URL for use in other components
export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extract patient_id from URL (path or query) to enrich audit headers
const extractPatientIdFromUrl = (url) => {
  try {
    // Support both relative and absolute URLs
    const parsed = new URL(url, API_BASE_URL);

    // 1) Path pattern: /admin/patients/{id}
    const pathMatch = parsed.pathname.match(/\/patients\/([^/]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // 2) Query string: patient_id=<id>
    const queryId = parsed.searchParams.get('patient_id');
    if (queryId) {
      return queryId;
    }
  } catch (e) {
    console.warn('extractPatientIdFromUrl failed for url:', url, e);
  }
  return null;
};

// Helper function to get user roles from token (with username fallback)
const getUserRolesFromToken = (tokenParsed) => {
  if (!tokenParsed) return [];

  // Try realm_access.roles first (standard Keycloak location)
  const realmRoles = tokenParsed.realm_access?.roles || [];
  // Try direct roles property (alternative location)
  const directRoles = tokenParsed.roles || [];
  // Try resource_access roles (client-specific roles)
  const resourceRoles = Object.values(tokenParsed.resource_access || {}).flatMap(
    (client) => client.roles || []
  );

  // Combine all roles and remove duplicates
  const allRoles = [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];

  // If no roles found, try to infer from username
  if (allRoles.length === 0 || !allRoles.some(r => ['admin', 'admin_hospital', 'head_nurse', 'head_reception', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'accountant', 'receptionist', 'patient'].includes(r))) {
    const username = (tokenParsed.preferred_username || tokenParsed.name || '').toLowerCase();

    // Username-based role mapping (fallback when Keycloak roles not assigned)
    if (username.includes('letan') || username.includes('reception') || username.includes('tieptan')) {
      return ['receptionist', ...allRoles];
    }
    if (username.includes('truongletan') || username.includes('head_reception') || username.includes('truongtieptan')) {
      return ['head_reception', ...allRoles];
    }
    if (username.includes('bacsi') || username.includes('doctor') || username.includes('bs')) {
      return ['doctor', ...allRoles];
    }
    if (username.includes('dieuduong') || username.includes('nurse') || username.includes('yd') || username.includes('dd')) {
      return ['nurse', ...allRoles];
    }
    if (username.includes('truongdieuduong') || username.includes('head_nurse') || username.includes('truongyd')) {
      return ['head_nurse', ...allRoles];
    }
    if (username.includes('duocsi') || username.includes('pharmacist') || username.includes('ds')) {
      return ['pharmacist', ...allRoles];
    }
    if (username.includes('ktv') || username.includes('lab') || username.includes('xetnghiem') || username.includes('technician')) {
      return ['lab_technician', ...allRoles];
    }
    if (username.includes('ketoan') || username.includes('accountant') || username.includes('thungan')) {
      return ['accountant', ...allRoles];
    }
    if (username.includes('giamdoc') || username.includes('admin_hospital') || username.includes('hospital_admin')) {
      return ['admin_hospital', ...allRoles];
    }
    if (username.includes('admin') || username.includes('quanly') || username.includes('quantri')) {
      return ['admin', ...allRoles];
    }
    if (username.includes('benhnhan') || username.includes('patient') || username.includes('bn')) {
      return ['patient', ...allRoles];
    }
  }

  return allRoles;
};

// Helper function to get primary role
const getPrimaryRole = (tokenParsed) => {
  const userRoles = getUserRolesFromToken(tokenParsed);
  const rolePriority = ['admin', 'admin_hospital', 'head_nurse', 'head_reception', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'accountant', 'receptionist', 'patient'];

  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return null;
};

// Helper function to get purpose based on role
const getPurposeForRole = (role) => {
  const purposeMap = {
    'receptionist': 'administrative',
    'head_reception': 'administrative',
    'doctor': 'treatment',
    'nurse': 'care',
    'head_nurse': 'care',
    'pharmacist': 'treatment',
    'lab_technician': 'treatment',
    'accountant': 'billing',
    'admin_hospital': 'audit',
    'admin': 'system_maintenance',
    'patient': 'patient_access',
  };

  return purposeMap[role] || 'administrative';
};

// Helper function to get specialty based on role
const getSpecialtyFromRoles = (roles) => {
  if (!roles || !Array.isArray(roles)) return '';

  const specialtyMap = {
    'doctor_general': 'general',
    'doctor_pediatrics': 'pediatrics',
    'doctor_surgery': 'surgery',
    'doctor_obgyn': 'obgyn',
    'doctor_ent': 'ent', // Ear Nose Throat
    'doctor_ophthalmology': 'ophthalmology', // Eye
    'doctor_dentomaxillofacial': 'dentomaxillofacial', // Dental
  };

  for (const role of roles) {
    if (specialtyMap[role]) {
      return specialtyMap[role];
    }
  }
  return '';
};

// Add token to requests
api.interceptors.request.use((config) => {
  // Try to get token from keycloak instance first, fallback to localStorage
  let token = null;
  try {
    // Try to access keycloak from window if available
    if (window.keycloak && window.keycloak.token) {
      token = window.keycloak.token;
    } else {
      token = localStorage.getItem('keycloak_token');
    }
  } catch (e) {
    token = localStorage.getItem('keycloak_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;

    // Enrich with patient_id when detectable to satisfy EMR audit rules
    const patientIdFromUrl = extractPatientIdFromUrl(config.url || '');
    if (patientIdFromUrl) {
      config.headers['X-Patient-Id'] = patientIdFromUrl;
      config.headers['X-Patient'] = patientIdFromUrl;
    }

    // Parse token to get user info and roles
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const tokenPayload = JSON.parse(atob(tokenParts[1]));

        // Get user roles (with username fallback)
        const userRoles = getUserRolesFromToken(tokenPayload);
        const primaryRole = getPrimaryRole(tokenPayload);

        // Filter out system roles before sending to backend
        const systemRoles = ['offline_access', 'default-roles-clinicrealm', 'uma_authorization',
          'manage-account', 'manage-account-links', 'view-profile'];
        const functionalRoles = userRoles.filter(role => !systemRoles.includes(role));

        // Set headers for OPA - only send functional roles
        if (functionalRoles.length > 0) {
          config.headers['X-Roles'] = functionalRoles.join(',');
          console.log('API Request - X-Roles:', functionalRoles.join(','));
        } else if (primaryRole) {
          // If no functional roles but we have a primary role, use that
          config.headers['X-Roles'] = primaryRole;
          console.log('API Request - X-Roles:', primaryRole);
        }

        // Use preferred_username if available, otherwise fallback to sub (UUID)
        const username = tokenPayload.preferred_username || tokenPayload.username || tokenPayload.sub;
        if (username) {
          config.headers['X-User'] = username;
        }

        if (tokenPayload.preferred_username) {
          config.headers['X-User-Id'] = tokenPayload.preferred_username;
        }

        if (primaryRole) {
          config.headers['X-Purpose'] = getPurposeForRole(primaryRole);
          console.log('API Request - X-Purpose:', getPurposeForRole(primaryRole));
        }

        const specialty = getSpecialtyFromRoles(userRoles);
        if (specialty) {
          config.headers['X-Specialty'] = specialty;
          console.log('API Request - X-Specialty:', specialty);
        }

        console.log('API Request Headers:', {
          'X-Roles': config.headers['X-Roles'],
          'X-User': config.headers['X-User'],
          'X-Purpose': config.headers['X-Purpose'],
          'X-Specialty': config.headers['X-Specialty'],
          'Path': config.url
        });
      }
    } catch (e) {
      console.error('Failed to parse token for headers:', e);
    }
  } else {
    console.warn('No token available for API request');
  }

  return config;
});

// Track if we're currently refreshing token to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't redirect on 401 for certain endpoints that may fail due to permissions
    // but user is still authenticated (e.g., dashboard stats for receptionist)
    const skipRedirectEndpoints = ['/admin/dashboard/stats', '/admin/dashboard/receptionist'];
    const shouldSkipRedirect = error.config?.url &&
      skipRedirectEndpoints.some(endpoint => error.config.url.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 Unauthorized detected, checking for token refresh...');
      console.log('window.keycloak exists:', !!window.keycloak);
      console.log('window.keycloak.authenticated:', window.keycloak?.authenticated);

      // Try to refresh token if we have keycloak instance
      if (window.keycloak && window.keycloak.authenticated) {
        if (isRefreshing) {
          console.log('Token refresh already in progress, queueing request...');
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log('401 received, attempting to refresh token...');
          console.log('Token expired?', window.keycloak.isTokenExpired());
          console.log('Token expired (5min)?', window.keycloak.isTokenExpired(300));

          // Try to refresh with longer validity window
          const refreshed = await window.keycloak.updateToken(30).catch(async (err) => {
            console.error('updateToken failed, trying with 0:', err);
            // If updateToken fails, try with 0 (force refresh)
            return await window.keycloak.updateToken(0);
          });

          if (refreshed) {
            const newToken = window.keycloak.token;
            localStorage.setItem('keycloak_token', newToken);
            console.log('Token refreshed successfully, retrying request...');

            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Process queued requests
            processQueue(null, newToken);
            isRefreshing = false;

            // Retry the original request
            return api(originalRequest);
          } else {
            console.log('Token still valid, retrying request with current token...');
            const currentToken = window.keycloak.token || localStorage.getItem('keycloak_token');
            originalRequest.headers.Authorization = `Bearer ${currentToken}`;
            isRefreshing = false;
            processQueue(null, currentToken);
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          isRefreshing = false;
          processQueue(refreshError, null);

          // If refresh fails, check if we should redirect
          if (!shouldSkipRedirect) {
            const token = localStorage.getItem('keycloak_token');
            if (!token || (window.keycloak && window.keycloak.isTokenExpired())) {
              localStorage.removeItem('keycloak_token');
              console.log('Token expired and refresh failed, redirecting to login...');
              window.location.href = '/';
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(refreshError);
        }
      } else {
        console.warn('No keycloak instance or not authenticated, cannot refresh token');
        // No keycloak instance, check if token exists
        if (!shouldSkipRedirect) {
          const token = localStorage.getItem('keycloak_token');
          if (!token) {
            localStorage.removeItem('keycloak_token');
            console.log('No token found, redirecting to login...');
            window.location.href = '/';
          }
        }
        console.warn('401 Unauthorized for:', error.config?.url, '- User may not have permission for this endpoint');
      }
    }

    if (error.response?.status === 403) {
      const url = error.config?.url || '';
      // Gracefully handle optional endpoints where some roles have no access
      if (url.includes('/admin/doctors')) {
        console.info('Access denied for /admin/doctors, returning empty list for this role');
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK',
          headers: error.response?.headers || {},
          config: error.config,
        });
      }
      console.warn('Access Denied (403):', url);
    }

    return Promise.reject(error);
  }
);

export default api;

