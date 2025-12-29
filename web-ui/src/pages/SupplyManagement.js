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
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function SupplyManagement() {
  const [supplies, setSupplies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [action, setAction] = useState('approve');
  const [quantity, setQuantity] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      if (tabValue === 0) {
        const response = await api.get('/admin/supplies');
        setSupplies(response.data || []);
      } else {
        const response = await api.get('/admin/supply-requests/pending');
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    try {
      await api.put(`/admin/supply-requests/${selectedRequest.id}/approve`, {
        approved_quantity: quantity,
      });
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred');
    }
  };

  const handleRejectRequest = async () => {
    try {
      await api.put(`/admin/supply-requests/${selectedRequest.id}/reject`);
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('An error occurred');
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
          <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Medical Supply Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Button
                variant={tabValue === 0 ? 'contained' : 'text'}
                onClick={() => setTabValue(0)}
                sx={{ mr: 2 }}
              >
                Inventory
              </Button>
              <Button
                variant={tabValue === 1 ? 'contained' : 'text'}
                onClick={() => setTabValue(1)}
              >
                Supply Requests
              </Button>
            </Box>

            {tabValue === 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Supply Name</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplies.map((supply) => (
                        <TableRow key={supply.id}>
                          <TableCell>{supply.name || 'N/A'}</TableCell>
                          <TableCell>{supply.unit || 'N/A'}</TableCell>
                          <TableCell>{supply.quantity || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={supply.quantity < supply.min_stock ? 'Low Stock' : 'In Stock'}
                              color={supply.quantity < supply.min_stock ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Requester</TableCell>
                      <TableCell>Supply</TableCell>
                      <TableCell>Requested Quantity</TableCell>
                      <TableCell>Request Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.requested_by || 'N/A'}</TableCell>
                          <TableCell>{request.supply_name || 'N/A'}</TableCell>
                          <TableCell>{request.quantity || 0}</TableCell>
                          <TableCell>
                            {request.requested_at
                              ? new Date(request.requested_at).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => {
                                setSelectedRequest(request);
                                setQuantity(request.quantity);
                                setAction('approve');
                                setOpenDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAction('reject');
                                setOpenDialog(true);
                              }}
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

      {/* Approval Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Supply Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Supply: {selectedRequest.supply_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Requested Quantity: {selectedRequest.quantity || 0}
                </Typography>
              </Grid>
              {action === 'approve' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Approved Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: selectedRequest.quantity }}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          {action === 'approve' ? (
            <Button onClick={handleApproveRequest} variant="contained" color="success">
              Approve
            </Button>
          ) : (
            <Button onClick={handleRejectRequest} variant="contained" color="error">
              Reject
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SupplyManagement;

