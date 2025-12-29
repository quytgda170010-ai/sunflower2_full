import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import { useKeycloak } from '../context/KeycloakContext';

function Referrals() {
  const { keycloak } = useKeycloak();
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    from_doctor_id: '',
    to_doctor_id: '',
    to_hospital: '',
    reason: '',
    valid_until: '',
    is_valid: true
  });

  useEffect(() => {
    fetchReferrals();
    fetchPatients();
    fetchStaff();
  }, [page, rowsPerPage]);

  const fetchReferrals = async () => {
    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(
        `${API_BASE_URL}/admin/referrals?page=${page + 1}&page_size=${rowsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        }
      );
      const data = await response.json();
      setReferrals(data.referrals || []);
      setTotalReferrals(data.total || 0);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setError('Unable to load referral list');
    }
  };

  const fetchPatients = async () => {
    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/admin/patients?page=1&page_size=1000`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/admin/staff`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleOpenDialog = (referral = null) => {
    if (referral) {
      setEditingReferral(referral);
      setFormData({
        patient_id: referral.patient_id,
        from_doctor_id: referral.from_doctor_id,
        to_doctor_id: referral.to_doctor_id || '',
        to_hospital: referral.to_hospital || '',
        reason: referral.reason,
        valid_until: referral.valid_until ? referral.valid_until.split('T')[0] : '',
        is_valid: referral.is_valid
      });
    } else {
      setEditingReferral(null);
      setFormData({
        patient_id: '',
        from_doctor_id: keycloak.tokenParsed?.preferred_username || '',
        to_doctor_id: '',
        to_hospital: '',
        reason: '',
        valid_until: '',
        is_valid: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReferral(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      const { API_BASE_URL } = await import('../services/api');
      const url = editingReferral
        ? `${API_BASE_URL}/admin/referrals/${editingReferral.id}`
        : `${API_BASE_URL}/admin/referrals`;
      
      const method = editingReferral ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({
          ...formData,
          valid_until: formData.valid_until + 'T23:59:59'
        })
      });

      if (response.ok) {
        fetchReferrals();
        handleCloseDialog();
      } else {
        const error = await response.json();
        setError(error.detail || 'An error occurred');
      }
    } catch (error) {
      console.error('Error saving referral:', error);
      setError('Unable to save referral');
    }
  };

  const handleInvalidate = async (id) => {
    if (!window.confirm('Are you sure you want to invalidate this referral?')) return;

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/admin/referrals/${id}/invalidate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (response.ok) {
        fetchReferrals();
      }
    } catch (error) {
      console.error('Error invalidating referral:', error);
      setError('Unable to invalidate referral');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this referral?')) return;

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/admin/referrals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (response.ok) {
        fetchReferrals();
      }
    } catch (error) {
      console.error('Error deleting referral:', error);
      setError('Unable to delete referral');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Referral Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          CREATE REFERRAL
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>From Doctor</TableCell>
              <TableCell>To Doctor</TableCell>
              <TableCell>To Hospital</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.patient_name}</TableCell>
                <TableCell>{referral.from_doctor_id}</TableCell>
                <TableCell>{referral.to_doctor_id || '-'}</TableCell>
                <TableCell>{referral.to_hospital || '-'}</TableCell>
                <TableCell>{referral.reason}</TableCell>
                <TableCell>{formatDate(referral.valid_from)}</TableCell>
                <TableCell>{formatDate(referral.valid_until)}</TableCell>
                <TableCell>
                  {!referral.is_valid ? (
                    <Chip label="Invalidated" color="error" size="small" />
                  ) : isExpired(referral.valid_until) ? (
                    <Chip label="Expired" color="warning" size="small" />
                  ) : (
                    <Chip label="Valid" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(referral)}>
                    <EditIcon />
                  </IconButton>
                  {referral.is_valid && (
                    <IconButton color="warning" onClick={() => handleInvalidate(referral.id)}>
                      <BlockIcon />
                    </IconButton>
                  )}
                  <IconButton color="error" onClick={() => handleDelete(referral.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalReferrals}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Rows per page:"
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReferral ? 'Edit Referral' : 'Create New Referral'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient *</InputLabel>
              <Select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                label="Patient *"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.full_name} - {patient.patient_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="From Doctor *"
              value={formData.from_doctor_id}
              onChange={(e) => setFormData({ ...formData, from_doctor_id: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>To Doctor</InputLabel>
              <Select
                value={formData.to_doctor_id}
                onChange={(e) => setFormData({ ...formData, to_doctor_id: e.target.value })}
                label="To Doctor"
              >
                <MenuItem value="">-- Not selected --</MenuItem>
                {staff.map((user) => (
                  <MenuItem key={user.username} value={user.username}>
                    {user.firstName} {user.lastName} ({user.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="To Hospital"
              value={formData.to_hospital}
              onChange={(e) => setFormData({ ...formData, to_hospital: e.target.value })}
              fullWidth
            />

            <TextField
              label="Referral Reason *"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Valid Until *"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingReferral ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Referrals;

