import React, { useEffect } from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShieldIcon from '@mui/icons-material/Shield';

function AdminRedirect() {
  const { keycloak } = useKeycloak();
  const userName = keycloak?.tokenParsed?.name || 'Admin';

  const handleSecurityClick = () => {
    window.location.href = '/siem/';
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <ShieldIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome, {userName}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              System Administrator
            </Typography>
          </Box>

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" paragraph>
              As an <strong>Admin</strong>, you have access to the <strong>SIEM Dashboard</strong>{' '}
              to monitor security and legal compliance of the entire system.
            </Typography>
          </Box>

          {/* Main Security Button */}
          <Card
            sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
            onClick={handleSecurityClick}
          >
            <CardContent sx={{ py: 4 }}>
              <SecurityIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom>
                SIEM Dashboard
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Security & Legal Compliance Monitoring
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }
                }}
              >
                Open SIEM Dashboard →
              </Button>
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <Card sx={{ textAlign: 'center', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Security Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time activity monitoring
              </Typography>
            </Card>

            <Card sx={{ textAlign: 'center', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Compliance Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compliance violations summary
              </Typography>
            </Card>
          </Box>


        </Paper>
      </Container>
    </Box>
  );
}

export default AdminRedirect;

