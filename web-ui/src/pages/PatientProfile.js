import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
} from '@mui/material';
import api from '../services/api';

function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchProfile();
    fetchMedicalRecords(1);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/patient/profile');
      setProfile(res.data);
    } catch (error) {
      console.error('Failed to fetch patient profile:', error);
    }
  };

  const fetchMedicalRecords = async (pageNum) => {
    try {
      setLoading(true);
      const res = await api.get(`/patient/medical-records?page=${pageNum}&page_size=${pageSize}`);
      setRecords(res.data.records || []);
      setTotalPages(Math.ceil(res.data.total / pageSize));
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    fetchMedicalRecords(newPage);
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      diagnosis: 'error',
      prescription: 'primary',
      lab_test: 'info',
      imaging: 'warning',
      surgery: 'error',
      note: 'default',
    };
    return colors[type] || 'default';
  };

  const getRecordTypeLabel = (type) => {
    const labels = {
      diagnosis: 'Diagnosis',
      prescription: 'Prescription',
      lab_test: 'Lab Test',
      imaging: 'Imaging',
      surgery: 'Surgery',
      note: 'Note'
    };
    return labels[type] || type;
  };

  const getSensitivityColor = (level) => {
    const colors = {
      normal: 'success',
      sensitive: 'warning',
      highly_sensitive: 'error'
    };
    return colors[level] || 'default';
  };

  const getSensitivityLabel = (level) => {
    const labels = {
      normal: 'Normal',
      sensitive: 'Sensitive',
      highly_sensitive: 'Highly Sensitive'
    };
    return labels[level] || level;
  };

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Patient Profile Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Patient Profile
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Patient Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.patient_code}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.full_name}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {new Date(profile.date_of_birth).toLocaleDateString('en-US')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Gender
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Phone Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.phone || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.email || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.address || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Emergency Contact
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {profile.emergency_contact_name || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Medical Records
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : records.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
              No medical records
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Record Type</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Diagnosis Code</TableCell>
                      <TableCell>Sensitivity Level</TableCell>
                      <TableCell>Created Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Chip
                            label={getRecordTypeLabel(record.record_type)}
                            color={getRecordTypeColor(record.record_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.title}</TableCell>
                        <TableCell>{record.diagnosis_code || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getSensitivityLabel(record.sensitivity_level)}
                            color={getSensitivityColor(record.sensitivity_level)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(record.created_at).toLocaleDateString('en-US')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PatientProfile;

