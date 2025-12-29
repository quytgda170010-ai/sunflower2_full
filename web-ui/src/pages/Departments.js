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
} from '@mui/material';
import api from '../services/api';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async () => {
    try {
      await api.post('/admin/departments', formData);
      setOpenDialog(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Failed to add department:', error);
      alert('Failed to add department');
    }
  };

  const handleEditClick = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || ''
    });
    setOpenDialog(true);
  };

  const handleUpdateDept = async () => {
    try {
      await api.put(`/admin/departments/${editingDept.id}`, formData);
      setOpenDialog(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Failed to update department:', error);
      alert('Failed to update department');
    }
  };

  const handleSaveDept = () => {
    if (!formData.name) {
      alert('Please fill in department name');
      return;
    }
    if (editingDept) {
      handleUpdateDept();
    } else {
      handleAddDept();
    }
  };

  const handleDeleteClick = (dept) => {
    setDeptToDelete(dept);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/admin/departments/${deptToDelete.id}`);
      setDeleteConfirmDialog(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
      alert('Failed to delete department');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingDept(null);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Department Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          ADD DEPARTMENT
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Department Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept.description || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEditClick(dept)}
                    sx={{ mr: 1 }}
                  >
                    EDIT
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteClick(dept)}
                  >
                    DELETE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Department Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>CANCEL</Button>
          <Button onClick={handleSaveDept} variant="contained" color="primary">
            {editingDept ? 'UPDATE' : 'ADD'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete department <strong>{deptToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>CANCEL</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Departments;

