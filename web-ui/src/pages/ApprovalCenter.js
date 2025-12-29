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
  Tabs,
  Tab,
} from '@mui/material';
import api from '../services/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

function ApprovalCenter() {
  const [tabValue, setTabValue] = useState(0);
  const [refunds, setRefunds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      if (tabValue === 0) {
        const response = await api.get('/admin/refunds/pending');
        setRefunds(response.data || []);
      } else {
        const response = await api.get('/admin/appointments/cancellation-requests');
        setAppointments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item, type) => {
    try {
      if (type === 'refund') {
        await api.put(`/admin/refunds/${item.id}/approve`, {
          reason,
        });
      } else {
        await api.put(`/admin/appointments/${item.id}/approve-cancellation`, {
          reason,
        });
      }
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error approving:', error);
      alert('An error occurred');
    }
  };

  const handleReject = async (item, type) => {
    try {
      if (type === 'refund') {
        await api.put(`/admin/refunds/${item.id}/reject`, {
          reason,
        });
      } else {
        await api.put(`/admin/appointments/${item.id}/reject-cancellation`, {
          reason,
        });
      }
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('An error occurred');
    }
  };

  const openApprovalDialog = (item, actionType, itemType) => {
    setSelectedItem(item);
    setAction(actionType);
    setReason('');
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Approval Center
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Refund Requests" icon={<AttachMoneyIcon />} />
              <Tab label="Last-Minute Appointment Cancellations" />
            </Tabs>

            {tabValue === 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request ID</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Request Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {refunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No refund requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>#{refund.id}</TableCell>
                          <TableCell>{refund.patient_name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(refund.amount || 0)}
                          </TableCell>
                          <TableCell>{refund.reason || 'N/A'}</TableCell>
                          <TableCell>
                            {refund.requested_at
                              ? new Date(refund.requested_at).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => openApprovalDialog(refund, 'approve', 'refund')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => openApprovalDialog(refund, 'reject', 'refund')}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Appointment ID</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Appointment Date & Time</TableCell>
                      <TableCell>Cancellation Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No cancellation requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>#{appointment.id}</TableCell>
                          <TableCell>{appointment.patient_name || 'N/A'}</TableCell>
                          <TableCell>
                            {appointment.appointment_date
                              ? new Date(appointment.appointment_date).toLocaleString('vi-VN')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{appointment.cancellation_reason || 'N/A'}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() =>
                                openApprovalDialog(appointment, 'approve', 'appointment')
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() =>
                                openApprovalDialog(appointment, 'reject', 'appointment')
                              }
                            >
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Approval/Rejection Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={action === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Enter approval notes...'
                    : 'Enter rejection reason...'
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (action === 'approve') {
                handleApprove(selectedItem, tabValue === 0 ? 'refund' : 'appointment');
              } else {
                handleReject(selectedItem, tabValue === 0 ? 'refund' : 'appointment');
              }
            }}
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ApprovalCenter;

