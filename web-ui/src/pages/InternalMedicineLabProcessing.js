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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import api from '../services/api';

function InternalMedicineLabProcessing() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lab dialog state
  const [openLabDialog, setOpenLabDialog] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state - Sample Information
  const [sampleCollectionDate, setSampleCollectionDate] = useState('');
  const [sampleCollectionTime, setSampleCollectionTime] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [sampleId, setSampleId] = useState('');
  const [sampleQuality, setSampleQuality] = useState('');

  // Form state - Kết quả xét nghiệm
  const [labResults, setLabResults] = useState([]);
  const [imagingResults, setImagingResults] = useState([]);
  const [labNotes, setLabNotes] = useState('');

  // Fetch queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/queues/internal-med/lab');
      setPatients(response.data?.appointments || []);
    } catch (err) {
      console.error('Error fetching lab queue:', err);
      setError('Không thể tải danh sách bệnh nhân');
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

  // Open lab dialog
  const handleOpenLab = async (appointment) => {
    try {
      setError('');
      setSuccess('');
      setCurrentAppointment(appointment);

      // Fetch detailed information
      const response = await api.get(`/admin/queues/internal-med/${appointment.id}/lab`);
      const data = response.data;

      setCurrentPatient(data.patient);
      setCurrentRecord(data.record || {});

      // Load existing data if record exists
      if (data.record) {
        setSampleCollectionDate(data.record.sample_collection_date || '');
        setSampleCollectionTime(data.record.sample_collection_time || '');
        setSampleType(data.record.sample_type || '');
        setSampleId(data.record.sample_id || '');
        setSampleQuality(data.record.sample_quality || '');
        setLabResults(data.record.lab_results || []);
        setImagingResults(data.record.imaging_results || []);
        setLabNotes(data.record.lab_notes || '');
      } else {
        // Set default values for new record
        const now = new Date();
        setSampleCollectionDate(now.toISOString().split('T')[0]);
        setSampleCollectionTime(now.toTimeString().slice(0, 5));
      }

      setOpenLabDialog(true);
    } catch (err) {
      console.error('Error fetching lab details:', err);
      setError('Không thể tải thông tin bệnh nhân');
    }
  };

  // Close lab dialog
  const handleCloseLabDialog = () => {
    setOpenLabDialog(false);
    setCurrentAppointment(null);
    setCurrentPatient(null);
    setCurrentRecord(null);
    // Reset form
    setSampleCollectionDate('');
    setSampleCollectionTime('');
    setSampleType('');
    setSampleId('');
    setSampleQuality('');
    setLabResults([]);
    setImagingResults([]);
    setLabNotes('');
  };

  // Add lab result
  const handleAddLabResult = () => {
    setLabResults([...labResults, { test_name: '', result: '', unit: '', reference_range: '', status: 'normal' }]);
  };

  // Remove lab result
  const handleRemoveLabResult = (index) => {
    setLabResults(labResults.filter((_, i) => i !== index));
  };

  // Update lab result
  const handleUpdateLabResult = (index, field, value) => {
    const updated = [...labResults];
    updated[index] = { ...updated[index], [field]: value };
    setLabResults(updated);
  };

  // Add imaging result
  const handleAddImagingResult = () => {
    setImagingResults([...imagingResults, { test_type: '', result: '', findings: '', impression: '' }]);
  };

  // Remove imaging result
  const handleRemoveImagingResult = (index) => {
    setImagingResults(imagingResults.filter((_, i) => i !== index));
  };

  // Update imaging result
  const handleUpdateImagingResult = (index, field, value) => {
    const updated = [...imagingResults];
    updated[index] = { ...updated[index], [field]: value };
    setImagingResults(updated);
  };

  // Save lab data
  const handleSaveLab = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const labData = {
        // Sample Information
        sample_collection_date: sampleCollectionDate,
        sample_collection_time: sampleCollectionTime,
        sample_type: sampleType,
        sample_id: sampleId,
        sample_quality: sampleQuality,

        // Kết quả xét nghiệm
        lab_results: labResults.filter(r => r.test_name && r.result),
        imaging_results: imagingResults.filter(r => r.test_type && r.result),
        lab_notes: labNotes,
      };

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/lab`, labData);

      setSuccess('Kết quả xét nghiệm đã được lưu');
      handleCloseLabDialog();
      fetchQueue();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving lab data:', err);
      setError(err.response?.data?.detail || 'Không thể lưu kết quả xét nghiệm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Xử Lý Xét Nghiệm - Nội Khoa
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchQueue}
          disabled={loading}
        >
          Làm Mới
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
            Danh Sách Bệnh Nhân Chờ Xét Nghiệm
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
                          Không có bệnh nhân chờ xét nghiệm
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
                          <Chip label="Chờ Xét Nghiệm" color="info" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenLab(patient)}
                          >
                            Xử Lý Xét Nghiệm
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

      {/* Lab Dialog */}
      <Dialog
        open={openLabDialog}
        onClose={handleCloseLabDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScienceIcon />
            <Typography variant="h6">
              Xử Lý Xét Nghiệm
            </Typography>
          </Box>
          {currentPatient && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Bệnh nhân: <strong>{currentPatient.full_name}</strong> - Mã BN: {currentPatient.patient_code}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {currentPatient && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Thông Tin Bệnh Nhân</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Họ Tên:</strong> {currentPatient.full_name}</Typography>
                    <Typography variant="body2"><strong>Mã BN:</strong> {currentPatient.patient_code}</Typography>
                    <Typography variant="body2"><strong>Ngày Sinh:</strong> {currentPatient.date_of_birth || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Giới Tính:</strong> {currentPatient.gender || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Sample Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            Thông Tin Mẫu
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Ngày Lấy Mẫu"
                  value={sampleCollectionDate ? dayjs(sampleCollectionDate) : null}
                  onChange={(newValue) => setSampleCollectionDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Giờ Lấy Mẫu"
                  value={sampleCollectionTime ? dayjs(sampleCollectionTime, 'HH:mm') : null}
                  onChange={(newValue) => setSampleCollectionTime(newValue ? newValue.format('HH:mm') : '')}
                  ampm={false}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Loại Mẫu"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                placeholder="VD: Máu, Nước tiểu, Phân..."
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Mã Mẫu"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chất Lượng Mẫu"
                value={sampleQuality}
                onChange={(e) => setSampleQuality(e.target.value)}
                placeholder="VD: Tốt, Chấp nhận được, Không đạt..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Lab Results */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Kết Quả Xét Nghiệm
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddLabResult}
            >
              Thêm Xét Nghiệm
            </Button>
          </Box>

          {labResults.map((result, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Xét Nghiệm #{index + 1}</Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveLabResult(index)}
                  >
                    Xóa
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tên Xét Nghiệm"
                      value={result.test_name}
                      onChange={(e) => handleUpdateLabResult(index, 'test_name', e.target.value)}
                      placeholder="VD: Công thức máu, Sinh hóa máu..."
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Kết Quả"
                      value={result.result}
                      onChange={(e) => handleUpdateLabResult(index, 'result', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Đơn Vị"
                      value={result.unit}
                      onChange={(e) => handleUpdateLabResult(index, 'unit', e.target.value)}
                      placeholder="VD: g/L, mmol/L..."
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Giá Trị Tham Chiếu"
                      value={result.reference_range}
                      onChange={(e) => handleUpdateLabResult(index, 'reference_range', e.target.value)}
                      placeholder="VD: 4.0-5.5"
                    />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <TextField
                      fullWidth
                      label="Trạng Thái"
                      value={result.status}
                      onChange={(e) => handleUpdateLabResult(index, 'status', e.target.value)}
                      placeholder="VD: Bình thường, Cao, Thấp..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Imaging Results */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Kết Quả Chẩn Đoán Hình Ảnh
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddImagingResult}
            >
              Thêm Chẩn Đoán Hình Ảnh
            </Button>
          </Box>

          {imagingResults.map((result, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Chẩn Đoán Hình Ảnh #{index + 1}</Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveImagingResult(index)}
                  >
                    Xóa
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Loại Xét Nghiệm"
                      value={result.test_type}
                      onChange={(e) => handleUpdateImagingResult(index, 'test_type', e.target.value)}
                      placeholder="VD: X-quang, Siêu âm, CT, MRI..."
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Kết Quả"
                      value={result.result}
                      onChange={(e) => handleUpdateImagingResult(index, 'result', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phát Hiện"
                      value={result.findings}
                      onChange={(e) => handleUpdateImagingResult(index, 'findings', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nhận Định"
                      value={result.impression}
                      onChange={(e) => handleUpdateImagingResult(index, 'impression', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Notes */}
          <TextField
            fullWidth
            label="Ghi Chú Kỹ Thuật Viên"
            multiline
            rows={4}
            value={labNotes}
            onChange={(e) => setLabNotes(e.target.value)}
            placeholder="Nhập ghi chú về quá trình xét nghiệm..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLabDialog}>
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveLab}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu & Chuyển Bác Sĩ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default InternalMedicineLabProcessing;

