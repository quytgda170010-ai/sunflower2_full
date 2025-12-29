import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  NotificationImportant as NotificationIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { useKeycloak } from '../context/KeycloakContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function PatientLookup() {
  const navigate = useNavigate();
  const { subscribe } = useWebSocket();
  const { keycloak } = useKeycloak();
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);

  // New states for queue and history
  const [upcomingPatients, setUpcomingPatients] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [calledPatient, setCalledPatient] = useState(null);

  // Fetch upcoming patients from queue
  const fetchUpcomingPatients = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Get current user's username (doctor_id)
      const username = keycloak?.tokenParsed?.preferred_username || '';
      
      // Build query: Get patients that are waiting OR in_progress OR waiting_doctor_review (Internal Medicine workflow)
      // For doctors: Show waiting patients (any doctor can see) + in_progress patients assigned to them + waiting_doctor_review (Internal Medicine)
      let url = `/admin/appointments?date=${today}&status=waiting,in_progress,waiting_doctor_review`;
      
      // Also fetch Internal Medicine workflow patients (from last 7 days)
      let internalMedPatients = [];
      try {
        const internalMedResponse = await api.get('/admin/queues/internal-med/doctor');
        if (internalMedResponse.data?.appointments) {
          internalMedPatients = internalMedResponse.data.appointments.map(apt => ({
            id: apt.id,
            patient_id: apt.patient_id,
            patient_name: apt.patient_name,
            patient_code: apt.patient_code,
            department_name: apt.department_name || 'Internal Medicine',
            reason_text: apt.reason_text,
            appointment_time: apt.appointment_time,
            appointment_date: apt.appointment_date,
            status: apt.status || 'waiting_doctor_review',
            is_internal_medicine: true, // Flag to identify Internal Medicine workflow
          }));
        }
      } catch (err) {
        console.warn('Error fetching Internal Medicine queue:', err);
      }
      
      // If user is a doctor, also filter by doctor_id to show their in_progress patients
      // Note: Backend will handle filtering - we just need to ensure we get both waiting and in_progress
      const response = await api.get(url);
      
      // Filter on frontend: Show waiting patients + all in_progress patients + waiting_doctor_review
      // When a patient is called in, any doctor can see them
      let filteredData = [];
      if (Array.isArray(response.data)) {
        filteredData = response.data.filter(apt => {
          // Show all waiting patients (any doctor can take them)
          if (apt.status === 'waiting') return true;
          // Show all in_progress patients (any doctor can see who's being examined)
          if (apt.status === 'in_progress') return true;
          // Show waiting_doctor_review patients (Internal Medicine workflow)
          if (apt.status === 'waiting_doctor_review') return true;
          return false;
        });
        
        // Merge Internal Medicine patients with regular patients
        // Remove duplicates (if a patient appears in both lists, prefer Internal Medicine version)
        const allPatients = [...filteredData];
        internalMedPatients.forEach(imPatient => {
          const existingIndex = allPatients.findIndex(p => p.id === imPatient.id);
          if (existingIndex >= 0) {
            // Replace with Internal Medicine version (has more info)
            allPatients[existingIndex] = imPatient;
          } else {
            // Add new Internal Medicine patient
            allPatients.push(imPatient);
          }
        });
        
        // Sort: in_progress first (prioritize patients already being examined),
        // then waiting_doctor_review (Internal Medicine), then waiting, then by appointment_time
        allPatients.sort((a, b) => {
          // Prioritize in_progress patients assigned to this doctor
          if (a.status === 'in_progress' && a.doctor_id === username && 
              (b.status !== 'in_progress' || b.doctor_id !== username)) return -1;
          if (b.status === 'in_progress' && b.doctor_id === username && 
              (a.status !== 'in_progress' || a.doctor_id !== username)) return 1;
          // Then other in_progress patients
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
          // Then prioritize waiting_doctor_review (Internal Medicine workflow)
          if (a.status === 'waiting_doctor_review' && b.status !== 'waiting_doctor_review') return -1;
          if (b.status === 'waiting_doctor_review' && a.status !== 'waiting_doctor_review') return 1;
          // Then by appointment_time
          return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });
        // Limit to 5 most relevant (increased from 3 to show more Internal Medicine patients)
        filteredData = allPatients.slice(0, 5);
      } else {
        // If response.data is not an array, still try to show Internal Medicine patients
        setUpcomingPatients(internalMedPatients.slice(0, 5));
        return;
      }
      
      setUpcomingPatients(filteredData);
    } catch (err) {
      console.error('Failed to fetch upcoming patients:', err);
      setUpcomingPatients([]);
    }
  };

  // Load upcoming patients and recent history on mount
  useEffect(() => {
    fetchUpcomingPatients();

    // Load recent patients from localStorage
    const recent = JSON.parse(localStorage.getItem('recentPatients') || '[]');
    setRecentPatients(recent.slice(0, 5));

    // Auto refresh upcoming patients every 30 seconds
    const interval = setInterval(fetchUpcomingPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for called patient notifications via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe('patient_called', (message) => {
      console.log('Patient called notification received:', message);

      // Set called patient for alert
      setCalledPatient({
        patient_id: message.data.patient_id,
        patient_name: message.data.patient_name,
        patient_code: message.data.patient_code,
        reason: message.data.reason,
      });

      // Refresh upcoming patients list
      fetchUpcomingPatients();

      // Play notification sound (optional)
      // const audio = new Audio('/notification.mp3');
      // audio.play().catch(err => console.log('Failed to play sound:', err));
    });

    return () => unsubscribe();
  }, [subscribe]);

  const handleSearch = async (id = null) => {
    const searchId = id || patientId;

    if (!searchId || !searchId.toString().trim()) {
      setError('Please enter patient ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPatient(null);

      // Fetch patient info
      const patientRes = await api.get(`/admin/patients/${searchId}`);
      const patientData = patientRes.data;
      setPatient(patientData);

      // Save to recent patients
      const recent = JSON.parse(localStorage.getItem('recentPatients') || '[]');
      const newRecent = [
        { id: patientData.id, name: patientData.full_name, code: patientData.patient_code },
        ...recent.filter(p => p.id !== patientData.id)
      ].slice(0, 5);
      localStorage.setItem('recentPatients', JSON.stringify(newRecent));
      setRecentPatients(newRecent);

      // Fetch diagnoses
      try {
        const diagnosesRes = await api.get(`/patients/${searchId}/diagnoses`);
        setDiagnoses(diagnosesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch diagnoses:', err);
        setDiagnoses([]);
      }

      // Fetch prescriptions
      try {
        const prescriptionsRes = await api.get(`/patients/${searchId}/prescriptions`);
        setPrescriptions(prescriptionsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err);
        setPrescriptions([]);
      }

      // Fetch lab orders
      try {
        const labOrdersRes = await api.get(`/patients/${searchId}/lab_orders`);
        setLabOrders(labOrdersRes.data || []);
      } catch (err) {
        console.error('Failed to fetch lab orders:', err);
        setLabOrders([]);
      }

    } catch (err) {
      console.error('Failed to fetch patient:', err);
      setError(err.response?.data?.detail || 'Patient not found with this ID');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Patient Lookup
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Enter patient ID to view detailed records
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Queue and Recent */}
        <Grid item xs={12} md={4}>
          {/* Called Patient Alert */}
          {calledPatient && (
            <Alert
              severity="info"
              icon={<NotificationIcon />}
              sx={{ mb: 2, animation: 'pulse 2s infinite' }}
              onClose={() => setCalledPatient(null)}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Patient Called In
              </Typography>
              <Typography variant="body2">
                {calledPatient.patient_name} - Code: {calledPatient.patient_code}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => handleSearch(calledPatient.patient_id)}
              >
                Open Record
              </Button>
            </Alert>
          )}

          {/* Upcoming Patients */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HospitalIcon color="primary" />
              Upcoming Patients
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {upcomingPatients.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No patients in queue
              </Typography>
            ) : (
              <List dense>
                {upcomingPatients.map((p, index) => {
                  const isInternalWorkflow = p.is_internal_medicine || p.status === 'waiting_doctor_review';
                  return (
                    <ListItem
                      key={p.id}
                      button
                      onClick={() => {
                        // If Internal Medicine workflow (already in doctor review queue), navigate to the review page
                        if (isInternalWorkflow) {
                          navigate(`/internal-medicine-doctor-review`);
                        } else {
                          // Otherwise open patient details directly
                          handleSearch(p.patient_id);
                        }
                      }}
                      sx={{
                        bgcolor: p.status === 'in_progress' ? '#e3f2fd' : p.status === 'waiting_doctor_review' ? '#e1f5fe' : 'inherit',
                        borderRadius: 1,
                        mb: 1,
                        border: p.status === 'in_progress' ? '2px solid #1976d2' : p.status === 'waiting_doctor_review' ? '2px solid #0288d1' : '1px solid #e0e0e0',
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={index + 1} color="primary">
                          <Avatar sx={{ bgcolor: p.status === 'in_progress' ? 'primary.main' : p.status === 'waiting_doctor_review' ? 'info.main' : 'grey.400' }}>
                            <PersonIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <ListItemText
                          primary={<Typography fontWeight="bold">{p.patient_name || 'N/A'}</Typography>}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                Code: {p.patient_code || 'N/A'}
                              </Typography>
                              <Chip
                                label={
                                  p.status === 'in_progress' ? 'In Progress' :
                                  p.status === 'waiting_doctor_review' ? 'Waiting for Exam (Internal Medicine)' :
                                  'Waiting'
                                }
                                size="small"
                                color={
                                  p.status === 'in_progress' ? 'primary' :
                                  p.status === 'waiting_doctor_review' ? 'info' :
                                  'default'
                                }
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                        {isInternalWorkflow && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Tooltip title="Quick view record in Lookup page" arrow>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSearch(p.patient_id);
                                }}
                              >
                                Quick View
                              </Button>
                            </Tooltip>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Click card to open examination workflow
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>

          {/* Recent Patients */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="action" />
              Access History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentPatients.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No history yet
              </Typography>
            ) : (
              <List dense>
                {recentPatients.map((p) => (
                  <ListItem
                    key={p.id}
                    button
                    onClick={() => handleSearch(p.id)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.300' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={p.name}
                      secondary={`Code: ${p.code}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Patient Details - Only show when patient is selected */}
        {patient && (
          <Grid item xs={12} md={7} lg={8}>
            {/* Patient Info */}
            <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mr: 2 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {patient.full_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`ID: ${patient.id}`} size="small" color="primary" />
                    <Chip label={`Patient Code: ${patient.patient_code}`} size="small" />
                    <Chip 
                      label={patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                  <Typography variant="body1">{patient.date_of_birth || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{patient.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="textSecondary">Email</Typography>
                  <Typography variant="body1">{patient.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="textSecondary">Address</Typography>
                  <Typography variant="body1">{patient.address || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for Medical Info */}
          <Paper>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<AssignmentIcon />} label="Diagnoses" />
              <Tab icon={<MedicationIcon />} label="Prescriptions" />
              <Tab icon={<ScienceIcon />} label="Lab Tests" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {diagnoses.length > 0 ? (
                <Box>
                  {diagnoses.map((diagnosis, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {diagnosis.diagnosis_code || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {diagnosis.description || 'No description'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          Date: {diagnosis.diagnosis_date || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No diagnoses yet</Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {prescriptions.length > 0 ? (
                <Box>
                  {prescriptions.map((prescription, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {prescription.medication_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Dosage: {prescription.dosage || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Frequency: {prescription.frequency || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          Prescribed Date: {prescription.prescribed_date || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No prescriptions yet</Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {labOrders.length > 0 ? (
                <Box>
                  {labOrders.map((labOrder, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {labOrder.test_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Result: {labOrder.result || 'No result yet'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          Order Date: {labOrder.order_date || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No lab tests yet</Alert>
              )}
            </TabPanel>
          </Paper>
          </Grid>
        )}

        {/* Empty State - Show when no patient is selected but there are upcoming patients */}
        {!patient && !loading && !error && upcomingPatients.length > 0 && (
          <Grid item xs={12} md={7} lg={8}>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Select a patient to view detailed records
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Click on a patient in the "Upcoming Patients" list on the left
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Empty State - No patients at all */}
        {!patient && !loading && !error && upcomingPatients.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
              <HospitalIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No patients in queue
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Use the search field above to find a patient by ID
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default PatientLookup;

