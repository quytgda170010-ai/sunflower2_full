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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import api from '../services/api';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/admin/complaints');
      setComplaints(response.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setResolution(complaint.resolution || '');
    setStatus(complaint.status || 'pending');
    setOpenDialog(true);
  };

  const handleResolve = async () => {
    try {
      await api.put(`/admin/complaints/${selectedComplaint.id}/resolve`, {
        resolution,
        status,
      });
      setOpenDialog(false);
      fetchComplaints();
    } catch (error) {
      console.error('Error resolving complaint:', error);
      alert('Error processing complaint');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
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
          <WarningIcon sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
          <Typography variant="h4" component="h1">
            Complaint Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Complaint ID</TableCell>
                    <TableCell>Complainant</TableCell>
                    <TableCell>Content</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No complaints
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell>#{complaint.id}</TableCell>
                        <TableCell>{complaint.complainant_name || 'N/A'}</TableCell>
                        <TableCell>
                          {complaint.content?.substring(0, 50) || 'N/A'}
                          {complaint.content?.length > 50 ? '...' : ''}
                        </TableCell>
                        <TableCell>
                          {complaint.created_at
                            ? new Date(complaint.created_at).toLocaleDateString('en-US')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(complaint.status)}
                            color={getStatusColor(complaint.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(complaint)}
                          >
                            Process
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

      {/* Dialog for resolving complaints */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Process Complaint</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Complainant: {selectedComplaint?.complainant_name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Content: {selectedComplaint?.content || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Resolution / Processing Notes"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter complaint resolution..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleResolve} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Complaints;

