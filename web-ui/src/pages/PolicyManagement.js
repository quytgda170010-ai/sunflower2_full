import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Dialog,
} from '@mui/material';
import api from '../services/api';

function PolicyManagement() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyCode, setPolicyCode] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/policies');
      setPolicies(res.data);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setPolicyCode(policy.code);
    setOpenDialog(true);
  };

  const handleSavePolicy = async () => {
    try {
      await api.put(`/admin/policies/${selectedPolicy.id}`, { code: policyCode });
      setOpenDialog(false);
      fetchPolicies();
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Policy Management (OPA)
      </Typography>

      <Grid container spacing={3}>
        {policies.map((policy) => (
          <Grid item xs={12} md={6} key={policy.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {policy.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {policy.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEditPolicy(policy)}
                  >
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error">
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Edit Policy: {selectedPolicy?.name}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={policyCode}
            onChange={(e) => setPolicyCode(e.target.value)}
            variant="outlined"
            sx={{ fontFamily: 'monospace', mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleSavePolicy}>
              Save
            </Button>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}

export default PolicyManagement;

