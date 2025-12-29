import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';

function Home() {
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const userRoles = keycloak?.tokenParsed?.realm_access?.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isAdminHospital = userRoles.includes('admin_hospital');

  const quickActions = [
    {
      title: 'Users',
      description: 'Manage system users',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/users',
      roles: ['admin'],
    },
    {
      title: 'Patients',
      description: 'View and manage patients',
      icon: <LocalHospitalIcon sx={{ fontSize: 40 }} />,
      path: '/patients',
      roles: ['admin', 'doctor', 'nurse'],
    },
    {
      title: 'Departments',
      description: 'Manage hospital departments',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      path: '/departments',
      roles: ['admin'],
    },
    {
      title: 'Security & Analytics',
      description: 'Monitor logs and compliance',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      path: '/siem/',
      roles: ['admin', 'admin_hospital'],
      external: true,
    },
  ];

  const handleActionClick = (action) => {
    if (action.external) {
      window.open(action.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(action.path);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to EHR Sentinel
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Electronic Health Records Management System
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {quickActions.map((action) => {
            // Check if user has required role
            if (action.roles) {
              const hasRole = action.roles.some(role => userRoles.includes(role));
              if (!hasRole) return null;
            }

            return (
              <Grid item xs={12} sm={6} md={3} key={action.title}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s',
                    },
                  }}
                  onClick={() => handleActionClick(action)}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {(isAdmin || isAdminHospital) && (
          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Gateway
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      Online
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Authentication
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      Active
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Monitoring
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      Running
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Home;

