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
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import { useKeycloak } from '../context/KeycloakContext';
import { API_BASE_URL } from '../services/api';

function Consents() {
  const { keycloak } = useKeycloak();
  const [consents, setConsents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalConsents, setTotalConsents] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    consent_type: 'treatment',
    is_granted: true,
    notes: ''
  });

  const consentTypes = {
    research: 'Research',
    data_sharing: 'Data Sharing',
    treatment: 'Treatment'
  };

  useEffect(() => {
    fetchConsents();
    fetchPatients();
  }, [page, rowsPerPage]);

  const fetchConsents = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/consents?page=${page + 1}&page_size=${rowsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        }
      );
      const data = await response.json();
      setConsents(data.consents || []);
      setTotalConsents(data.total || 0);
    } catch (error) {
      console.error('Error fetching consents:', error);
      setError('Unable to load consent list');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/patients?page=1&page_size=1000`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      patient_id: '',
      consent_type: 'treatment',
      is_granted: true,
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/consents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchConsents();
        handleCloseDialog();
      } else {
        const error = await response.json();
        setError(error.detail || 'An error occurred');
      }
    } catch (error) {
      console.error('Error saving consent:', error);
      setError('Unable to save consent');
    }
  };

  const handleRevoke = async (id) => {
    const notes = window.prompt('Reason for revoking consent:');
    if (notes === null) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/consents/${id}/revoke`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        fetchConsents();
      }
    } catch (error) {
      console.error('Error revoking consent:', error);
      setError('Unable to revoke consent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consent?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/consents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (response.ok) {
        fetchConsents();
      }
    } catch (error) {
      console.error('Error deleting consent:', error);
      setError('Unable to delete consent');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Consent Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          CREATE NEW CONSENT
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Consent Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Granted Date</TableCell>
              <TableCell>Revocation Date</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consents.map((consent) => (
              <TableRow key={consent.id}>
                <TableCell>{consent.patient_name}</TableCell>
                <TableCell>{consentTypes[consent.consent_type]}</TableCell>
                <TableCell>
                  {consent.is_granted ? (
                    <Chip label="Granted" color="success" size="small" />
                  ) : (
                    <Chip label="Revoked" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>{formatDate(consent.granted_at)}</TableCell>
                <TableCell>{formatDate(consent.revoked_at)}</TableCell>
                <TableCell>{consent.notes || '-'}</TableCell>
                <TableCell>
                  {consent.is_granted && (
                    <IconButton color="warning" onClick={() => handleRevoke(consent.id)}>
                      <BlockIcon />
                    </IconButton>
                  )}
                  <IconButton color="error" onClick={() => handleDelete(consent.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalConsents}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Consent</DialogTitle>
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

            <FormControl fullWidth>
              <InputLabel>Consent Type *</InputLabel>
              <Select
                value={formData.consent_type}
                onChange={(e) => setFormData({ ...formData, consent_type: e.target.value })}
                label="Consent Type *"
              >
                <MenuItem value="treatment">Treatment</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="data_sharing">Data Sharing</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status *</InputLabel>
              <Select
                value={formData.is_granted}
                onChange={(e) => setFormData({ ...formData, is_granted: e.target.value })}
                label="Status *"
              >
                <MenuItem value={true}>Granted</MenuItem>
                <MenuItem value={false}>Revoked</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Consents;

