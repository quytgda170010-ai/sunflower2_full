import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import api from '../services/api';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

// Helper to avoid rendering objects (React #130) and to keep UI stable when API returns unexpected shapes
const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch (e) {
    return fallback;
  }
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    patient: null, // Store selected patient object
    appointment_date: null, // Use dayjs object
    appointment_time: null, // Use dayjs object
    reason_text: '',
    doctor_id: '',
    department_id: '',
  });

  // Patient search states
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Master data
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchMasterData();
  }, []);

  // Helper: normalize API response to array (supports {data: []}, {data: {data: []}}, or raw [])
  const toArray = (resp) => {
    const raw = resp?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    return [];
  };

  // Fetch master data (doctors and departments)
  const fetchMasterData = async () => {
    // Departments
    try {
      const deptResponse = await api.get('/admin/departments');
      setDepartments(toArray(deptResponse));
    } catch (error) {
      console.warn('Error fetching departments:', error?.response?.status || error?.message);
      setDepartments([]);
    }

    // Doctors (may be forbidden for receptionist)
    try {
      const doctorResponse = await api.get('/admin/doctors');
      const doctorData = toArray(doctorResponse);
      setDoctors(doctorData);
      setFilteredDoctors(doctorData);
    } catch (error) {
      if (error?.response?.status === 403) {
        console.info('Doctors list not permitted for this role (403), skipping');
      } else {
        console.warn('Error fetching doctors:', error?.response?.status || error?.message);
      }
      setDoctors([]);
      setFilteredDoctors([]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/admin/appointments');
      // Ensure response.data is an array
      const data = toArray(response);
      if (!Array.isArray(data)) {
        console.warn('Invalid response data:', response?.data);
        setAppointments([]);
        return;
      }
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce function for patient search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Search patients by phone or CCCD
  const searchPatients = async (query) => {
    setPatientSearchLoading(true);
    try {
      const trimmedQuery = query.trim();
      const res = await api.get('/admin/patients/search', {
        params: { q: trimmedQuery, exact: true }
      });
      setPatientSearchResults(res.data || []);
    } catch (error) {
      console.error('Failed to search patients:', error);
      setPatientSearchResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearchPatients = useCallback(
    debounce((query) => {
      searchPatients(query);
    }, 300),
    []
  );

  // Handle patient selection change
  const handlePatientChange = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      const displayText = newValue.phone || newValue.cccd || '';
      setPatientSearchQuery(displayText);
      setFormData((prev) => ({
        ...prev,
        patient_id: newValue.id || '',
        patient: newValue,
      }));
      setPatientSearchOpen(false);
    } else if (newValue === null) {
      setFormData((prev) => ({
        ...prev,
        patient_id: '',
        patient: null,
      }));
      setPatientSearchQuery('');
      setPatientSearchResults([]);
    }
  };

  // Handle doctor selection change
  const handleDoctorChange = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        doctor_id: newValue.id,
        department_id: newValue.department_id || '', // Auto-fill department from doctor
      }));
      // Filter doctors by selected department (if any)
      if (newValue.department_id) {
        setFilteredDoctors(doctors.filter(d => d.department_id === newValue.department_id));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        doctor_id: '',
        // Don't clear department_id if it was manually selected
      }));
      setFilteredDoctors(doctors);
    }
  };

  // Handle department selection change
  const handleDepartmentChange = (event) => {
    const deptId = event.target.value;
    setFormData((prev) => ({
      ...prev,
      department_id: deptId,
      // Clear doctor if department changes and doctor doesn't belong to new department
      doctor_id: prev.doctor_id && filteredDoctors.find(d => d.id === prev.doctor_id && d.department_id === deptId) 
        ? prev.doctor_id 
        : '',
    }));
    // Filter doctors by selected department
    if (deptId) {
      setFilteredDoctors(doctors.filter(d => d.department_id === deptId));
    } else {
      setFilteredDoctors(doctors);
    }
  };

  const handleCreate = async () => {
    try {
      // Validation
      if (!formData.patient_id) {
        alert('Vui lòng chọn bệnh nhân');
        return;
      }
      if (!formData.department_id && !formData.doctor_id) {
        alert('Vui lòng chọn bác sĩ hoặc khoa');
        return;
      }
      if (!formData.appointment_date) {
        alert('Vui lòng chọn ngày hẹn');
        return;
      }
      if (!formData.appointment_time) {
        alert('Vui lòng chọn giờ hẹn');
        return;
      }

      // Prepare request body
      const requestBody = {
        patient_id: formData.patient_id,
        appointment_date: dayjs(formData.appointment_date).format('YYYY-MM-DD'),
        appointment_time: dayjs(formData.appointment_time).format('HH:mm:ss'),
        reason_text: formData.reason_text || null,
        status: 'waiting',
      };

      // Add department_id or doctor_id
      if (formData.doctor_id) {
        requestBody.doctor_id = formData.doctor_id;
        // department_id will be auto-filled from doctor_id in backend
        if (formData.department_id) {
          requestBody.department_id = formData.department_id;
        }
      } else if (formData.department_id) {
        requestBody.department_id = formData.department_id;
      }

      await api.post('/admin/appointments', requestBody);
      setOpenDialog(false);
      setFormData({
        patient_id: '',
        patient: null,
        appointment_date: null,
        appointment_time: null,
        reason_text: '',
        doctor_id: '',
        department_id: '',
      });
      setPatientSearchQuery('');
      setPatientSearchResults([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.detail || 'Không thể tạo lịch hẹn');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      patient_id: '',
      patient: null,
      appointment_date: null,
      appointment_time: null,
      reason_text: '',
      doctor_id: '',
      department_id: '',
    });
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setPatientSearchOpen(false);
  };

  const handleUpdate = async (id, status) => {
    try {
      await api.put(`/admin/appointments/${id}`, { status });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('An error occurred');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Appointment Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Appointment
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Code</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Appointment Date/Time</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No appointments
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments && Array.isArray(appointments) && appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{safeText(appointment.patient_id)}</TableCell>
                        <TableCell>{safeText(appointment.patient_name)}</TableCell>
                        <TableCell>
                          {appointment.appointment_date && appointment.appointment_time
                            ? `${new Date(appointment.appointment_date).toLocaleDateString('en-US')} ${appointment.appointment_time}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{safeText(appointment.reason)}</TableCell>
                        <TableCell>{safeText(appointment.doctor_name)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(appointment.status)}
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                sx={{ mr: 1 }}
                                onClick={() => handleUpdate(appointment.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleUpdate(appointment.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
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

      {/* Create Appointment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Patient Search */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tìm kiếm bệnh nhân (Số CCCD hoặc Số điện thoại) *
              </Typography>
              <Autocomplete
                open={patientSearchOpen}
                onOpen={() => {
                  const numericOnly = /^\d+$/.test(patientSearchQuery);
                  const isValidLength = patientSearchQuery.length === 10 || patientSearchQuery.length === 12;
                  if ((numericOnly && isValidLength && patientSearchResults.length > 0) || !formData.patient) {
                    setPatientSearchOpen(true);
                  }
                }}
                onClose={() => setPatientSearchOpen(false)}
                options={patientSearchResults}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  const cccd = option.cccd ? ` - CCCD: ${option.cccd}` : '';
                  return `${option.full_name || ''} - ${option.phone || ''}${cccd}`;
                }}
                loading={patientSearchLoading}
                value={formData.patient || null}
                onChange={handlePatientChange}
                inputValue={patientSearchQuery}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    const digitsOnly = newInputValue.replace(/\D/g, '');
                    const displayValue = digitsOnly;
                    if (formData.patient && displayValue !== patientSearchQuery) {
                      setFormData((prev) => ({
                        ...prev,
                        patient_id: '',
                        patient: null,
                      }));
                    }
                    setPatientSearchQuery(displayValue);
                    if (displayValue.length === 10 || displayValue.length === 12) {
                      debouncedSearchPatients(displayValue);
                    } else {
                      setPatientSearchResults([]);
                      setPatientSearchOpen(false);
                    }
                  } else if (reason === 'clear') {
                    setPatientSearchQuery('');
                    setPatientSearchResults([]);
                    setFormData((prev) => ({
                      ...prev,
                      patient_id: '',
                      patient: null,
                    }));
                  }
                }}
                filterOptions={(x) => x}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Nhập 10 số (SĐT) hoặc 12 số (CCCD)"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {patientSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Chỉ hỗ trợ tìm kiếm chính xác: nhập đủ 10 số điện thoại hoặc 12 số CCCD.
              </Typography>
            </Grid>

            {/* Doctor Selection (Optional) */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={filteredDoctors}
                getOptionLabel={(option) => option.name || ''}
                value={doctors.find(d => d.id === formData.doctor_id) || null}
                onChange={handleDoctorChange}
                renderInput={(params) => (
                  <TextField {...params} label="Bác sĩ (tùy chọn)" placeholder="Chọn bác sĩ" />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.department_name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Department Selection (Required if no doctor) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required={!formData.doctor_id}>
                <InputLabel>Khoa {!formData.doctor_id && '*'}</InputLabel>
                <Select
                  value={formData.department_id || ''}
                  onChange={handleDepartmentChange}
                  label={`Khoa ${!formData.doctor_id ? '*' : ''}`}
                  disabled={!!formData.doctor_id} // Disable if doctor is selected
                >
                  <MenuItem value="">-- Chọn khoa --</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.doctor_id && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Khoa đã được tự động chọn từ bác sĩ
                </Typography>
              )}
            </Grid>

            {/* Appointment Date */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Ngày hẹn *"
                  value={formData.appointment_date}
                  onChange={(newValue) => {
                    setFormData((prev) => ({ ...prev, appointment_date: newValue }));
                  }}
                  minDate={dayjs()} // Cannot select past dates
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  format="DD/MM/YYYY"
                />
              </LocalizationProvider>
            </Grid>

            {/* Appointment Time */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Giờ hẹn *"
                  value={formData.appointment_time}
                  onChange={(newValue) => {
                    setFormData((prev) => ({ ...prev, appointment_time: newValue }));
                  }}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  format="HH:mm"
                />
              </LocalizationProvider>
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Lý do khám"
                value={formData.reason_text}
                onChange={(e) => setFormData({ ...formData, reason_text: e.target.value })}
                placeholder="Nhập lý do khám (tùy chọn)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Tạo lịch hẹn
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Appointments;
