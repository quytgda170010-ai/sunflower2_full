import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import MedicationIcon from '@mui/icons-material/Medication';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';
import ScienceIcon from '@mui/icons-material/Science';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import QueueIcon from '@mui/icons-material/Queue';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../services/api';

const DRAWER_WIDTH = 240;

// Helper to avoid React rendering objects/arrays as children (React error #130)
const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch (e) {
    return fallback;
  }
};

// Icon mapping - Map icon names from database to Material-UI components
const ICON_MAP = {
  'DashboardIcon': DashboardIcon,
  'PersonIcon': PersonIcon,
  'QueueIcon': QueueIcon,
  'FilterListIcon': FilterListIcon,
  'LocalHospitalIcon': LocalHospitalIcon,
  'SearchIcon': SearchIcon,
  'FolderSharedIcon': FolderSharedIcon,
  'MedicationIcon': MedicationIcon,
  'ScienceIcon': ScienceIcon,
  'ReceiptIcon': ReceiptIcon,
  'CalendarTodayIcon': CalendarTodayIcon,
  'WarningIcon': WarningIcon,
  'SecurityIcon': SecurityIcon,
  'PeopleIcon': PeopleIcon,
  'CheckCircleIcon': CheckCircleIcon,
  'InventoryIcon': InventoryIcon,
  'AssessmentIcon': AssessmentIcon,
};

