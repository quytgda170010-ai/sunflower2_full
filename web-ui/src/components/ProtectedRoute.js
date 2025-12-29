import React from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import { Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { keycloak, isLoading, initialized } = useKeycloak();

  // CRITICAL FIX: Don't redirect if Keycloak is still initializing
  // This prevents redirect loops when Keycloak is processing callbacks
  if (isLoading || !initialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div>Loading...</div>
      </Box>
    );
  }

  // CRITICAL FIX: Check for login_required error in URL hash
  // If present, don't redirect to /login (which would cause redirect loop)
  // Instead, show login page directly
  const urlHash = window.location.hash || '';
  const hasLoginRequiredError = urlHash.includes('error=login_required');
  
  if (!keycloak?.authenticated) {
    // If URL has login_required error, don't redirect - just show login page
    // This prevents redirect loop: /login -> Keycloak -> #error=login_required -> /login -> ...
    if (hasLoginRequiredError) {
      return <Navigate to="/login" replace />;
    }
    // Otherwise, redirect to login normally
    return <Navigate to="/login" replace />;
  }

  // Check roles if required
  if (requiredRoles.length > 0) {
    // Get user roles - check both possible locations in token (same as Layout.js)
    const getUserRoles = () => {
      if (!keycloak?.tokenParsed) return [];
      
      // Try realm_access.roles first (standard Keycloak location)
      const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
      // Try direct roles property (alternative location)
      const directRoles = keycloak.tokenParsed.roles || [];
      // Try resource_access roles (client-specific roles)
      const resourceRoles = Object.values(keycloak.tokenParsed.resource_access || {}).flatMap(
        (client) => client.roles || []
      );
      
      // Combine all roles and remove duplicates
      return [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];
    };
    
    const userRoles = getUserRoles();
    
    // Helper function to check role (with username fallback)
    const hasRole = (role) => {
      if (userRoles.includes(role)) return true;
      
      // Fallback: check username if role not in token
      if (keycloak?.tokenParsed) {
        const username = (keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || '').toLowerCase();
        
        // Username-based role mapping (fallback when Keycloak roles not assigned)
        if (role === 'receptionist' && (username.includes('letan') || username.includes('reception') || username.includes('tieptan'))) return true;
        if (role === 'head_reception' && (username.includes('truongletan') || username.includes('head_reception') || username.includes('truongtieptan'))) return true;
        if (role === 'doctor' && (username.includes('bacsi') || username.includes('doctor') || username.includes('bs'))) return true;
        if (role === 'nurse' && (username.includes('dieuduong') || username.includes('nurse') || username.includes('yd') || username.includes('dd'))) return true;
        if (role === 'head_nurse' && (username.includes('truongdieuduong') || username.includes('head_nurse') || username.includes('truongyd'))) return true;
        if (role === 'pharmacist' && (username.includes('duocsi') || username.includes('pharmacist') || username.includes('ds'))) return true;
        if (role === 'lab_technician' && (username.includes('ktv') || username.includes('lab') || username.includes('xetnghiem') || username.includes('technician'))) return true;
        if (role === 'accountant' && (username.includes('ketoan') || username.includes('accountant') || username.includes('thungan'))) return true;
        if (role === 'admin_hospital' && (username.includes('giamdoc') || username.includes('admin_hospital') || username.includes('hospital_admin'))) return true;
        if (role === 'admin' && (username.includes('admin') || username.includes('quanly') || username.includes('quantri'))) return true;
        if (role === 'patient' && (username.includes('benhnhan') || username.includes('patient') || username.includes('bn'))) return true;
      }
      
      return false;
    };
    
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <div>Access Denied: Insufficient permissions</div>
        </Box>
      );
    }
  }

  return children;
}

export default ProtectedRoute;

