
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  LocalHospital as LocalHospitalIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../services/api';
// Removed unused WebSocket hook to avoid context errors on this page

// Error boundary to surface component stack for React error #130
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    // Helper safeText is not available here, define local or use simple check
    const msg = error?.message || 'Rendering error';
    return { hasError: true, message: typeof msg === 'string' ? msg : JSON.stringify(msg) };
  }
  componentDidCatch(error, info) {
    console.error('QueueManagement render error:', error);
    console.error('QueueManagement component stack:', info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Đã xảy ra lỗi khi hiển thị trang Hàng chờ. Vui lòng tải lại hoặc báo cho kỹ thuật.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {this.state.message}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

function QueueManagement() {
  // const { sendMessage, connected } = useWebSocket();
  // Helper to prevent "objects are not valid as a React child" (React error #130)
  const safeText = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch (e) {
      return fallback;
    }
  };
  const toMessage = (value, fallback = 'Đã có lỗi xảy ra') => safeText(value, fallback);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // Form state for adding patient
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [reasonText, setReasonText] = useState('');
  const [hasOtherSelected, setHasOtherSelected] = useState(false);

  // Master data
  const [reasonTags, setReasonTags] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch master data
  const fetchMasterData = async () => {
    try {
      // Fetch reason tags
      const tagsResponse = await api.get('/admin/reason-tags');
      // Handle both raw array and wrapped { data: [...] } response
      const rawTags = Array.isArray(tagsResponse.data)
        ? tagsResponse.data
        : (tagsResponse.data && Array.isArray(tagsResponse.data.data) ? tagsResponse.data.data : []);

      // Only keep necessary fields and normalize them - don't spread entire object
      const tagsData = rawTags.map(t => {
        // Extract only primitive fields we need
        const tagId = safeText(t?.id, '');
        const tagText = safeText(t?.tag_text, '');
        return {
          id: tagId,
          tag_text: tagText,
        };
      });
      // Sort tags: "Khác" should appear last
      const sortedTags = [...tagsData].sort((a, b) => {
        const aText = a.tag_text || '';
        const bText = b.tag_text || '';
        if (aText === 'Khác') return 1;
        if (bText === 'Khác') return -1;
        return 0;
      });
      setReasonTags(sortedTags);

      // Fetch departments
      const deptResponse = await api.get('/admin/departments');
      // Handle both raw array and wrapped { data: [...] } response
      const rawDepts = Array.isArray(deptResponse.data)
        ? deptResponse.data
        : (deptResponse.data && Array.isArray(deptResponse.data.data) ? deptResponse.data.data : []);

      // Only keep necessary fields and normalize them - don't spread entire object
      const deptData = rawDepts.map(d => {
        // Ensure id is always a primitive
        const deptId = (() => {
          const rawId = d?.id;
          if (rawId === null || rawId === undefined) return '';
          if (typeof rawId === 'string' || typeof rawId === 'number') return String(rawId);
          if (typeof rawId === 'object' && rawId !== null) {
            return rawId.id ? String(rawId.id) : '0';
          }
          return String(rawId);
        })();
        return {
          id: deptId,
          name: safeText(d?.name, 'N/A'),
        };
      });
      setDepartments(deptData);
    } catch (err) {
      console.error('Error fetching master data:', err);
      // Set empty arrays on error
      setReasonTags([]);
      setDepartments([]);
      setError(toMessage(err.response?.data?.detail || err.message));
    }
  };

  // Fetch today's queue (only active appointments, excluding completed)
  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch only active appointments (waiting, screening, in_progress, and internal medicine workflow statuses) - exclude completed
      const response = await api.get(`/admin/appointments?date=${today}&status=waiting,screening,in_progress,waiting_nurse_screening,waiting_lab_processing,waiting_nurse_review,waiting_doctor_review`);

      // Handle both raw array and wrapped { data: [...] } response
      let appointmentsList = [];
      if (Array.isArray(response.data)) {
        appointmentsList = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        appointmentsList = response.data.data;
      } else {
        console.warn('Invalid response data structure:', response.data);
        setPatients([]);
        return;
      }

      // Transform data to include status; normalize all fields to primitives
      const queueData = appointmentsList.map(apt => {
        const tags = Array.isArray(apt.reason_tags)
          ? apt.reason_tags.map(tag => safeText(tag, ''))
          : [];

        const appointmentTime = (() => {
          const raw = apt.appointment_time;
          if (!raw) return '';
          if (typeof raw === 'string') return raw;
          try {
            // Date object or other -> toISOString then HH:mm
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              return `${hh}:${mm}`;
            }
          } catch (e) {
            return safeText(raw, '');
          }
          return safeText(raw, '');
        })();

        // Ensure id is always a primitive (string/number), never an object
        const safeId = (() => {
          const rawId = apt.id;
          if (rawId === null || rawId === undefined) return '0';
          if (typeof rawId === 'string' || typeof rawId === 'number') return String(rawId);
          // If it's an object, try to extract a meaningful ID or fallback
          if (typeof rawId === 'object' && rawId !== null) {
            return rawId.id ? String(rawId.id) : (rawId.toString ? rawId.toString() : '0');
          }
          return String(rawId);
        })();

        // Ensure patientId is always a primitive
        const safePatientId = (() => {
          const rawId = apt.patient_id;
          if (rawId === null || rawId === undefined) return '';
          if (typeof rawId === 'string' || typeof rawId === 'number') return String(rawId);
          if (typeof rawId === 'object' && rawId !== null) {
            return rawId.id ? String(rawId.id) : '0';
          }
          return String(rawId);
        })();

        return {
          id: safeId,
          patientId: safePatientId,
          patientName: safeText(apt.patient_name, 'N/A'),
          patientCode: safeText(apt.patient_code, 'N/A'),
          departmentName: safeText(apt.department_name, 'N/A'),
          reason: safeText(apt.reason_text || apt.reason, 'Khám tổng quát'),
          reasonTags: tags, // Already normalized array of strings
          appointmentTime, // Already normalized string
          status: safeText(apt.status || 'waiting', 'waiting'),
          queueNumber: (() => {
            const qn = apt.queue_number || apt.id;
            if (qn === null || qn === undefined) return 0;
            if (typeof qn === 'number') return qn;
            if (typeof qn === 'string') {
              const parsed = parseInt(qn, 10);
              return isNaN(parsed) ? 0 : parsed;
            }
            // If it's an object, try to extract number
            if (typeof qn === 'object' && qn !== null) {
              const objNum = qn.queue_number || qn.id || qn.number;
              if (typeof objNum === 'number') return objNum;
              if (typeof objNum === 'string') {
                const parsed = parseInt(objNum, 10);
                return isNaN(parsed) ? 0 : parsed;
              }
            }
            return 0;
          })(),
        };
      });

      // Sort by queue number
      queueData.sort((a, b) => a.queueNumber - b.queueNumber);

      setPatients(queueData);
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError(toMessage(err.response?.data?.detail || 'Không thể tải danh sách hàng chờ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchQueue();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Note: Receptionist can only add patients to queue
  // Nurses handle screening and calling patients
  // Doctors handle completing examinations

  // Search patient by CCCD or phone
  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) {
      setError('Vui lòng nhập CCCD hoặc số điện thoại');
      return;
    }

    try {
      setError('');
      const response = await api.get(`/admin/patients/search?q=${searchQuery}`);

      // Ensure response.data is an array and normalize all patient objects
      const rawResults = Array.isArray(response.data) ? response.data : [];
      // Only keep necessary fields - don't spread entire object
      const normalizedResults = rawResults.map(patient => {
        // Ensure id is always a primitive
        const patientId = (() => {
          const rawId = patient?.id;
          if (rawId === null || rawId === undefined) return '';
          if (typeof rawId === 'string' || typeof rawId === 'number') return String(rawId);
          if (typeof rawId === 'object' && rawId !== null) {
            return rawId.id ? String(rawId.id) : '0';
          }
          return String(rawId);
        })();
        return {
          id: patientId,
          full_name: safeText(patient?.full_name, 'N/A'),
          patient_code: safeText(patient?.patient_code, ''),
          phone: safeText(patient?.phone, ''),
          date_of_birth: safeText(patient?.date_of_birth, ''),
          gender: safeText(patient?.gender, ''),
          // Keep original object for API calls but ensure all display fields are safe
          _original: patient,
        };
      });
      setSearchResults(normalizedResults);

      if (normalizedResults.length === 1) {
        setSelectedPatient(normalizedResults[0]);
      }
    } catch (err) {
      console.error('Error searching patient:', err);
      setError(toMessage(err.response?.data?.detail || 'Không tìm thấy bệnh nhân'));
      setSearchResults([]);
    }
  };

  // Add patient to queue
  const handleAddToQueue = async () => {
    try {
      setError('');

      if (!selectedPatient) {
        setError('Vui lòng chọn bệnh nhân');
        return;
      }

      // Validate: Reason text is required for Receptionist
      if (!reasonText.trim()) {
        setError('Vui lòng nhập lý do khám / triệu chứng của bệnh nhân');
        return;
      }

      // Create new appointment
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format

      // Auto-select department (Default to 'Nội khoa' or the first available one)
      // Receptionist doesn't choose, system routes to General/Internal for Screening
      let targetDeptId = selectedDepartment;

      if (!targetDeptId && departments.length > 0) {
        // Try to find "Nội khoa" or "Khám bệnh"
        const defaultDept = departments.find(d =>
          safeText(d?.name, '').toLowerCase().includes('nội') ||
          safeText(d?.name, '').toLowerCase().includes('khám')
        );
        targetDeptId = defaultDept ? defaultDept.id : departments[0].id;
      }

      if (!targetDeptId) {
        setError('Hệ thống chưa có dữ liệu Chuyên khoa. Vui lòng liên hệ Admin.');
        return;
      }

      // Determine status: Always 'waiting_nurse_screening' for this workflow because it goes to Nurse first
      const appointmentStatus = 'waiting_nurse_screening';

      // Prepare request body
      // Ensure patientId is always a primitive
      const patientId = (() => {
        const originalId = selectedPatient?._original?.id;
        const normalizedId = selectedPatient?.id;
        const rawId = originalId || normalizedId;
        if (rawId === null || rawId === undefined) return '';
        if (typeof rawId === 'string' || typeof rawId === 'number') return String(rawId);
        if (typeof rawId === 'object' && rawId !== null) {
          return rawId.id ? String(rawId.id) : '0';
        }
        return String(rawId);
      })();

      const requestBody = {
        patient_id: safeText(patientId, ''),
        department_id: targetDeptId,
        appointment_date: now.toISOString().split('T')[0], // YYYY-MM-DD
        appointment_time: timeString, // HH:MM:SS
        reason_text: reasonText.trim(),
        reason_tags: null, // Receptionist doesn't set tags
        status: appointmentStatus,
      };

      await api.post('/admin/appointments', requestBody);

      const patientName = safeText(selectedPatient?.full_name, 'bệnh nhân');
      setSuccess(toMessage(`Đã thêm bệnh nhân ${patientName} vào hàng chờ Sàng lọc`));
      handleCloseDialog();
      fetchQueue();
    } catch (err) {
      console.error('Error adding to queue:', err);
      setError(toMessage(err.response?.data?.detail || err.message || 'Không thể thêm vào hàng chờ'));
    }
  };

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setSelectedDepartment('');
    setSelectedTags([]);
    setReasonText('');
    setHasOtherSelected(false);
    setError('');
  };

  // Get status chip
  const getStatusChip = (status) => {
    // Normalize any value coming from API before rendering into Chip.label
    // Ensure status is always a string primitive
    const statusStr = safeText(status, 'waiting');
    const normalizedStatus = statusStr;

    switch (statusStr) {
      case 'waiting':
        return <Chip icon={<ScheduleIcon />} label="Chờ sàng lọc" color="warning" size="small" />;
      case 'screening':
        return <Chip label="Đang sàng lọc" color="secondary" size="small" />;
      case 'in_progress':
        return <Chip icon={<LocalHospitalIcon />} label="Đang khám" color="primary" size="small" />;
      // Internal Medicine workflow statuses
      case 'waiting_nurse_screening':
        return <Chip label="Chờ Y tá sàng lọc" color="warning" size="small" />;
      case 'waiting_lab_processing':
        return <Chip label="Chờ KTV xét nghiệm" color="info" size="small" />;
      case 'waiting_nurse_review':
        return <Chip label="Chờ Y tá review" color="secondary" size="small" />;
      case 'waiting_doctor_review':
        return <Chip label="Chờ Bác sĩ khám" color="primary" size="small" />;
      default:
        return <Chip label={normalizedStatus} size="small" />;
    }
  };

  // Get counts (only active appointments are loaded - completed appointments are excluded)
  // Ensure status comparison uses safeText to avoid object comparison issues
  const waitingCount = patients.filter(p => safeText(p?.status, '') === 'waiting' || safeText(p?.status, '') === 'waiting_nurse_screening').length;
  const screeningCount = patients.filter(p => safeText(p?.status, '') === 'screening' || safeText(p?.status, '') === 'waiting_nurse_review').length;
  const inProgressCount = patients.filter(p => safeText(p?.status, '') === 'in_progress' || safeText(p?.status, '') === 'waiting_doctor_review').length;

  try {
    return (
      <LocalErrorBoundary>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Quản lý Hàng chờ Khám bệnh
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchQueue}
                sx={{ mr: 2 }}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenAddDialog(true)}
              >
                Thêm vào hàng chờ
              </Button>
            </Box>
          </Box>

          {/* Statistics - Only show active appointments */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card sx={{ flex: 1, bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h3" color="warning.main">{waitingCount}</Typography>
                <Typography variant="body2" color="text.secondary">Chờ sàng lọc</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: '#e1bee7' }}>
              <CardContent>
                <Typography variant="h3" color="secondary.main">{screeningCount}</Typography>
                <Typography variant="body2" color="text.secondary">Đang sàng lọc</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="h3" color="primary.main">{inProgressCount}</Typography>
                <Typography variant="body2" color="text.secondary">Đang khám</Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Alerts */}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Queue Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã BN</TableCell>
                    <TableCell>Họ và tên</TableCell>
                    <TableCell>Chuyên khoa</TableCell>
                    <TableCell>Lý do khám</TableCell>
                    <TableCell>Giờ hẹn</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Không có bệnh nhân trong hàng chờ
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients && Array.isArray(patients) && patients.map((patient, index) => {
                      if (!patient || typeof patient !== 'object') {
                        return null;
                      }
                      // Ensure key is always a primitive string/number
                      const rowKey = safeText(patient.id, `row-${index}`);
                      return (
                        <TableRow
                          key={rowKey}
                          sx={{
                            bgcolor: safeText(patient?.status, '') === 'in_progress' ? '#e3f2fd' : 'inherit',
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{safeText(patient.patientCode)}</TableCell>
                          <TableCell><strong>{safeText(patient.patientName)}</strong></TableCell>
                          <TableCell>
                            <Chip label={safeText(patient.departmentName)} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {patient.reasonTags && Array.isArray(patient.reasonTags) && patient.reasonTags.length > 0 ? (
                              <Box>
                                {patient.reasonTags.map((tag, idx) => (
                                  <Chip key={idx} label={safeText(tag)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                                {patient.reason && <Typography variant="body2" color="text.secondary">{safeText(patient.reason)}</Typography>}
                              </Box>
                            ) : (
                              safeText(patient.reason)
                            )}
                          </TableCell>
                          <TableCell>
                            {patient.appointmentTime
                              ? (() => {
                                try {
                                  // Handle TIME format (HH:MM:SS or HH:MM)
                                  const timeStr = String(patient.appointmentTime);
                                  if (timeStr.includes(':')) {
                                    const [hours, minutes] = timeStr.split(':');
                                    return `${hours}:${minutes}`;
                                  }
                                  return timeStr;
                                } catch (e) {
                                  return safeText(patient.appointmentTime, 'N/A');
                                }
                              })()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusChip(safeText(patient.status, 'waiting'))}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {(() => {
                                const statusStr = safeText(patient.status, 'waiting');
                                if (statusStr === 'waiting') return 'Chờ y tá sàng lọc';
                                if (statusStr === 'screening') return 'Đang sàng lọc bởi y tá';
                                if (statusStr === 'in_progress') return 'Đang khám bởi bác sĩ';
                                if (statusStr === 'waiting_nurse_screening') return 'Chờ Y tá sàng lọc';
                                if (statusStr === 'waiting_lab_processing') return 'Chờ KTV xét nghiệm';
                                if (statusStr === 'waiting_nurse_review') return 'Chờ Y tá review';
                                if (statusStr === 'waiting_doctor_review') return 'Chờ Bác sĩ khám';
                                return '';
                              })()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Add to Queue Dialog */}
          <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>Thêm bệnh nhân vào hàng chờ</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                {/* Step 1: Search Patient */}
                <Typography variant="subtitle2" gutterBottom>
                  1. Tra cứu bệnh nhân (CCCD hoặc Số điện thoại)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      label="CCCD hoặc Số điện thoại"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchPatient()}
                      placeholder="Nhập CCCD hoặc SĐT"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearchPatient}
                      sx={{ height: '56px' }}
                    >
                      Tìm
                    </Button>
                  </Grid>
                </Grid>

                {/* Search Results */}
                {searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Kết quả tìm kiếm:
                    </Typography>
                    {searchResults && Array.isArray(searchResults) && searchResults.map((patient, idx) => {
                      const cardKey = patient?.id ? safeText(patient.id, `search-${idx}`) : `search-${idx}`;
                      return (
                        <Card
                          key={cardKey}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            border: safeText(selectedPatient?.id, '') === safeText(patient.id, '') ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            bgcolor: safeText(selectedPatient?.id, '') === safeText(patient.id, '') ? '#e3f2fd' : 'white',
                          }}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <CardContent>
                            <Typography variant="body1"><strong>{safeText(patient.full_name)}</strong></Typography>
                            <Typography variant="body2" color="text.secondary">
                              Mã BN: {safeText(patient.patient_code)} | SĐT: {safeText(patient.phone, 'N/A')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Ngày sinh: {safeText(patient.date_of_birth)} | Giới tính: {safeText(patient.gender)}
                            </Typography>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}

                {/* Step 2: Note (Reason) - Replaces Department and Tags selection */}
                {selectedPatient && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      2. Ghi chú bệnh lý / Triệu chứng
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Ghi chú triệu chứng"
                      placeholder="Ví dụ: Đau bụng, Sốt cao, Khám tổng quát..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      helperText="Nhập mô tả ngắn gọn về tình trạng bệnh nhân. Y tá sẽ phân loại chuyên khoa sau."
                      inputProps={{
                        style: { fontFamily: 'Noto Sans, Inter, Roboto, sans-serif' }
                      }}
                    />
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button
                onClick={handleAddToQueue}
                variant="contained"
                disabled={!selectedPatient || !reasonText.trim()}
              >
                Thêm vào hàng chờ
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </LocalErrorBoundary>
    );
  } catch (renderErr) {
    // eslint-disable-next-line no-console
    console.error('QueueManagement render failed:', renderErr);
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Lỗi khi hiển thị trang Hàng chờ.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          {safeText(renderErr?.message, 'Rendering error')}
        </Typography>
      </Box>
    );
  }
}

export default QueueManagement;
