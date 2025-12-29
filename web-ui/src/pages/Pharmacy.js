import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Alert,
  Pagination,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

function Pharmacy() {
  const [medications, setMedications] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    medication_code: '',
    name: '',
    description: '',
    unit: '',
    unit_price: '',
    stock_quantity: '',
    manufacturer: '',
    expiry_date: '',
  });

  useEffect(() => {
    fetchMedications();
  }, [page, searchQuery]);

  const fetchMedications = async () => {
    try {
      const params = { page, page_size: 10 };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const res = await api.get('/admin/medications', { params });
      setMedications(res.data.medications || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      setError('Unable to load medication list');
    }
  };

  const handleOpenDialog = (medication = null) => {
    if (medication) {
      setEditingMedication(medication);
      setFormData({
        medication_code: medication.medication_code || '',
        name: medication.name || '',
        description: medication.description || '',
        unit: medication.unit || '',
        unit_price: medication.unit_price || '',
        stock_quantity: medication.stock_quantity || '',
        manufacturer: medication.manufacturer || '',
        expiry_date: medication.expiry_date ? medication.expiry_date.split('T')[0] : '',
      });
    } else {
      setEditingMedication(null);
      setFormData({
        medication_code: '',
        name: '',
        description: '',
        unit: '',
        unit_price: '',
        stock_quantity: '',
        manufacturer: '',
        expiry_date: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMedication(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingMedication) {
        await api.put(`/admin/medications/${editingMedication.id}`, formData);
        setSuccess('Medication updated successfully!');
      } else {
        await api.post('/admin/medications', formData);
        setSuccess('Medication added successfully!');
      }
      handleCloseDialog();
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to save medication:', error);
      setError('Unable to save medication information');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;

    try {
      await api.delete(`/admin/medications/${id}`);
      setSuccess('Medication deleted successfully!');
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete medication:', error);
      setError('Unable to delete medication');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isLowStock = (quantity) => {
    return quantity < 10;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Pharmacy Management</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          ADD MEDICATION
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TextField
        fullWidth
        placeholder="Search by name, medication code, or manufacturer..."
        value={searchQuery}
        onChange={handleSearch}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Medication Code</TableCell>
              <TableCell>Medication Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medications.map((med) => (
              <TableRow key={med.id}>
                <TableCell>{med.medication_code}</TableCell>
                <TableCell>{med.name}</TableCell>
                <TableCell>{med.unit}</TableCell>
                <TableCell>{Number(med.unit_price).toLocaleString('en-US')} ₫</TableCell>
                <TableCell>
                  {isLowStock(med.stock_quantity) ? (
                    <Chip label={med.stock_quantity} color="warning" size="small" />
                  ) : (
                    med.stock_quantity
                  )}
                </TableCell>
                <TableCell>{med.manufacturer}</TableCell>
                <TableCell>
                  {med.expiry_date ? (
                    isExpired(med.expiry_date) ? (
                      <Chip 
                        label={new Date(med.expiry_date).toLocaleDateString('en-US')} 
                        color="error" 
                        size="small" 
                      />
                    ) : (
                      new Date(med.expiry_date).toLocaleDateString('en-US')
                    )
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(med)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(med.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingMedication ? 'Edit Medication Information' : 'Add New Medication'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Medication Code"
              name="medication_code"
              value={formData.medication_code}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Medication Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Unit Price (₫)"
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <TextField
              label="Stock Quantity"
              name="stock_quantity"
              type="number"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Expiry Date"
              name="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingMedication ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Pharmacy;

