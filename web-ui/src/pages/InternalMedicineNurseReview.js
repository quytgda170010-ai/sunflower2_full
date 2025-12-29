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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import HealthCheckForm from '../components/HealthCheckForm';

function InternalMedicineDoctorFirstReview() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Review dialog state
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve'); // approve, return_to_screening, return_to_lab
  const [tabValue, setTabValue] = useState(0);

  // Health Check State
  const [isHealthCheck, setIsHealthCheck] = useState(false);
  const [healthCheckForm, setHealthCheckForm] = useState(null);
  const [healthCheckData, setHealthCheckData] = useState({});

  // Review checklist
  const [reviewChecklist, setReviewChecklist] = useState({
    screening_complete: false,
    lab_results_complete: false,
    vital_signs_complete: false,
    medical_history_complete: false,
    allergies_documented: false,
    medications_documented: false,
    social_history_complete: false,
    all_info_verified: false,
  });
  const [reviewNotes, setReviewNotes] = useState('');

  // Clinical Exam state
  const [physicalExam, setPhysicalExam] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10Code, setIcd10Code] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');

  const screeningData = currentRecord?.screening || currentRecord || {};
  const labData = currentRecord?.lab || {};
  const displayValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.trim() === '') return 'N/A';
    return value;
  };
  const getScreeningRawValue = (field) => {
    if (!screeningData) return undefined;
    if (Object.prototype.hasOwnProperty.call(screeningData, field)) {
      return screeningData[field];
    }
    if (screeningData?.vital_signs && Object.prototype.hasOwnProperty.call(screeningData.vital_signs, field)) {
      return screeningData.vital_signs[field];
    }
    return undefined;
  };
  const getScreeningValue = (field) => displayValue(getScreeningRawValue(field));
  const getLabRawValue = (field) => {
    if (labData && Object.prototype.hasOwnProperty.call(labData, field)) {
      return labData[field];
    }
    if (currentRecord && Object.prototype.hasOwnProperty.call(currentRecord, field)) {
      return currentRecord[field];
    }
    return undefined;
  };
  const getLabValue = (field) => displayValue(getLabRawValue(field));
  const formatWithUnit = (value, unit) => {
    const display = displayValue(value);
    return display === 'N/A' ? display : `${display} ${unit}`.trim();
  };
  const bloodPressureDisplay = (() => {
    const systolic = displayValue(getScreeningRawValue('blood_pressure_systolic'));
    const diastolic = displayValue(getScreeningRawValue('blood_pressure_diastolic'));
    if (systolic === 'N/A' || diastolic === 'N/A') {
      return 'N/A';
    }
    return `${systolic}/${diastolic} mmHg`;
  })();
  const labResults = Array.isArray(getLabRawValue('lab_results')) ? getLabRawValue('lab_results') : [];
  const imagingResults = Array.isArray(getLabRawValue('imaging_results')) ? getLabRawValue('imaging_results') : [];
  const labNotes = getLabRawValue('lab_notes');

  // Fetch queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/queues/internal-med/doctor');
      setPatients(response.data?.appointments || []);
    } catch (err) {
      console.error('Error fetching review queue:', err);
      setError('Unable to load patient list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Open review dialog
  const handleOpenReview = async (appointment) => {
    try {
      setError('');
      setSuccess('');
      setCurrentAppointment(appointment);

      // Reset State
      setIsHealthCheck(false);
      setHealthCheckForm(null);
      setHealthCheckData({});
      setReviewChecklist({
        screening_complete: false,
        lab_results_complete: false,
        vital_signs_complete: false,
        medical_history_complete: false,
        allergies_documented: false,
        medications_documented: false,
        social_history_complete: false,
        all_info_verified: false,
      });
      setReviewNotes('');
      setPhysicalExam('');
      setDiagnosis('');
      setIcd10Code('');
      setTreatmentPlan('');


      // Check for Health Check Form
      try {
        const hcResponse = await api.get(`/api/health-check/appointment/${appointment.id}`);
        if (hcResponse.data) {
          setIsHealthCheck(true);
          setHealthCheckForm(hcResponse.data);
          setHealthCheckData(hcResponse.data.content);
        }
      } catch (e) {
        // No health check form, proceed with standard flow
        // console.log("No health check form found, using standard flow");
      }


      // Fetch detailed information
      const response = await api.get(`/admin/queues/internal-med/${appointment.id}/doctor`);
      const data = response.data;

      setCurrentPatient(data.patient);
      setCurrentRecord(data.record || {});

      // Load existing review data if exists
      if (data.record) {
        if (data.record.review_checklist) {
          setReviewChecklist(data.record.review_checklist);
        }
        setReviewNotes(data.record.review_notes || '');
        setPhysicalExam(data.record.physical_exam || '');
        setDiagnosis(data.record.diagnosis || '');
        setIcd10Code(data.record.icd10_code || '');
        setTreatmentPlan(data.record.treatment_plan || '');
      }

      setOpenReviewDialog(true);
      setTabValue(0);
      setReviewAction('approve');
    } catch (err) {
      console.error('Error fetching review details:', err);
      setError('Unable to load patient information');
    }
  };

  // Close review dialog
  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setCurrentAppointment(null);
    setCurrentPatient(null);
    setCurrentRecord(null);
    setReviewAction('approve');
    setTabValue(0);
    setIsHealthCheck(false);
    setHealthCheckData({});
  };

  const handleHealthCheckChange = (newData) => {
    setHealthCheckData(newData);
  };

  const handleSaveHealthCheck = async () => {
    try {
      setSaving(true);
      // 1. Update Health Check Form Record
      await api.put(`/api/health-check/${healthCheckForm.id}`, healthCheckData);

      // 2. We might want to close the appointment or update status in the main flow too
      // Calling the doctor review endpoint with a "completed" status effectively
      // Use 'prescribe_directly' action to close it for now as "Completed"
      const reviewData = {
        review_action: 'prescribe_directly', // Treat as finished
        review_notes: 'Health Check Completed',
        physical_exam: 'See Health Check Form',
        diagnosis: 'Health Check',
        icd10_code: 'Z00.0', // General exam
        treatment_plan: 'See Health Check Form',
      };
      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, reviewData);

      setSuccess("Đã lưu và hoàn tất Giấy Khám Sức Khỏe");
      handleCloseReviewDialog();
      fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error saving health check:", err);
      setError("Lỗi khi lưu Giấy Khám Sức Khỏe");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Save review
  const handleSaveReview = async (actionOverride = null) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const finalAction = actionOverride || reviewAction;

      const reviewData = {
        review_action: finalAction,
        review_checklist: reviewChecklist,
        review_notes: reviewNotes,
        physical_exam: physicalExam,
        diagnosis: diagnosis,
        icd10_code: icd10Code,
        treatment_plan: treatmentPlan,
        // Add forward_to_lab flag for backend to update status correctly
        forward_to_lab: finalAction === 'order_lab',
      };

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, reviewData);

      let message = '';
      if (finalAction === 'order_lab') {
        message = 'Lab tests ordered and forwarded to Lab Technician';
      } else if (finalAction === 'prescribe_directly') {
        message = 'Prescription completed - appointment closed';
      } else if (finalAction === 'return_to_screening') {
        message = 'Returned to screening';
      } else if (finalAction === 'approve') {
        message = 'Lab tests ordered and forwarded to Lab Technician';
      }

      setSuccess(message);
      handleCloseReviewDialog();
      fetchQueue();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving review:', err);
      setError(err.response?.data?.detail || 'Unable to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/internal-medicine-nurse-screening')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Quay lại
          </Button>
          <Typography variant="h4" component="h1">
            Phòng Chờ Khám - Bác Sĩ
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchQueue}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Queue Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh Sách Bệnh Nhân Chờ Khám
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Họ Tên</TableCell>
                    <TableCell>Lý Do Khám</TableCell>
                    <TableCell>Giờ Hẹn</TableCell>
                    <TableCell>Trạng Thái</TableCell>
                    <TableCell align="center">Hành Động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Không có bệnh nhân chờ khám
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient, index) => (
                      <TableRow key={patient.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell><strong>{patient.patient_name}</strong></TableCell>
                        <TableCell>{patient.reason_text || 'N/A'}</TableCell>
                        <TableCell>
                          {patient.appointment_time
                            ? (() => {
                              try {
                                // Handle TIME format (HH:MM:SS or HH:MM)
                                const timeStr = String(patient.appointment_time);
                                if (timeStr.includes(':')) {
                                  const [hours, minutes] = timeStr.split(':');
                                  return `${hours}:${minutes}`;
                                }
                                return timeStr;
                              } catch (e) {
                                return patient.appointment_time || 'N/A';
                              }
                            })()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip label="Chờ Bác sĩ Khám" color="secondary" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenReview(patient)}
                          >
                            Khám
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={openReviewDialog}
        onClose={handleCloseReviewDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {isHealthCheck ? 'Phiếu Khám Sức Khỏe' : 'Xem Xét Hồ Sơ'}
            </Typography>
            {isHealthCheck && (
              <Button startIcon={<PrintIcon />} variant="outlined" size="small" onClick={handlePrint}>
                In Giấy Khám
              </Button>
            )}
          </Box>
          {currentPatient && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Bệnh nhân: <strong>{currentPatient.full_name}</strong> - Mã BN: {currentPatient.patient_code}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {isHealthCheck ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Bác sĩ vui lòng hoàn thiện phần Khám Lâm Sàng và Kết Luận.
              </Alert>
              <HealthCheckForm
                mode="doctor"
                initialData={healthCheckData}
                onChange={handleHealthCheckChange}
              />
            </Box>
          ) : (
            currentRecord && (
              <Box>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                  <Tab label="Khám Bệnh" />
                  <Tab label="Sàng Lọc" />
                  <Tab label="Xét Nghiệm" />
                  <Tab label="Kiểm Tra & Xử Lý" />
                </Tabs>

                {/* Tab 0: Clinical Exam */}
                {tabValue === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">I. Khám Lâm Sàng</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Nội dung khám lâm sàng (Cơ năng, Thực thể)"
                      placeholder="VD: Bệnh nhân tỉnh, tiếp xúc tốt. Tim đều. Phổi trong..."
                      value={physicalExam}
                      onChange={(e) => setPhysicalExam(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }} color="primary">II. Chẩn Đoán</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="Chẩn đoán sơ bộ"
                          placeholder="VD: Viêm phế quản cấp"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          variant="outlined"
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Mã ICD-10"
                          placeholder="VD: J20"
                          value={icd10Code}
                          onChange={(e) => setIcd10Code(e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }} color="primary">III. Hướng Xử Trí</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Kế hoạch điều trị / Ghi chú"
                      placeholder="VD: Chỉ định xét nghiệm máu, chụp X-quang..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                  </Box>
                )}

                {/* Tab 1: Screening Information */}
                {tabValue === 1 && (
                  <Box>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">I. Thông Tin Sàng Lọc</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={4}>
                            <Typography variant="body2"><strong>Điều dưỡng sàng lọc:</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('screened_by')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={4}>
                            <Typography variant="body2"><strong>Thời gian sàng lọc:</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('screened_at')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={4}>
                            <Typography variant="body2"><strong>Ghi chú điều dưỡng:</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('nurse_notes')}</Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">II. Lý Do Khám</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2"><strong>Lý do đến khám:</strong></Typography>
                        <Typography variant="body2">{getScreeningValue('reason_text')}</Typography>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">III. Tiền Sử Bệnh</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="body2"><strong>Tiền sử bệnh (Bản thân/Gia đình):</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('medical_history')}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2"><strong>Dị ứng:</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('allergies')}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2"><strong>Thuốc đang sử dụng:</strong></Typography>
                            <Typography variant="body2">{getScreeningValue('current_medications')}</Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">IV. Khám Thể Lực - Sinh Hiệu</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2"><strong>Mạch:</strong> {formatWithUnit(getScreeningValue('pulse'), 'lần/phút')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2"><strong>Nhiệt độ:</strong> {formatWithUnit(getScreeningValue('temperature'), '°C')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2"><strong>Huyết áp:</strong> {bloodPressureDisplay}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2"><strong>Nhịp thở:</strong> {formatWithUnit(getScreeningValue('respiratory_rate'), 'lần/phút')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            {(() => {
                              const value = getScreeningValue('weight');
                              return <Typography variant="body2"><strong>Cân nặng:</strong> {value === 'N/A' ? value : `${value} kg`}</Typography>;
                            })()}
                          </Grid>
                          <Grid item xs={6} md={3}>
                            {(() => {
                              const value = getScreeningValue('height');
                              return <Typography variant="body2"><strong>Chiều cao:</strong> {value === 'N/A' ? value : `${value} cm`}</Typography>;
                            })()}
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2"><strong>SpO2:</strong> {formatWithUnit(getScreeningValue('oxygen_saturation'), '%')}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            {(() => {
                              const value = getScreeningValue('pain_scale');
                              return <Typography variant="body2"><strong>Mức độ đau:</strong> {value === 'N/A' ? value : `${value}/10`}</Typography>;
                            })()}
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}

                {/* Tab 2: Lab Test Results */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Thông Tin Mẫu Xét Nghiệm</Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2"><strong>Ngày lấy mẫu:</strong> {getLabValue('sample_collection_date')}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2"><strong>Giờ lấy mẫu:</strong> {getLabValue('sample_collection_time')}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2"><strong>Loại mẫu:</strong> {getLabValue('sample_type')}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2"><strong>Mã mẫu:</strong> {getLabValue('sample_id')}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>Kết Quả Xét Nghiệm</Typography>
                    {labResults.length > 0 ? (
                      labResults.map((result, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1"><strong>{result.test_name}</strong></Typography>
                            <Typography variant="body2">Kết quả: {result.result} {result.unit}</Typography>
                            <Typography variant="body2">Khoảng tham chiếu: {result.reference_range}</Typography>
                            <Typography variant="body2">Trạng thái: {result.status}</Typography>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Chưa có kết quả xét nghiệm</Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>Kết Quả Chẩn Đoán Hình Ảnh</Typography>
                    {imagingResults.length > 0 ? (
                      imagingResults.map((result, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1"><strong>{result.test_type}</strong></Typography>
                            <Typography variant="body2"><strong>Kết quả:</strong> {result.result}</Typography>
                            <Typography variant="body2"><strong>Mô tả:</strong> {result.findings}</Typography>
                            <Typography variant="body2"><strong>Kết luận:</strong> {result.impression}</Typography>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Chưa có kết quả CĐHA</Typography>
                    )}

                    {labNotes && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Ghi Chú Của Kỹ Thuật Viên</Typography>
                        <Typography variant="body2">{labNotes}</Typography>
                      </>
                    )}
                  </Box>
                )}

                {/* Tab 3: Checklist review */}
                {tabValue === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Danh Sách Kiểm Tra
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.screening_complete || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              screening_complete: e.target.checked
                            })}
                          />
                        }
                        label="Hoàn tất sàng lọc"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.lab_results_complete || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              lab_results_complete: e.target.checked
                            })}
                          />
                        }
                        label="Có đầy đủ kết quả xét nghiệm"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.vital_signs_complete || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              vital_signs_complete: e.target.checked
                            })}
                          />
                        }
                        label="Đã đo đầy đủ sinh hiệu"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.medical_history_complete || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              medical_history_complete: e.target.checked
                            })}
                          />
                        }
                        label="Đã ghi nhận đầy đủ tiền sử bệnh"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.allergies_documented || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              allergies_documented: e.target.checked
                            })}
                          />
                        }
                        label="Đã ghi nhận dị ứng"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.medications_documented || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              medications_documented: e.target.checked
                            })}
                          />
                        }
                        label="Đã ghi nhận thuốc đang sử dụng"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.social_history_complete || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              social_history_complete: e.target.checked
                            })}
                          />
                        }
                        label="Đã ghi nhận tiền sử xã hội"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewChecklist.all_info_verified || false}
                            onChange={(e) => setReviewChecklist({
                              ...reviewChecklist,
                              all_info_verified: e.target.checked
                            })}
                          />
                        }
                        label="Đã xác minh tất cả thông tin"
                      />
                    </FormGroup>

                    <Divider sx={{ my: 3 }} />

                    <TextField
                      fullWidth
                      label="Ghi chú của Bác sĩ"
                      multiline
                      rows={4}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Nhập ghi chú..."
                    />
                  </Box>
                )}
              </Box>
            )
          )}
        </DialogContent>
        {isHealthCheck ? (
          <DialogActions>
            <Button onClick={handleCloseReviewDialog}>Hủy</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveHealthCheck}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Hoàn tất & Kết luận'}
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Button onClick={handleCloseReviewDialog}>
              Hủy
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setReviewAction('return_to_screening');
                handleSaveReview('return_to_screening');
              }}
              color="warning"
              disabled={saving}
            >
              Trả về Sàng lọc
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                setReviewAction('prescribe_directly');
                handleSaveReview('prescribe_directly');
              }}
              disabled={saving}
              color="success"
              sx={{ ml: 'auto' }}
            >
              {saving ? 'Đang xử lý...' : 'Kê Đơn (Không Xét Nghiệm)'}
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                setReviewAction('order_lab');
                handleSaveReview('order_lab');
              }}
              disabled={saving}
              color="primary"
            >
              {saving ? 'Đang xử lý...' : 'Chỉ Định Xét Nghiệm'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
}

export default InternalMedicineDoctorFirstReview;
