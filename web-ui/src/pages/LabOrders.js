import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
} from '@mui/material';
import api from '../services/api';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import InfoIcon from '@mui/icons-material/Info';

function LabOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/lab-orders');
      // Handle response format: {data: [...], pagination: {...}} or direct array
      let ordersData = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
      // If endpoint doesn't exist, show info message
      if (error.response?.status === 404) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setResult(order.result || '');
    setStatus(order.status || 'pending');
    setOpenDialog(true);
  };

  const handleUpdateResult = async () => {
    try {
      await api.put(`/admin/lab-orders/${selectedOrder.id}`, {
        result,
        status,
      });
      setOpenDialog(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating lab order:', error);
      alert('Error updating result');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
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
      case 'completed':
        return 'Completed';
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
          <ScienceIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Lab Orders Management
          </Typography>
        </Box>

        {/* Info Alert for Internal Medicine Workflow */}
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/internal-medicine-lab-processing')}
            >
              Go to Internal Medicine Lab Processing
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Note:</strong> Internal Medicine patients use a separate workflow. Please go to the <strong>"Internal Medicine Lab Processing"</strong> page to process lab tests for Internal Medicine patients.
          </Typography>
        </Alert>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Code</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Test Type</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No lab orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.patient_id}</TableCell>
                        <TableCell>{order.patient_name || 'N/A'}</TableCell>
                        <TableCell>{order.test_type || 'N/A'}</TableCell>
                        <TableCell>
                          {order.order_date
                            ? new Date(order.order_date).toLocaleDateString('en-US')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(order)}
                          >
                            View Details
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

      {/* Dialog for updating results */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Lab Test Result</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Patient: {selectedOrder?.patient_name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Test Type: {selectedOrder?.test_type || 'N/A'}
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
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Lab Test Result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Enter lab test result..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateResult} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LabOrders;

