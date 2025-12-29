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
  Grid,
  Avatar,
  IconButton,
} from '@mui/material';
import api from '../services/api';
import { useKeycloak } from '../context/KeycloakContext';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';

function TeamManagement() {
  const { keycloak } = useKeycloak();
  const userRoles = keycloak?.tokenParsed?.realm_access?.roles || [];
  const isHeadReception = userRoles.includes('head_reception');
  const isHeadNurse = userRoles.includes('head_nurse');
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onDuty: 0,
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const role = isHeadReception ? 'receptionist' : 'nurse';
      const response = await api.get(`/admin/team/${role}`);
      setTeamMembers(response.data.members || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (isHeadReception) return 'Reception';
    if (isHeadNurse) return 'Nursing';
    return 'Staff';
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
          <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {getRoleLabel()} Team Management
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Staff
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h4">{stats.active}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  On Duty
                </Typography>
                <Typography variant="h4">{stats.onDuty}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Team Members Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Staff List</Typography>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => {
                  // Navigate to performance reports
                  window.location.href = '/reports?type=team-performance';
                }}
              >
                Performance Report
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No staff members
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>{member.name?.[0] || 'U'}</Avatar>
                            <Box>
                              <Typography variant="body1">{member.name || 'N/A'}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {member.email || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{member.role || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.status === 'active' ? 'Active' : 'Off'}
                            color={member.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {member.schedule || 'No schedule'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Open edit dialog
                              console.log('Edit member:', member);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
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
    </Container>
  );
}

export default TeamManagement;

