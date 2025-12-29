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
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import api from '../services/api';

function CareTeams() {
  const [careTeams, setCareTeams] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    user_id: '',
    department_id: '',
    role: 'doctor'
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  useEffect(() => {
    fetchCareTeams();
    fetchPatients();
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchCareTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/care-teams');
      setCareTeams(res.data.care_teams || []);
    } catch (error) {
      console.error('Failed to fetch care teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/admin/patients?page=1&page_size=1000');
      setPatients(res.data.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/staff');
      setUsers(res.data.staff || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      patient_id: '',
      user_id: '',
      department_id: '',
      role: 'doctor'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await api.post('/admin/care-teams', formData);
      handleCloseDialog();
      fetchCareTeams();
    } catch (error) {
      console.error('Failed to add care team member:', error);
      alert('Failed to add care team member');
    }
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;

    try {
      await api.delete(`/admin/care-teams/${teamToDelete.id}`);
      setDeleteConfirmDialog(false);
      setTeamToDelete(null);
      fetchCareTeams();
    } catch (error) {
      console.error('Failed to remove care team member:', error);
      alert('Failed to remove care team member');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor': return 'primary';
      case 'nurse': return 'success';
      case 'specialist': return 'warning';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'nurse': return 'Nurse';
      case 'specialist': return 'Specialist';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Care Team Management
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          ADD MEMBER
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Patient Code</strong></TableCell>
              <TableCell><strong>Patient Name</strong></TableCell>
              <TableCell><strong>Staff</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Assigned Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {careTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No care team members yet
                </TableCell>
              </TableRow>
            ) : (
              careTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.patient_code}</TableCell>
                  <TableCell>{team.patient_name}</TableCell>
                  <TableCell>{team.username || team.user_id}</TableCell>
                  <TableCell>{team.department_name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(team.role)}
                      color={getRoleColor(team.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(team.assigned_at).toLocaleString('en-US')}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(team)}
                    >
                      DELETE
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Care Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleInputChange}
                label="Patient"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.patient_code} - {patient.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Staff</InputLabel>
              <Select
                name="user_id"
                value={formData.user_id}
                onChange={handleInputChange}
                label="Staff"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName} (${user.username})`
                      : user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                label="Department"
              >
                <MenuItem value="">
                  <em>Do not select department</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="nurse">Nurse</MenuItem>
                <MenuItem value="specialist">Specialist</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this member from the care team?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CareTeams;

