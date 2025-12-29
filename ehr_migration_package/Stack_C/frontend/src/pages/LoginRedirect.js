import React, { useEffect } from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

function LoginRedirect() {
  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('keycloak_token');
    if (token) {
      // Token exists, redirect to home
      window.location.href = '/';
    }
  }, []);

  const handleLoginRedirect = () => {
    // Redirect to main app for login
    window.location.href = 'http://localhost:3000';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Authentication Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You need to login through the main EHR application first.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          The SIEM Dashboard (port 3002) uses the same authentication as the main EHR system (port 3000).
          Please login to the main application first, then return here.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          onClick={handleLoginRedirect}
        >
          Go to Main Application
        </Button>
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            After logging in, you can access the SIEM Dashboard at http://localhost:3002
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginRedirect;

