import { useState, useEffect, useRef, useMemo } from 'react';
import keycloak from '../keycloak';
import { logAuthEvent, getUserInfoFromKeycloak } from '../utils/logging';

export const useKeycloakInit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const hasLoggedLoginRef = useRef(false);
  const refreshIntervalRef = useRef(null);
  const cleanupRef = useRef(null);

  // Dev bypass: allow running UI without Keycloak on non-3000 ports when REACT_APP_DEV_BYPASS=true
  const isBypassEnabled =
    process.env.REACT_APP_DEV_BYPASS === 'true' &&
    typeof window !== 'undefined' &&
    window.location &&
    window.location.port !== '3000';

  const bypassKeycloak = useMemo(() => {
    if (!isBypassEnabled) return null;
    return {
      authenticated: true,
      tokenParsed: {
        realm_access: { roles: ['receptionist'] },
        roles: ['receptionist'],
        resource_access: {},
        preferred_username: 'dev_bypass',
        name: 'Dev Bypass',
      },
      logout: () => { },
    };
  }, [isBypassEnabled]);

  useEffect(() => {
    if (isBypassEnabled && bypassKeycloak) {
      // Expose bypass keycloak to window for API headers
      window.keycloak = bypassKeycloak;
      setInitialized(true);
      setIsLoading(false);
      setError(null);
      // No cleanup needed for bypass
      return;
    }

    console.log('useKeycloakInit: Starting Keycloak initialization');

    const initKeycloak = async () => {
      try {
        console.log('useKeycloakInit: Calling keycloak.init()');

        // Check if this is a redirect from Keycloak login
        // Keycloak can return either:
        // 1. Authorization code flow: ?code=...&state=... (in query string)
        // 2. Implicit flow: #access_token=...&state=... (in hash)
        // 3. Error flow: #error=login_required&state=... (when user not logged in)
        const urlHash = window.location.hash;
        const urlSearch = window.location.search;
        const hasKeycloakError = urlHash.includes('error=');
        const isLoginRequiredError = urlHash.includes('error=login_required');
        const isKeycloakCallback =
          (urlHash.includes('access_token') || urlSearch.includes('code=')) && // Only if has token/code
          !hasKeycloakError; // Not if has error

        // Use 'login-required' to ensure session persists across page refresh
        // With 'check-sso', the session may not be properly restored on refresh
        const authenticated = await keycloak.init({
          onLoad: 'login-required', // Forces authentication and maintains session
          checkLoginIframe: true, // Enable iframe checking for session validation
          enableLogging: true,
        });

        // CRITICAL FIX: Clean up callback parameters and errors AFTER Keycloak init
        // This prevents redirect loops by ensuring Keycloak processes the callback first
        // Only cleanup if:
        // 1. Keycloak callback (has token/code) - successful callback
        // 2. login_required error - this is normal, not a real error, just user not logged in
        // Do NOT cleanup other errors immediately - let them be handled by error handlers
        if ((isKeycloakCallback || isLoginRequiredError) && (urlSearch || urlHash)) {
          // Use setTimeout to ensure Keycloak has processed the callback
          setTimeout(() => {
            const url = new URL(window.location.href);
            // Remove query string and hash (including errors) after Keycloak processes it
            url.search = '';
            url.hash = '';
            window.history.replaceState({}, '', url.pathname);
            console.log('useKeycloakInit: Cleaned up URL callback parameters');
          }, 100);
        }

        // Expose keycloak instance to window for API interceptor
        if (typeof window !== 'undefined') {
          window.keycloak = keycloak;
        }

        console.log('useKeycloakInit: Keycloak initialized, authenticated:', authenticated);
        console.log('useKeycloakInit: Is Keycloak callback:', isKeycloakCallback);
        console.log('useKeycloakInit: URL hash:', urlHash.substring(0, 50));

        // CRITICAL: Only log authentication if user is ACTUALLY authenticated
        // Check token validity and authentication status
        const isActuallyAuthenticated = authenticated &&
          keycloak.token &&
          !keycloak.isTokenExpired() &&
          keycloak.authenticated === true;

        // CRITICAL: Log failed authentication attempts
        // This includes:
        // 1. User tried to access but authentication failed (authenticated === false)
        // 2. User is not authenticated and no valid token
        // 3. Token exists but is expired or invalid
        // NOTE: Do NOT log if error=login_required (this is normal when user hasn't logged in yet)
        if (!isActuallyAuthenticated) {
          // Check if this is a failed authentication attempt (not just initial load)
          // Only log if:
          // - User explicitly tried to login (isKeycloakCallback but failed) - NOT error=login_required
          // - Or authentication was explicitly false (not just undefined)
          // - Token expired (user was logged in but token expired)
          const shouldLogFailedAuth = (
            (authenticated === false && !hasKeycloakError) || // Explicitly failed, but not login_required error
            (isKeycloakCallback && !isActuallyAuthenticated) || // Callback but not authenticated (real failure)
            (keycloak.token && keycloak.isTokenExpired()) // Token expired (user was logged in)
          );

          if (shouldLogFailedAuth) {
            try {
              // Try to extract username from expired/invalid token if possible
              let failedUsername = 'unknown';
              try {
                if (keycloak.tokenParsed) {
                  failedUsername = keycloak.tokenParsed.preferred_username ||
                    keycloak.tokenParsed.username ||
                    keycloak.tokenParsed.sub ||
                    'unknown';
                }
              } catch (e) {
                // Ignore token parsing errors
              }

              console.log('useKeycloakInit: Logging failed authentication attempt for:', failedUsername);
              await logAuthEvent({
                username: failedUsername,
                success: false,
                roles: [],
                eventType: 'login'
              });
            } catch (error) {
              console.error('useKeycloakInit: Failed to log failed authentication:', error);
            }
          }
        }

        // Save token to localStorage ONLY if actually authenticated
        if (isActuallyAuthenticated) {
          const previousToken = localStorage.getItem('keycloak_token');
          const tokenChanged = !previousToken || previousToken !== keycloak.token;

          // Get user ID from token for session tracking
          let userId = 'unknown';
          try {
            if (keycloak.tokenParsed?.sub) {
              userId = keycloak.tokenParsed.sub;
            }
          } catch (e) {
            console.warn('Could not extract user ID from token');
          }

          // FIXED: Use userId from token (sub) instead of username to track sessions
          // This ensures each user has their own session tracking
          const loginLoggedKey = `login_logged_${userId}`;
          const lastLoginTimeKey = `last_login_time_${userId}`;
          const hasLoggedThisSession = sessionStorage.getItem(loginLoggedKey);
          const lastLoginTime = sessionStorage.getItem(lastLoginTimeKey);

          // FIXED: Clear session tracking if token changed (new login after logout)
          // This ensures re-login after logout will be logged
          if (tokenChanged && previousToken) {
            // Token changed means user logged out and logged back in
            // Clear session tracking to allow logging new login
            sessionStorage.removeItem(loginLoggedKey);
            sessionStorage.removeItem(lastLoginTimeKey);
          }

          localStorage.setItem('keycloak_token', keycloak.token);
          console.log('useKeycloakInit: Token saved to localStorage');
          console.log('useKeycloakInit: Token changed:', tokenChanged);
          console.log('useKeycloakInit: Has logged this session:', !!hasLoggedThisSession);
          console.log('useKeycloakInit: Is actually authenticated:', isActuallyAuthenticated);

          // CRITICAL: Determine if this is a NEW login (not just a page refresh with existing token)
          // FIXED: Logic quá strict, không log khi user đăng nhập lại sau khi logout
          // Chỉ log nếu:
          // 1. Keycloak callback (redirect from login page) - this is a REAL login - ALWAYS log
          // 2. Token changed AND not logged in this session - new token means new login (log even if not very fresh)
          // 3. Not logged in this session AND (no previous login time OR token is fresh) - new login
          // DO NOT log if:
          // - Just page refresh with existing token (hasLoggedThisSession = true)
          // - Token hasn't changed and already logged in this session

          const tokenAge = lastLoginTime ? (Date.now() - parseInt(lastLoginTime)) : Infinity;
          const isVeryFreshToken = tokenAge < 60000; // 1 minute

          // FIXED: Log khi:
          // 1. Keycloak callback = user just logged in via Keycloak (redirect from login page) - ALWAYS log
          // 2. Token changed AND not logged in this session - new token means new login (log even if not very fresh)
          // 3. Not logged in this session AND (no previous login OR token is fresh OR token changed) - new login
          // REMOVED: isVeryFreshToken requirement - too strict, blocks re-login after logout
          const shouldLogLogin = isActuallyAuthenticated && (
            isKeycloakCallback || // Direct callback from Keycloak - this is a REAL login - ALWAYS log
            (tokenChanged && !hasLoggedThisSession) || // New token AND not logged yet - new login (log even if not very fresh)
            (!hasLoggedThisSession && (!lastLoginTime || tokenChanged || isVeryFreshToken)) // Not logged yet AND (no previous login OR token changed OR fresh token)
          );

          console.log('useKeycloakInit: Login check details:', {
            isActuallyAuthenticated,
            isKeycloakCallback,
            tokenChanged,
            hasLoggedThisSession,
            tokenAge: tokenAge < Infinity ? `${Math.round(tokenAge / 1000)}s` : 'N/A',
            isVeryFreshToken,
            shouldLogLogin
          });

          console.log('useKeycloakInit: Should log login:', shouldLogLogin);

          if (shouldLogLogin && !hasLoggedLoginRef.current) {
            try {
              const { username, roles } = getUserInfoFromKeycloak(keycloak);
              // Double-check: Only log if we have a valid username (not 'unknown')
              if (username && username !== 'unknown') {
                console.log('useKeycloakInit: Logging login for user:', username);
                await logAuthEvent({
                  username,
                  success: true,
                  roles,
                  eventType: 'login'
                });
                hasLoggedLoginRef.current = true;
                // Mark as logged in this session to avoid duplicate logs
                sessionStorage.setItem(loginLoggedKey, 'true');
                sessionStorage.setItem(lastLoginTimeKey, Date.now().toString());
                console.log('useKeycloakInit: Login logged successfully');
              } else {
                console.warn('useKeycloakInit: Skipping login log - invalid username');
              }
            } catch (error) {
              console.error('useKeycloakInit: Failed to log login:', error);
            }
          }
        } else {
          // Only log warning if this is not just initial load (user hasn't tried to login yet)
          if (hasKeycloakError || isKeycloakCallback) {
            // This is expected when user hasn't logged in yet - don't log as warning
            console.log('useKeycloakInit: User is not authenticated (initial load or login_required) - skipping login log');
          }
        }

        // Setup Keycloak event listeners
        keycloak.onAuthSuccess = () => {
          console.log('Keycloak: onAuthSuccess event fired');
          // Log login when authentication succeeds
          // CRITICAL: Verify token is valid and user is actually authenticated
          const isActuallyAuthenticated = keycloak.token &&
            keycloak.authenticated === true &&
            !keycloak.isTokenExpired();

          if (isActuallyAuthenticated) {
            const userId = keycloak.tokenParsed?.sub || 'unknown';
            const loginLoggedKey = `login_logged_${userId}`;
            const hasLoggedThisSession = sessionStorage.getItem(loginLoggedKey);

            // CRITICAL: Always log onAuthSuccess - this is a REAL authentication event
            // onAuthSuccess only fires when user successfully authenticates
            if (!hasLoggedThisSession && !hasLoggedLoginRef.current) {
              setTimeout(async () => {
                try {
                  const { username, roles } = getUserInfoFromKeycloak(keycloak);
                  // Double-check: Only log if we have a valid username
                  if (username && username !== 'unknown') {
                    console.log('Keycloak onAuthSuccess: Logging login for user:', username);
                    await logAuthEvent({
                      username,
                      success: true,
                      roles,
                      eventType: 'login'
                    });
                    hasLoggedLoginRef.current = true;
                    sessionStorage.setItem(loginLoggedKey, 'true');
                    sessionStorage.setItem(`last_login_time_${userId}`, Date.now().toString());
                    console.log('Keycloak onAuthSuccess: Login logged successfully');
                  } else {
                    console.warn('Keycloak onAuthSuccess: Skipping login log - invalid username');
                  }
                } catch (error) {
                  console.error('Keycloak onAuthSuccess: Failed to log login:', error);
                }
              }, 500); // Small delay to ensure token is fully processed
            } else {
              console.log('Keycloak onAuthSuccess: Already logged this session, skipping duplicate log');
            }
          } else {
            console.warn('Keycloak onAuthSuccess: User is not actually authenticated - skipping login log');
          }
        };

        // Log failed authentication attempts
        keycloak.onAuthError = (errorData) => {
          console.error('Keycloak: onAuthError event fired', errorData);
          // Extract error details for logging
          const errorType = errorData?.error || 'AUTHENTICATION_ERROR';
          const errorDescription = errorData?.error_description || 'Authentication failed';
          console.log('Keycloak onAuthError: Error type:', errorType, 'Description:', errorDescription);

          // Log failed authentication with error details
          setTimeout(async () => {
            try {
              // Try to extract username from error data if available
              let failedUsername = 'unknown';
              try {
                if (keycloak.tokenParsed) {
                  failedUsername = keycloak.tokenParsed.preferred_username ||
                    keycloak.tokenParsed.username ||
                    keycloak.tokenParsed.sub ||
                    'unknown';
                }
              } catch (e) {
                // Ignore token parsing errors
              }

              await logAuthEvent({
                username: failedUsername,
                success: false,
                roles: [],
                eventType: 'login'
              });
              console.log('Keycloak onAuthError: Logged failed authentication for:', failedUsername);
            } catch (error) {
              console.error('Keycloak onAuthError: Failed to log failed authentication:', error);
            }
          }, 100);
        };

        // Also log when authentication is explicitly logged out or session expires
        keycloak.onAuthLogout = () => {
          console.log('Keycloak: onAuthLogout event fired');
          // Note: Logout is logged separately in Layout.js, but we can log session expiry here
        };

        // Setup token refresh
        keycloak.onTokenExpired = () => {
          console.log('Token expired, refreshing...');
          keycloak.updateToken(30).then((refreshed) => {
            if (refreshed) {
              localStorage.setItem('keycloak_token', keycloak.token);
              console.log('Token refreshed');
            }
          }).catch((error) => {
            console.error('Failed to refresh token:', error);
            // CRITICAL FIX: Don't auto-redirect to login on token refresh failure
            // This can cause redirect loops. Instead, clear token and let user manually login.
            console.log('Token refresh failed, clearing token (not auto-redirecting to prevent loop)');
            localStorage.removeItem('keycloak_token');
            // Don't call keycloak.login() here - let user manually login to prevent redirect loop
          });
        };

        // Proactive token refresh: Check and refresh token before it expires
        // This prevents 401 errors when the system is idle
        const checkAndRefreshToken = () => {
          if (keycloak.authenticated && keycloak.token) {
            // Check if token will expire in the next 5 minutes (300 seconds)
            // If so, refresh it proactively
            const willExpireSoon = keycloak.isTokenExpired(300);
            const isExpired = keycloak.isTokenExpired();

            console.log('Proactive token check:', {
              willExpireSoon,
              isExpired,
              hasToken: !!keycloak.token,
              authenticated: keycloak.authenticated
            });

            if (willExpireSoon || isExpired) {
              console.log('Token will expire soon or expired, refreshing proactively...');
              keycloak.updateToken(300).then((refreshed) => {
                if (refreshed) {
                  localStorage.setItem('keycloak_token', keycloak.token);
                  console.log('Token refreshed proactively, new token saved');
                } else {
                  console.log('Token refresh not needed (still valid)');
                }
              }).catch(async (error) => {
                console.error('Failed to refresh token proactively:', error);
                // If updateToken fails, try with 0 (force refresh)
                try {
                  console.log('Trying force refresh (updateToken(0))...');
                  const forceRefreshed = await keycloak.updateToken(0);
                  if (forceRefreshed) {
                    localStorage.setItem('keycloak_token', keycloak.token);
                    console.log('Token force refreshed successfully');
                  }
                } catch (forceError) {
                  console.error('Force refresh also failed:', forceError);
                  // CRITICAL FIX: Don't auto-redirect to login on token refresh failure
                  // This can cause redirect loops. Instead, clear token and let user manually login.
                  if (keycloak.isTokenExpired()) {
                    console.log('Token expired and refresh failed, clearing token (not auto-redirecting to prevent loop)');
                    // Clear token to force re-authentication
                    localStorage.removeItem('keycloak_token');
                    // Don't call keycloak.login() here - let user manually login to prevent redirect loop
                  }
                }
              });
            }
          } else {
            // Only log warning if user was previously authenticated (token exists but expired)
            // Don't log warning on initial load when user hasn't logged in yet
            if (keycloak.token || localStorage.getItem('keycloak_token')) {
              console.warn('Cannot refresh token: not authenticated or no token');
            }
          }
        };

        // Check every 1 minute (60000 ms) - more frequent to catch expiration sooner
        refreshIntervalRef.current = setInterval(() => {
          checkAndRefreshToken();
        }, 60000);

        // Also check immediately
        checkAndRefreshToken();

        // Also check when page becomes visible again (user returns from idle)
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            console.log('Page became visible, checking token...');
            checkAndRefreshToken();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also check when window gains focus
        const handleFocus = () => {
          console.log('Window gained focus, checking token...');
          checkAndRefreshToken();
        };
        window.addEventListener('focus', handleFocus);

        setInitialized(true);
        setIsLoading(false);

        // Store cleanup function in separate ref
        cleanupRef.current = () => {
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }
          // Remove event listeners
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleFocus);
        };
      } catch (err) {
        console.error('useKeycloakInit: Error initializing Keycloak:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    // Call initKeycloak (it's async, but we don't need to wait for it)
    initKeycloak();

    // Return cleanup function from useEffect
    // This cleanup will run when component unmounts
    return () => {
      // Call stored cleanup if available
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      } else {
        // Fallback: just clear interval
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      }
    };
  }, [isBypassEnabled, bypassKeycloak]);

  return {
    keycloak: isBypassEnabled && bypassKeycloak ? bypassKeycloak : keycloak,
    isLoading,
    error,
    initialized,
  };
};

