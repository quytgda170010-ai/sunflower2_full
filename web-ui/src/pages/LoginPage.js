import React, { useState } from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import {
  Container,
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';

function LoginPage() {
  const { keycloak } = useKeycloak();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Keycloak object:', keycloak);
      console.log('Keycloak authenticated:', keycloak?.authenticated);
      console.log('Keycloak login method:', typeof keycloak?.login);

      if (!keycloak) {
        throw new Error('Keycloak not initialized');
      }

      await keycloak.login({
        redirectUri: window.location.origin + '/',
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');

      // Log failed login attempt
      try {
        const { API_BASE_URL } = await import('../services/api');
        await axios.post(`${API_BASE_URL}/admin/login/log`, {
          username: 'unknown',
          success: false,
          ip_address: 'client',
          roles: []
        });
      } catch (logError) {
        console.error('Failed to log failed login attempt:', logError);
      }

      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent>
            <Stack spacing={3} alignItems="center">
              <LockIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" align="center">
                EHR Sentinel
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary">
                EMR Compliance Monitoring System
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
                Secure access to manage users, policies, and system compliance
              </Typography>
              {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleLogin}
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Logging in...' : 'Login with Keycloak'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default LoginPage;

