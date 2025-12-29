import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import api from '../services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', role: 'doctor', password: '' });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userPassword, setUserPassword] = useState(null);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      console.log('[ADD USER] Sending formData:', formData);
      await api.post('/admin/users', formData);
      setOpenDialog(false);
      setFormData({ username: '', email: '', role: 'doctor', password: '' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to add user');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, role: user.role, password: '' });
    setOpenDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      // Don't send password when updating
      const { password, ...updateData } = formData;
      await api.put(`/admin/users/${editingUser.id}`, updateData);
      setOpenDialog(false);
      setFormData({ username: '', email: '', role: 'doctor', password: '' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleSaveUser = () => {
    if (!formData.username || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }
    if (!editingUser && !formData.password) {
      alert('Password is required for new users');
      return;
    }
    if (editingUser) {
      handleUpdateUser();
    } else {
      handleAddUser();
    }
  };

  const handleShowPassword = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user.id}/password`);
      setUserPassword(res.data);
      setShowPasswordDialog(true);
    } catch (error) {
      console.error('Failed to get password:', error);
      alert('Failed to get password');
    }
  };

  const handleChangePasswordClick = (user) => {
    setUserToChangePassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      await api.put(`/admin/users/${userToChangePassword.id}/password`, {
        new_password: newPassword
      });
      setChangePasswordDialog(false);
      setUserToChangePassword(null);
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setDeleteConfirmDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getFilteredUsers = () => {
    let filtered;
    if (currentTab === 'all') {
      filtered = users;
    } else if (currentTab === 'all_doctors') {
      filtered = users.filter(user =>
        user.role === 'doctor' ||
        user.role === 'doctor_cardiology' ||
        user.role === 'doctor_dentistry' ||
        user.role === 'doctor_internal' ||
        user.role === 'doctor_surgery' ||
        user.role === 'doctor_pediatrics' ||
        user.role === 'doctor_obstetrics' ||
        user.role === 'doctor_neurology' ||
        user.role === 'doctor_orthopedics'
      );
    } else {
      filtered = users.filter(user => user.role === currentTab);
    }
    // Sort: Online users first, then by username
    return filtered.sort((a, b) => {
      if (a.online === b.online) {
        return a.username.localeCompare(b.username);
      }
      return a.online ? -1 : 1; // Online (online=true) first
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      admin_hospital: 'secondary',
      receptionist: 'info',
      doctor: 'primary',
      doctor_cardiology: 'primary',
      doctor_dentistry: 'primary',
      doctor_internal: 'primary',
      doctor_surgery: 'primary',
      doctor_pediatrics: 'primary',
      doctor_obstetrics: 'primary',
      doctor_neurology: 'primary',
      doctor_orthopedics: 'primary',
      nurse: 'success',
      pharmacist: 'secondary',
      lab_technician: 'primary',
      accountant: 'warning',
      patient: 'default'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      admin_hospital: 'Admin Hospital',
      receptionist: 'Receptionist',
      doctor: 'Doctor (Legacy)',
      doctor_cardiology: 'Cardiologist',
      doctor_dentistry: 'Dentist',
      doctor_internal: 'Internal Medicine Doctor',
      doctor_surgery: 'Surgeon',
      doctor_pediatrics: 'Pediatrician',
      doctor_obstetrics: 'Obstetrician',
      doctor_neurology: 'Neurologist',
      doctor_orthopedics: 'Orthopedist',
      nurse: 'Nurse',
      pharmacist: 'Pharmacist',
      lab_technician: 'Lab Technician',
      accountant: 'Accountant',
      patient: 'Patient'
    };
    return labels[role] || role;
  };

  const getRoleCount = (role) => {
    if (role === 'all') return users.length;
    if (role === 'all_doctors') {
      return users.filter(u =>
        u.role === 'doctor' ||
        u.role === 'doctor_cardiology' ||
        u.role === 'doctor_dentistry' ||
        u.role === 'doctor_internal' ||
        u.role === 'doctor_surgery' ||
        u.role === 'doctor_pediatrics' ||
        u.role === 'doctor_obstetrics' ||
        u.role === 'doctor_neurology' ||
        u.role === 'doctor_orthopedics'
      ).length;
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button variant="contained" onClick={() => {
          setEditingUser(null);
          setFormData({ username: '', email: '', role: 'admin', password: '' });
          setOpenDialog(true);
        }}>
          ADD USER
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label={`All (${getRoleCount('all')})`}
            value="all"
          />
          <Tab
            label={`Admins (${getRoleCount('admin')})`}
            value="admin"
          />
          <Tab
            label={`Admin + Hospital (${getRoleCount('admin_hospital')})`}
            value="admin_hospital"
          />
          <Tab
            label={`Receptionist (${getRoleCount('receptionist')})`}
            value="receptionist"
          />
          <Tab
            label={`Doctors (${getRoleCount('all_doctors')})`}
            value="all_doctors"
          />
          <Tab
            label={`Nurses (${getRoleCount('nurse')})`}
            value="nurse"
          />
          <Tab
            label={`Pharmacists (${getRoleCount('pharmacist')})`}
            value="pharmacist"
          />
          <Tab
            label={`Lab Technicians (${getRoleCount('lab_technician')})`}
            value="lab_technician"
          />
          <Tab
            label={`Accountants (${getRoleCount('accountant')})`}
            value="accountant"
          />
          <Tab
            label={`Patients (${getRoleCount('patient')})`}
            value="patient"
          />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
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
                <TableCell colSpan={5} align="center">
                  No users found in this category
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.online ? 'Active' : 'Inactive'}
                      color={user.online ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" onClick={() => handleEditClick(user)}>
                        EDIT
                      </Button>
                      <Button size="small" variant="outlined" color="info" onClick={() => handleShowPassword(user)}>
                        PASSWORD
                      </Button>
                      <Button size="small" variant="outlined" color="warning" onClick={() => handleChangePasswordClick(user)}>
                        CHANGE
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(user)}>
                        DELETE
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            {editingUser ? 'Edit User' : 'Add New User'}
          </Typography>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Role"
            select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
            SelectProps={{
              native: true,
            }}
          >
            <option value="admin">Admin (System Management)</option>
            <option value="admin_hospital">Admin Hospital (Director)</option>
            <optgroup label="Doctors (view and update only)">
              <option value="doctor_cardiology">Cardiologist</option>
              <option value="doctor_dentistry">Dentist</option>
              <option value="doctor_internal">Internal Medicine Doctor</option>
              <option value="doctor_surgery">Surgeon</option>
              <option value="doctor_pediatrics">Pediatrician</option>
              <option value="doctor_obstetrics">Obstetrician</option>
              <option value="doctor_neurology">Neurologist</option>
              <option value="doctor_orthopedics">Orthopedist</option>
            </optgroup>
            <option value="nurse">Nurse</option>
            <option value="accountant">Accountant</option>
          </TextField>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            💡 To create a patient account, please go to "Patient Management" and select "Add Patient + Create Account"
          </Typography>
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
              setFormData({ username: '', email: '', role: 'doctor', password: '' });
            }}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            User Password
          </Typography>
          {userPassword && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Username:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {userPassword.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Password:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                {userPassword.password}
              </Typography>
              <Typography variant="caption" color="error">
                ⚠️ Keep this password secure. Do not share it with anyone.
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setShowPasswordDialog(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          {userToChangePassword && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                User: <strong>{userToChangePassword.username}</strong>
              </Typography>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                ⚠️ Password must be at least 8 characters long
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button variant="contained" color="warning" onClick={handleChangePassword}>
              Change Password
            </Button>
            <Button variant="outlined" onClick={() => {
              setChangePasswordDialog(false);
              setUserToChangePassword(null);
              setNewPassword('');
              setConfirmPassword('');
            }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" gutterBottom color="error">
            ⚠️ Confirm Delete
          </Typography>
          {userToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this user?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Username:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                {userToDelete.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {userToDelete.email}
              </Typography>
              <Typography variant="caption" color="error">
                ⚠️ This action cannot be undone!
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button variant="contained" color="error" onClick={handleDeleteUser}>
              Delete
            </Button>
            <Button variant="outlined" onClick={() => {
              setDeleteConfirmDialog(false);
              setUserToDelete(null);
            }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}

export default UserManagement;