function Layout({ children }) {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Get user roles - check both possible locations in token
  const getuserRoles = () => {
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
    const allRoles = [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];

    console.log('Token parsed:', keycloak.tokenParsed);
    console.log('Realm roles:', realmRoles);
    console.log('Direct roles:', directRoles);
    console.log('Resource roles:', resourceRoles);
    console.log('All combined roles:', allRoles);

    return allRoles;
  };

  const userRoles = getuserRoles();

  // Determine primary role (priority: admin > admin_hospital > head_nurse > head_reception > doctor > nurse > pharmacist > lab_technician > accountant > receptionist > patient)
  const getPrimaryRole = () => {
    const rolePriority = ['admin', 'admin_hospital', 'head_nurse', 'head_reception', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'accountant', 'receptionist', 'patient'];

    // First, try to find role from token
    for (const role of rolePriority) {
      if (userRoles.includes(role)) {
        return role;
      }
    }

    // Fallback: Try to infer role from username if no role found in token
    if (keycloak?.tokenParsed) {
      const username = keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || '';
      const usernameLower = username.toLowerCase();

      console.log('No role found in token, trying to infer from username:', username);

      // Username-based role mapping (fallback when Keycloak roles not assigned)
      // Full mapping for 11 roles
      if (usernameLower.includes('letan') || usernameLower.includes('reception') || usernameLower.includes('tieptan')) {
        console.log('Inferred role: receptionist (from username)');
        return 'receptionist';
      }
      if (usernameLower.includes('truongletan') || usernameLower.includes('head_reception') || usernameLower.includes('truongtieptan')) {
        console.log('Inferred role: head_reception (from username)');
        return 'head_reception';
      }
      if (usernameLower.includes('bacsi') || usernameLower.includes('doctor') || usernameLower.includes('bs')) {
        console.log('Inferred role: doctor (from username)');
        return 'doctor';
      }
      if (usernameLower.includes('dieuduong') || usernameLower.includes('nurse') || usernameLower.includes('yd') || usernameLower.includes('dd')) {
        console.log('Inferred role: nurse (from username)');
        return 'nurse';
      }
      if (usernameLower.includes('truongdieuduong') || usernameLower.includes('head_nurse') || usernameLower.includes('truongyd')) {
        console.log('Inferred role: head_nurse (from username)');
        return 'head_nurse';
      }
      if (usernameLower.includes('duocsi') || usernameLower.includes('pharmacist') || usernameLower.includes('ds')) {
        console.log('Inferred role: pharmacist (from username)');
        return 'pharmacist';
      }
      if (usernameLower.includes('ktv') || usernameLower.includes('lab') || usernameLower.includes('xetnghiem') || usernameLower.includes('technician')) {
        console.log('Inferred role: lab_technician (from username)');
        return 'lab_technician';
      }
      if (usernameLower.includes('ketoan') || usernameLower.includes('accountant') || usernameLower.includes('thungan')) {
        console.log('Inferred role: accountant (from username)');
        return 'accountant';
      }
      if (usernameLower.includes('giamdoc') || usernameLower.includes('admin_hospital') || usernameLower.includes('hospital_admin')) {
        console.log('Inferred role: admin_hospital (from username)');
        return 'admin_hospital';
      }
      if (usernameLower.includes('admin') || usernameLower.includes('quanly') || usernameLower.includes('quantri')) {
        console.log('Inferred role: admin (from username)');
        return 'admin';
      }
      if (usernameLower.includes('benhnhan') || usernameLower.includes('patient') || usernameLower.includes('bn')) {
        console.log('Inferred role: patient (from username)');
        return 'patient';
      }
    }

    return null;
  };

  const primaryRole = getPrimaryRole();

  // Debug: Log primary role
  useEffect(() => {
    console.log('Primary role:', primaryRole, 'User roles:', userRoles);
  }, [primaryRole, userRoles]);

  // Fallback menu items (hardcoded) - used when API fails
  const getFallbackMenuItems = (role) => {
    const isAdmin = role === 'admin';

    if (isAdmin) {
      return [
        { label: 'Security', icon: React.createElement(SecurityIcon), path: '/siem/', external: true },
      ];
    }

    // Default menu items for other roles (11 roles with hierarchical management)
    // Menu defined according to TONG_HOP_VAI_TRO_HE_THONG.md
    const allMenus = [
      // Common menus
      { label: 'Bảng Điều Khiển', icon: React.createElement(DashboardIcon), path: '/', roles: ['receptionist', 'head_reception', 'doctor', 'nurse', 'head_nurse', 'pharmacist', 'lab_technician', 'accountant', 'admin_hospital'] },
      { label: 'Hồ Sơ Của Tôi', icon: React.createElement(PersonIcon), path: '/my-profile', roles: ['patient'] },

      // Receptionist menus (receptionist + head_reception)
      { label: 'Quản Lý Hàng Đợi', icon: React.createElement(QueueIcon), path: '/queue-management', roles: ['receptionist', 'head_reception'] },
      { label: 'Bệnh Nhân', icon: React.createElement(LocalHospitalIcon), path: '/patients', roles: ['receptionist', 'head_reception'] },
      { label: 'Thanh Toán', icon: React.createElement(ReceiptIcon), path: '/billing', roles: ['receptionist', 'head_reception'] },
      { label: 'Lịch Hẹn', icon: React.createElement(CalendarTodayIcon), path: '/appointments', roles: ['receptionist', 'head_reception'] },

      // Head Reception specific menus (only head_reception)
      { label: 'Quản Lý Nhân Sự', icon: React.createElement(PeopleIcon), path: '/team-management', roles: ['head_reception'] },
      { label: 'Khiếu Nại', icon: React.createElement(WarningIcon), path: '/complaints', roles: ['head_reception'] },
      { label: 'Trung Tâm Duyệt', icon: React.createElement(CheckCircleIcon), path: '/approval-center', roles: ['head_reception'] },

      // Doctor menus
      // Chờ Khám: only for bs.dakhoa - receives patients from nurse
      { label: 'Chờ Khám', icon: React.createElement(CheckCircleIcon), path: '/internal-medicine-doctor-first-review', roles: ['doctor', 'doctor_general'], usernames: ['bs.dakhoa'] },
      // Khám & Điều Trị: for all doctors (both general and specialists)
      { label: 'Khám & Điều Trị', icon: React.createElement(LocalHospitalIcon), path: '/internal-medicine-doctor-review', roles: ['doctor', 'doctor_general'] },

      // Hồ Sơ Bệnh Án & Đơn Thuốc: only for bs.dakhoa
      { label: 'Hồ Sơ Bệnh Án', icon: React.createElement(FolderSharedIcon), path: '/medical-records', roles: ['doctor', 'doctor_general'], usernames: ['bs.dakhoa'] },
      { label: 'Đơn Thuốc', icon: React.createElement(MedicationIcon), path: '/prescriptions', roles: ['doctor', 'doctor_general'], usernames: ['bs.dakhoa'] },

      // Nurse menus (nurse + head_nurse)
      { label: 'Sàng Lọc Ban Đầu', icon: React.createElement(FilterListIcon), path: '/nurse-screening', roles: ['nurse', 'head_nurse'] },
      { label: 'Bệnh Nhân', icon: React.createElement(LocalHospitalIcon), path: '/patients', roles: ['nurse', 'head_nurse'] },
      { label: 'Hồ Sơ Bệnh Án', icon: React.createElement(FolderSharedIcon), path: '/medical-records', roles: ['nurse', 'head_nurse'] },

      // Head Nurse specific menus (only head_nurse)
      { label: 'Quản Lý Nhân Sự', icon: React.createElement(PeopleIcon), path: '/team-management', roles: ['head_nurse'] },
      { label: 'Duyệt Lịch Trực', icon: React.createElement(CalendarTodayIcon), path: '/schedule-approval', roles: ['head_nurse'] },
      { label: 'Quản Lý Vật Tư', icon: React.createElement(InventoryIcon), path: '/supply-management', roles: ['head_nurse'] },

      // Pharmacist menus
      { label: 'Nhà Thuốc', icon: React.createElement(MedicationIcon), path: '/pharmacy', roles: ['pharmacist'] },

      // Lab Technician menus
      { label: 'Xét Nghiệm', icon: React.createElement(ScienceIcon), path: '/internal-medicine-lab-processing', roles: ['lab_technician'] },

      // Accountant menus
      { label: 'Thanh Toán', icon: React.createElement(ReceiptIcon), path: '/billing', roles: ['accountant'] },
      { label: 'Báo Cáo Tài Chính', icon: React.createElement(AssessmentIcon), path: '/financial-reports', roles: ['accountant'] },
      { label: 'Quản Lý BHYT', icon: React.createElement(LocalHospitalIcon), path: '/bhyt-management', roles: ['accountant'] },

      // Admin Hospital menus
      { label: 'Báo Cáo Bệnh Viện', icon: React.createElement(AssessmentIcon), path: '/hospital-reports', roles: ['admin_hospital'] },
    ];

    // Filter menus by role AND username (if specified)
    const username = keycloak?.tokenParsed?.preferred_username || '';
    const filteredMenus = allMenus.filter(menu => {
      // Must match role
      if (!menu.roles || !menu.roles.includes(role)) return false;
      // If usernames specified, must also match username
      if (menu.usernames && !menu.usernames.includes(username)) return false;
      return true;
    });
    console.log(`Fallback menu for role "${role}" user "${username}":`, filteredMenus.length, 'items');
    return filteredMenus;
  };

  // Memoize roles to prevent unnecessary re-renders
  const memoizedPrimaryRole = useMemo(() => primaryRole, [primaryRole]);
  const userRolesString = useMemo(() => {
    const sorted = [...userRoles].sort();
    return sorted.join(',');
  }, [userRoles.length, userRoles.join(',')]);
  const hasFetchedMenu = useRef(false); // Track if we've already fetched menu for this role
  const lastFetchedRole = useRef(null); // Track which role we last fetched for

  // Load menu items - use fallback menu immediately, try API as optional enhancement
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts

    const fetchMenuItems = async () => {
      // If no primary role, use fallback based on first available role
      let roleToUse = memoizedPrimaryRole;
      if (!roleToUse && userRoles.length > 0) {
        // Try to find any valid role from userRoles
        const rolePriority = ['admin', 'admin_hospital', 'head_nurse', 'head_reception', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'accountant', 'receptionist', 'patient'];
        for (const role of rolePriority) {
          if (userRoles.includes(role)) {
            roleToUse = role;
            break;
          }
        }
      }

      // Always use fallback menu first (immediate display)
      if (roleToUse && isMounted) {
        const fallbackMenus = getFallbackMenuItems(roleToUse);
        setMenuItems(fallbackMenus);
        setLoadingMenu(false);
      } else if (isMounted) {
        // No valid role found
        console.warn('No valid role found, userRoles:', userRoles);
        setMenuItems([]);
        setLoadingMenu(false);
        return;
      }

      // Optionally try to fetch from API to enhance menu (non-blocking, only once per role)
      // Reset flag if role changed
      if (lastFetchedRole.current !== roleToUse) {
        hasFetchedMenu.current = false;
        lastFetchedRole.current = roleToUse;
      }

      if (roleToUse && isMounted && !hasFetchedMenu.current) {
        hasFetchedMenu.current = true; // Mark as fetched
        try {
          const response = await api.get(`/admin/menus/role/${roleToUse}`, {
            timeout: 10000, // 10 second timeout
          });

          // Check if component is still mounted before updating state
          if (!isMounted) return;

          // Check if response has valid menu data
          if (response.data && response.data.menus && Array.isArray(response.data.menus) && response.data.menus.length > 0) {
            // Transform API response to component format
            const transformedMenus = response.data.menus.map(menu => {
              // Ensure icon is always a valid React element, never an object
              let iconElement = React.createElement(DashboardIcon);
              if (menu.icon && typeof menu.icon === 'string' && ICON_MAP[menu.icon]) {
                const IconComponent = ICON_MAP[menu.icon];
                if (typeof IconComponent === 'function') {
                  iconElement = React.createElement(IconComponent);
                }
              }
              return {
                label: safeText(menu.label, ''),
                icon: iconElement,
                path: safeText(menu.path, '#'),
                external: menu.external === true || menu.external === 'true' || menu.external === 1,
                display_order: (() => {
                  const order = menu.display_order;
                  if (typeof order === 'number') return order;
                  if (typeof order === 'string') {
                    const parsed = parseInt(order, 10);
                    return isNaN(parsed) ? 0 : parsed;
                  }
                  return 0;
                })(),
              };
            });

            // Update menu with API data if available
            setMenuItems(transformedMenus);
          }
        } catch (error) {
          // Silently fail - we already have fallback menu displayed
          if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
            console.debug('API menu fetch failed (using fallback):', error.message);
          }
        }
      }
    };

    fetchMenuItems();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [memoizedPrimaryRole, userRolesString]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    // Log logout event before logging out
    if (keycloak) {
      try {
        const { logAuthEvent, getUserInfoFromKeycloak } = await import('../utils/logging');
        const { username, roles } = getUserInfoFromKeycloak(keycloak);
        await logAuthEvent({
          username,
          success: true,
          roles,
          eventType: 'logout'
        });
      } catch (error) {
        console.error('Failed to log logout event:', error);
      }
    }
    keycloak?.logout();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  // Instrument render to catch unexpected object children
  try {
    console.debug('Layout render snapshot', {
      menuItemsCount: Array.isArray(menuItems) ? menuItems.length : 'non-array',
      primaryRole,
    });
  } catch (e) {
    console.error('Layout pre-render log failed', e);
  }

  try {
    return (
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={handleLogoClick}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>EHR Sentinel</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{ cursor: 'pointer', bgcolor: 'secondary.main' }}
                onClick={handleMenuOpen}
              >
                {(() => {
                  const name = keycloak?.tokenParsed?.name;
                  if (!name) return 'U';
                  const nameStr = safeText(name, 'U');
                  return nameStr.charAt(0) || 'U';
                })()}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  {safeText(keycloak?.tokenParsed?.name, 'User')}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              mt: 8,
            },
          }}
        >
          <List>
            {loadingMenu ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : menuItems.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No menu items
                </Typography>
              </Box>
            ) : (
              menuItems.map((item, index) => {
                // Handle external links (Security → Stack C)
                const handleClick = () => {
                  if (item.external) {
                    window.open(item.path, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(item.path);
                  }
                };

                // Ensure icon is always a valid React element, never an object
                const iconElement = (() => {
                  try {
                    if (!item.icon) return React.createElement(DashboardIcon);
                    if (React.isValidElement(item.icon)) return item.icon;
                    // If icon is somehow an object or invalid, use fallback
                    if (typeof item.icon === 'object' || typeof item.icon !== 'function') {
                      console.error('[Layout] Invalid icon type:', typeof item.icon, 'for menu:', safeText(item.label, 'unknown'));
                      return React.createElement(DashboardIcon);
                    }
                    // If it's a function, try to create element
                    if (typeof item.icon === 'function') {
                      return React.createElement(item.icon);
                    }
                    return React.createElement(DashboardIcon);
                  } catch (e) {
                    console.error('[Layout] Error creating icon element:', e);
                    return React.createElement(DashboardIcon);
                  }
                })();

                return (
                  <ListItem key={`${safeText(item.path, '')}-${index}`} disablePadding>
                    <ListItemButton onClick={handleClick}>
                      <ListItemIcon>{iconElement}</ListItemIcon>
                      <ListItemText primary={safeText(item.label, '')} />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '1400px' }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  } catch (renderErr) {
    console.error('Layout render failed:', renderErr);
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>Layout lỗi hiển thị</Typography>
        <Typography variant="body2" color="text.secondary">{safeText(renderErr?.message, 'Rendering error')}</Typography>
      </Box>
    );
  }
}

export default Layout;

