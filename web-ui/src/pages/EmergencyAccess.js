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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Alert,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useKeycloak } from '../context/KeycloakContext';
import { API_BASE_URL } from '../services/api';

function EmergencyAccess() {
  const { keycloak } = useKeycloak();
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    emergency_reason: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchPatients();
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/emergency-access?page=${page + 1}&page_size=${rowsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        }
      );
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error) {
      console.error('Error fetching emergency access logs:', error);
      setError('Unable to load emergency access list');
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
      emergency_reason: ''
    });
    setError('');
    setSuccess('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!formData.patient_id || !formData.emergency_reason.trim()) {
      setError('Please fill in all information');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/emergency-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({
          user_id: keycloak.tokenParsed?.preferred_username || 'unknown',
          patient_id: formData.patient_id,
          emergency_reason: formData.emergency_reason
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Emergency access has been granted!');
        fetchLogs();
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        const error = await response.json();
        setError(error.detail || 'An error occurred');
      }
    } catch (error) {
      console.error('Error requesting emergency access:', error);
      setError('Unable to request emergency access');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Emergency Access (Break the Glass)</Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<WarningIcon />}
          onClick={handleOpenDialog}
        >
          REQUEST EMERGENCY ACCESS
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Warning:</strong> Emergency access should only be used in emergency situations 
        when immediate access to patient records is needed to save lives. All emergency access 
        is logged and will be reviewed.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Requester</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Emergency Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Access Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.user_id}</TableCell>
                <TableCell>{log.patient_name}</TableCell>
                <TableCell>{log.emergency_reason}</TableCell>
                <TableCell>
                  {log.access_granted ? (
                    <Chip label="Granted" color="success" size="small" />
                  ) : (
                    <Chip label="Denied" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>{formatDate(log.accessed_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalLogs}
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
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          ⚠️ Request Emergency Access
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            <strong>WARNING:</strong> You are requesting emergency access to patient records. 
            This action will be logged and reviewed. Only use in genuine emergency situations!
          </Alert>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

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
              label="Emergency Reason *"
              value={formData.emergency_reason}
              onChange={(e) => setFormData({ ...formData, emergency_reason: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder="Describe in detail the reason for emergency access (e.g: Patient is in critical condition, need to view medication allergy history immediately...)"
              helperText="Please clearly describe the emergency reason. This information will be logged and reviewed."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="error"
            disabled={!formData.patient_id || !formData.emergency_reason.trim()}
          >
            XÁC NHẬN YÊU CẦU KHẨN CẤP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmergencyAccess;

