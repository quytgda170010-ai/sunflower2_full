import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import api from '../services/api';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function BHYTManagement() {
  const [bhyts, setBHYTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBHYT, setSelectedBHYT] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetchBHYTs();
  }, []);

  const fetchBHYTs = async () => {
    try {
      const response = await api.get('/admin/bhyt/verifications');
      setBHYTs(response.data || []);
    } catch (error) {
      console.error('Error fetching BHYT verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      await api.put(`/admin/bhyt/${selectedBHYT.id}/verify`, {
        status,
      });
      setOpenDialog(false);
      fetchBHYTs();
    } catch (error) {
      console.error('Error verifying BHYT:', error);
      alert('Error verifying BHYT card');
    }
  };

  const handleViewDetails = (bhyt) => {
    setSelectedBHYT(bhyt);
    setStatus(bhyt.status || 'pending');
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'invalid':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'invalid':
        return 'Invalid';
      case 'pending':
        return 'Pending Verification';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalHospitalIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Health Insurance (BHYT) Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Card Number</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Valid From</TableCell>
                    <TableCell>Valid To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bhyts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No BHYT cards
                      </TableCell>
                    </TableRow>
                  ) : (
                    bhyts.map((bhyt) => (
                      <TableRow key={bhyt.id}>
                        <TableCell>{bhyt.card_number || 'N/A'}</TableCell>
                        <TableCell>{bhyt.patient_name || 'N/A'}</TableCell>
                        <TableCell>
                          {bhyt.valid_from
                            ? new Date(bhyt.valid_from).toLocaleDateString('en-US')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {bhyt.valid_to
                            ? new Date(bhyt.valid_to).toLocaleDateString('en-US')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(bhyt.status)}
                            color={getStatusColor(bhyt.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(bhyt)}
                          >
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Verification Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify BHYT Card</DialogTitle>
        <DialogContent>
          {selectedBHYT && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Card Number: {selectedBHYT.card_number || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Patient: {selectedBHYT.patient_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Valid From: {selectedBHYT.valid_from ? new Date(selectedBHYT.valid_from).toLocaleDateString('en-US') : 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Valid To: {selectedBHYT.valid_to ? new Date(selectedBHYT.valid_to).toLocaleDateString('en-US') : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending Verification</option>
                  <option value="verified">Valid</option>
                  <option value="invalid">Invalid</option>
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleVerify} variant="contained" color="primary">
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BHYTManagement;

