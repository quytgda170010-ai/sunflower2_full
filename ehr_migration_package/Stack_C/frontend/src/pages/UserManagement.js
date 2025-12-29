import React, { useState, useEffect } from 'react';
import {
  Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, TextField, Box, Typography, CircularProgress,
  Tabs, Tab, Chip, InputAdornment, Grid, Card, CardContent, CardActionArea,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const API_URL = window.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8003';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('keycloak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('keycloak_token');
      alert('Session expired. Please login again.');
      window.location.href = 'http://localhost:3000';
    }
    return Promise.reject(error);
  }
);

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', role: 'receptionist', password: '' });
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null); // For filtering by doctor specialty
  const [selectedNurseSpecialty, setSelectedNurseSpecialty] = useState(null); // For filtering by nurse specialty

  useEffect(() => {
    fetchUsers();
  }, []);

  const isDoctorRole = (role) => role && (role === 'doctor' || role.startsWith('doctor_'));

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      // Handle both array and object response formats
      const usersData = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.users || []);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post('/api/users', formData);
      setOpenDialog(false);
      setFormData({ username: '', email: '', role: 'receptionist', password: '' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert('Failed to add user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/api/users/${editingUser.id}`, formData);
      setOpenDialog(false);
      setFormData({ username: '', email: '', role: 'receptionist', password: '' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert('Failed to update user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      handleUpdateUser();
    } else {
      handleAddUser();
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, role: user.role, password: '' });
    setOpenDialog(true);
  };

  const handleChangePasswordClick = (user) => {
    setUserToChangePassword(user);
    setChangePasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      console.log('[UserManagement] Changing password for user:', userToChangePassword.id);
      const token = localStorage.getItem('keycloak_token');
      console.log('[UserManagement] Token exists:', !!token);

      await api.put(`/api/users/${userToChangePassword.id}/password`, { new_password: newPassword });

      setChangePasswordDialog(false);
      setUserToChangePassword(null);
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (error) {
      console.error('[UserManagement] Failed to change password:', error);
      console.error('[UserManagement] Error response:', error.response);

      let errorMessage = 'Failed to change password: ';
      if (error.response?.status === 401) {
        errorMessage += 'Unauthorized. Please login again.';
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setDeleteConfirmDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSelectedSpecialty(null); // Reset doctor specialty filter when changing tabs
    setSelectedNurseSpecialty(null); // Reset nurse specialty filter when changing tabs
  };

  const getFilteredUsers = () => {
    // Ensure users is always an array
    if (!Array.isArray(users)) {
      return [];
    }
    let filtered = users;

    // Filter by tab/role
    if (currentTab === 'doctor') {
      filtered = users.filter(u => isDoctorRole(u.role));
    } else if (currentTab === 'all_nurses') {
      filtered = users.filter(u => u.role === 'nurse' || u.role === 'head_nurse');
    } else if (currentTab === 'all_reception') {
      filtered = users.filter(u => u.role === 'receptionist' || u.role === 'head_reception');
    } else if (currentTab !== 'all') {
      filtered = users.filter(u => u.role === currentTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        getRoleLabel(u.role).toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      if (a.online === b.online) {
        return a.username.localeCompare(b.username);
      }
      return a.online ? -1 : 1;
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      admin_hospital: 'secondary',
      head_reception: 'warning',
      receptionist: 'warning',
      head_nurse: 'success',
      nurse: 'success',
      pharmacist: 'info',
      lab_technician: 'info',
      accountant: 'warning',
      patient: 'default'
    };
    if (isDoctorRole(role)) {
      return 'primary';
    }
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'IT Admin',
      admin_hospital: 'Director',
      head_reception: '👑 Head Receptionist',
      receptionist: 'Receptionist',
      doctor: 'Doctor',
      doctor_internal: 'Internal Medicine Doctor',
      doctor_cardiology: 'Cardiology Doctor',
      doctor_surgery: 'Surgery Doctor',
      doctor_pediatrics: 'Pediatrics Doctor',
      doctor_obstetrics: 'Obstetrics Doctor',
      doctor_neurology: 'Neurology Doctor',
      doctor_orthopedics: 'Orthopedics Doctor',
      doctor_dentistry: 'Dentistry Doctor',
      head_nurse: '👑 Head Nurse',
      nurse: 'Nurse',
      pharmacist: 'Pharmacist',
      lab_technician: 'Lab Technician',
      accountant: 'Accountant',
      patient: 'Patient'
    };
    if (labels[role]) {
      return labels[role];
    }
    if (isDoctorRole(role)) {
      return 'Specialist Doctor';
    }
    return labels[role] || role;
  };

  const getRoleCount = (role) => {
    if (role === 'all') return users.length;
    if (role === 'doctor') {
      return users.filter(u => isDoctorRole(u.role)).length;
    }
    if (role === 'all_nurses') {
      return users.filter(u => u.role === 'nurse' || u.role === 'head_nurse').length;
    }
    if (role === 'all_reception') {
      return users.filter(u => u.role === 'receptionist' || u.role === 'head_reception').length;
    }
    return users.filter(u => u.role === role).length;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">User Management</Typography>
        <Button variant="contained" onClick={() => {
          setEditingUser(null);
          setFormData({ username: '', email: '', role: 'receptionist', password: '' });
          setOpenDialog(true);
        }}>ADD USER</Button>
      </Box>

      {/* Search Box */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by username, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Main Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={`All (${getRoleCount('all')})`} value="all" />
          <Tab label={`Admin (${getRoleCount('admin')})`} value="admin" />
          <Tab label={`Director (${getRoleCount('admin_hospital')})`} value="admin_hospital" />
          <Tab label={`Receptionist (${getRoleCount('all_reception')})`} value="all_reception" />
          <Tab label={`Doctor (${getRoleCount('doctor')})`} value="doctor" />
          <Tab label={`Nurse (${getRoleCount('all_nurses')})`} value="all_nurses" />
          <Tab label={`Pharmacist (${getRoleCount('pharmacist')})`} value="pharmacist" />
          <Tab label={`Lab Tech (${getRoleCount('lab_technician')})`} value="lab_technician" />
          <Tab label={`Accountant (${getRoleCount('accountant')})`} value="accountant" />
          <Tab label={`Patient (${getRoleCount('patient')})`} value="patient" />
        </Tabs>
      </Paper>
      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredUsers.length} / {users.length} users
          {searchQuery && ` (search: "${searchQuery}")`}
        </Typography>
        {searchQuery && (
          <Button size="small" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery
                      ? `No users found with keyword "${searchQuery}"`
                      : 'No users in this category'
                    }
                  </Typography>
                  {searchQuery && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ mt: 2 }}
                    >
                      Clear Search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={getRoleLabel(user.role)} color={getRoleColor(user.role)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={user.online ? 'Online' : 'Offline'} color={user.online ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEditClick(user)}>Edit</Button>
                    <Button size="small" onClick={() => handleChangePasswordClick(user)}>Change Password</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteClick(user)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingUser ? 'Edit User' : 'Add New User'}
          </Typography>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            margin="normal"
            required
            disabled={editingUser !== null}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Role"
            select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <optgroup label="🔧 Administration">
              <option value="admin">IT Admin</option>
              <option value="admin_hospital">Director</option>
            </optgroup>
            <optgroup label="🏥 Reception">
              <option value="head_reception">👑 Head Receptionist</option>
              <option value="receptionist">Receptionist</option>
            </optgroup>
            <optgroup label="👨‍⚕️ Doctors">
              <option value="doctor">Doctor</option>
            </optgroup>
            <optgroup label="👩‍⚕️ Nursing">
              <option value="head_nurse">👑 Head Nurse</option>
              <option value="nurse">Nurse</option>
            </optgroup>
            <optgroup label="💊 Pharmacy & Lab">
              <option value="pharmacist">Pharmacist</option>
              <option value="lab_technician">Lab Technician</option>
            </optgroup>
            <optgroup label="💰 Finance">
              <option value="accountant">Accountant</option>
            </optgroup>
            <optgroup label="👤 Other">
              <option value="patient">Patient</option>
            </optgroup>
          </TextField>
          {!editingUser && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
            />
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleSaveUser}>
              {editingUser ? 'Update' : 'Add'}
            </Button>
            <Button onClick={() => {
              setOpenDialog(false);
              setEditingUser(null);
              setFormData({ username: '', email: '', role: 'receptionist', password: '' });
            }}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Change Password for {userToChangePassword?.username}
          </Typography>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleChangePassword}>
              Change Password
            </Button>
            <Button onClick={() => {
              setChangePasswordDialog(false);
              setUserToChangePassword(null);
              setNewPassword('');
              setConfirmPassword('');
            }}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Confirm Delete
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Are you sure you want to delete user <strong>{userToDelete?.username}</strong>?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="error" onClick={handleDeleteUser}>
              Delete
            </Button>
            <Button onClick={() => {
              setDeleteConfirmDialog(false);
              setUserToDelete(null);
            }}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}

export default UserManagement;

