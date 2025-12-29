import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  TextField,
  Box,
  Typography,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TablePagination,
  Grid,
  Divider,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useKeycloak } from '../context/KeycloakContext';
import { useNavigate } from 'react-router-dom';

// Tab Panel Component
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function MedicalRecords() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const username = keycloak?.tokenParsed?.preferred_username || '';

  const getAllRolesFromToken = () => {
    if (!keycloak?.tokenParsed) return [];

    const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
    const directRoles = keycloak.tokenParsed.roles || [];
    const resourceRoles = Object.values(keycloak.tokenParsed.resource_access || {}).flatMap(
      (client) => client.roles || []
    );

    return [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];
  };

  const inferRoleFromUsername = () => {
    const usernameLower = (keycloak?.tokenParsed?.preferred_username || keycloak?.tokenParsed?.name || '').toLowerCase();
    if (!usernameLower) return null;

    if (usernameLower.includes('letan') || usernameLower.includes('reception') || usernameLower.includes('tieptan')) {
      return 'receptionist';
    }
    if (usernameLower.includes('truongletan') || usernameLower.includes('head_reception') || usernameLower.includes('truongtieptan')) {
      return 'head_reception';
    }
    if (usernameLower.includes('bacsi') || usernameLower.includes('doctor') || usernameLower.includes('bs')) {
      return 'doctor';
    }
    if (usernameLower.includes('dieuduong') || usernameLower.includes('nurse') || usernameLower.includes('yd') || usernameLower.includes('dd')) {
      return 'nurse';
    }
    if (usernameLower.includes('truongdieuduong') || usernameLower.includes('head_nurse') || usernameLower.includes('truongyd')) {
      return 'head_nurse';
    }
    if (usernameLower.includes('duocsi') || usernameLower.includes('pharmacist') || usernameLower.includes('ds')) {
      return 'pharmacist';
    }
    if (usernameLower.includes('ktv') || usernameLower.includes('lab') || usernameLower.includes('xetnghiem') || usernameLower.includes('technician')) {
      return 'lab_technician';
    }
    if (usernameLower.includes('ketoan') || usernameLower.includes('accountant') || usernameLower.includes('thungan')) {
      return 'accountant';
    }
    if (usernameLower.includes('giamdoc') || usernameLower.includes('admin_hospital') || usernameLower.includes('hospital_admin')) {
      return 'admin_hospital';
    }
    if (usernameLower.includes('admin') || usernameLower.includes('quanly') || usernameLower.includes('quantri')) {
      return 'admin';
    }
    if (usernameLower.includes('benhnhan') || usernameLower.includes('patient') || usernameLower.includes('bn')) {
      return 'patient';
    }

    return null;
  };

  const userRoles = getAllRolesFromToken();
  const inferredRole = inferRoleFromUsername();
  const isDoctor = userRoles.includes('doctor') || inferredRole === 'doctor';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState(30); // Default: last 30 days

  useEffect(() => {
    fetchAppointments();
  }, [page, rowsPerPage, daysFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      params.append('status', 'completed');

      if (isDoctor && username) {
        params.append('doctor_id', username);
      }

      if (daysFilter) {
        params.append('days', daysFilter.toString());
      } else if (dateFilter) {
        params.append('date', dateFilter);
      }

      const res = await api.get(`/admin/appointments?${params.toString()}`);

      // Handle response format: {data: [...], pagination: {...}} or direct array
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      }

      // Calculate pagination
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setAppointments(paginatedData);
      setTotalRecords(res.data?.pagination?.total || data.length);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = async (appointment) => {
    try {
      setLoadingRecord(true);
      setSelectedAppointment(appointment);
      setOpenRecordDialog(true);

      // Check if this is Internal Medicine department
      if (appointment.department_name === 'Internal Medicine') {
        // Fetch Internal Medicine record
        try {
          const recordRes = await api.get(`/admin/queues/internal-med/${appointment.id}/doctor`);
          setSelectedRecord(recordRes.data);

          // Also fetch individual medical records để hiển thị format đẹp
          try {
            const recordsRes = await api.get(`/admin/medical-records?patient_id=${appointment.patient_id}`);
            setSelectedRecord(prev => ({
              ...prev,
              individualRecords: recordsRes.data.records || []
            }));
          } catch (err) {
            console.warn('Failed to fetch individual medical records:', err);
          }
        } catch (err) {
          console.error('Failed to fetch Internal Medicine record:', err);
          setSelectedRecord(null);
        }
      } else {
        // For other departments, fetch regular medical records
        try {
          const recordsRes = await api.get(`/admin/medical-records?patient_id=${appointment.patient_id}`);
          setSelectedRecord(recordsRes.data.records || []);
        } catch (err) {
          console.error('Failed to fetch medical records:', err);
          setSelectedRecord(null);
        }
      }
    } catch (error) {
      console.error('Failed to load record:', error);
      setSelectedRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleCreatePrescription = (appointment) => {
    if (!appointment?.patient_id) return;
    const params = new URLSearchParams({
      patient_id: appointment.patient_id,
      patient_code: appointment.patient_code || '',
      patient_name: appointment.patient_name || '',
      department_name: appointment.department_name || '',
    });
    navigate(`/prescriptions?${params.toString()}`);
  };

  const handleCloseRecordDialog = () => {
    setOpenRecordDialog(false);
    setSelectedAppointment(null);
    setSelectedRecord(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A' || dateString === 'null' || dateString === 'undefined') return 'N/A';
    try {
      // Handle both date string and Date object
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString || 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      // Handle both HH:MM:SS and HH:MM formats
      const parts = timeString.split(':');
      return `${parts[0]}:${parts[1]}`;
    } catch {
      return timeString;
    }
  };

  // Format key đẹp: snake_case → Title Case
  const formatKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Detect record type từ title và content
  const detectRecordType = (record) => {
    const title = (record.title || '').toLowerCase();
    const content = typeof record.content === 'string'
      ? (() => {
        try {
          return JSON.parse(record.content);
        } catch {
          return {};
        }
      })()
      : record.content;

    if (title.includes('doctor review') || content.reviewed_by?.startsWith('bs.')) {
      return 'doctor_review';
    } else if (title.includes('review') && content.review_checklist) {
      return 'review';
    } else if (title.includes('screening') || content.admission_date) {
      return 'screening';
    } else if (title.includes('lab') || content.sample_collection_date) {
      return 'lab';
    }
    return 'other';
  };

  // Format Review Record (Y tá review)
  const formatReviewRecord = (content) => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Danh sách Kiểm tra
        </Typography>
        {content.review_checklist && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {Object.entries(content.review_checklist).map(([key, value]) => {
              const keyMap = {
                'screening_complete': 'Sàng lọc Hoàn thành',
                'lab_results_complete': 'Kết quả Xét nghiệm Hoàn thành',
                'vital_signs_complete': 'Dấu hiệu Sinh tồn Hoàn thành',
                'medical_history_complete': 'Tiền sử Bệnh Hoàn thành',
                'allergies_documented': 'Dị ứng Đã ghi nhận',
                'medications_documented': 'Thuốc Đã ghi nhận',
                'social_history_complete': 'Tiền sử Xã hội Hoàn thành',
                'all_info_verified': 'Tất cả Thông tin Đã xác minh'
              };
              const displayKey = keyMap[key] || formatKey(key);
              return (
                <Grid item xs={12} sm={6} key={key}>
                  <Typography variant="body2">
                    <strong>{displayKey}:</strong> {value ? 'Có' : 'Không'}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
        )}
        {content.review_notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Ghi chú Kiểm tra</Typography>
            <Typography variant="body2">{content.review_notes}</Typography>
          </Box>
        )}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          {content.reviewed_by && (
            <Typography variant="body2" color="text.secondary">
              <strong>Người kiểm tra:</strong> {content.reviewed_by}
            </Typography>
          )}
          {content.reviewed_at && (
            <Typography variant="body2" color="text.secondary">
              <strong>Thời gian kiểm tra:</strong> {formatDateTime(content.reviewed_at)}
            </Typography>
          )}
          {content.review_action && (
            <Typography variant="body2" color="text.secondary">
              <strong>Hành động:</strong> {content.review_action === 'approve' ? 'Phê duyệt' : content.review_action}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Format Doctor Review Record
  const formatDoctorReviewRecord = (content) => {
    // Physical examination fields
    const physicalExamFields = [
      { key: 'cardiovascular_exam', label: 'Tim mạch' },
      { key: 'respiratory_exam', label: 'Hô hấp' },
      { key: 'digestive_exam', label: 'Tiêu hóa' },
      { key: 'genitourinary_exam', label: 'Sinh dục - Tiết niệu' },
      { key: 'neurological_exam', label: 'Thần kinh' },
      { key: 'musculoskeletal_exam', label: 'Cơ xương khớp' },
      { key: 'ent_exam', label: 'Tai mũi họng' },
      { key: 'dental_exam', label: 'Răng hàm mặt' },
      { key: 'eye_exam', label: 'Mắt' },
      { key: 'endocrine_exam', label: 'Nội tiết' }
    ];

    const hasPhysicalExam = physicalExamFields.some(field =>
      content[field.key] && content[field.key] !== 's' && content[field.key] !== 'ss' && content[field.key] !== ''
    );

    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Đánh giá của Bác sĩ
        </Typography>

        {/* Physical Examination */}
        {hasPhysicalExam && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Khám Lâm sàng
            </Typography>
            <Grid container spacing={2}>
              {physicalExamFields.map((field) => {
                const value = content[field.key];
                if (!value || value === 's' || value === 'ss' || value === '') return null;
                return (
                  <Grid item xs={12} sm={6} key={field.key}>
                    <Typography variant="body2">
                      <strong>{field.label}:</strong> {value}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Case Summary */}
        {content.case_summary && content.case_summary !== 's' && content.case_summary !== 'ss' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Tóm tắt Ca bệnh
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {content.case_summary}
            </Typography>
          </Box>
        )}

        {/* Diagnosis */}
        {(content.diagnosis_on_admission_primary || content.discharge_diagnosis_primary) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Chẩn đoán
            </Typography>
            {content.diagnosis_on_admission_primary && content.diagnosis_on_admission_primary !== 's' && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Khi nhập viện - Chính:</strong> {content.diagnosis_on_admission_primary}
                {content.diagnosis_on_admission_primary_code && ` (Mã: ${content.diagnosis_on_admission_primary_code})`}
              </Typography>
            )}
            {content.diagnosis_on_admission_secondary && content.diagnosis_on_admission_secondary !== 's' && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Khi nhập viện - Phụ:</strong> {content.diagnosis_on_admission_secondary}
                {content.diagnosis_on_admission_secondary_code && ` (Mã: ${content.diagnosis_on_admission_secondary_code})`}
              </Typography>
            )}
            {content.discharge_diagnosis_primary && content.discharge_diagnosis_primary !== 's' && (
              <Typography variant="body2">
                <strong>Khi xuất viện - Chính:</strong> {content.discharge_diagnosis_primary}
                {content.discharge_diagnosis_primary_code && ` (Mã: ${content.discharge_diagnosis_primary_code})`}
              </Typography>
            )}
          </Box>
        )}

        {/* Treatment Methods */}
        {content.treatment_methods && content.treatment_methods !== 's' && content.treatment_methods !== 'ss' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Phương pháp Điều trị
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {content.treatment_methods}
            </Typography>
          </Box>
        )}

        {/* Discharge Information */}
        {content.discharge_date && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Thông tin Xuất viện
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Ngày:</strong> {content.discharge_date}
                </Typography>
              </Grid>
              {content.discharge_time && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Giờ:</strong> {content.discharge_time}
                  </Typography>
                </Grid>
              )}
              {content.discharge_type && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Loại:</strong> {
                      content.discharge_type === 'discharged' ? 'Xuất viện' :
                        content.discharge_type === 'transferred' ? 'Chuyển viện' :
                          content.discharge_type === 'death' ? 'Tử vong' :
                            content.discharge_type
                    }
                  </Typography>
                </Grid>
              )}
              {content.total_treatment_days && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Tổng số ngày điều trị:</strong> {content.total_treatment_days}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Reviewer Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          {content.reviewed_by && (
            <Typography variant="body2" color="text.secondary">
              <strong>Người đánh giá:</strong> {content.reviewed_by}
            </Typography>
          )}
          {content.reviewed_at && (
            <Typography variant="body2" color="text.secondary">
              <strong>Thời gian đánh giá:</strong> {formatDateTime(content.reviewed_at)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Format Screening Record
  const formatScreeningRecord = (content) => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Thông tin Sàng lọc
        </Typography>

        {/* Admission Information */}
        {(content.admission_date || content.admission_type) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Thông tin Nhập viện
            </Typography>
            <Grid container spacing={2}>
              {content.admission_date && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Ngày:</strong> {content.admission_date}
                  </Typography>
                </Grid>
              )}
              {content.admission_time && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Giờ:</strong> {content.admission_time}
                  </Typography>
                </Grid>
              )}
              {content.admission_type && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Loại:</strong> {
                      content.admission_type === 'emergency' ? 'Cấp cứu' :
                        content.admission_type === 'outpatient' ? 'Ngoại trú' :
                          content.admission_type === 'department' ? 'Nội trú' :
                            content.admission_type
                    }
                  </Typography>
                </Grid>
              )}
              {content.bed_number && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Số giường:</strong> {content.bed_number}
                  </Typography>
                </Grid>
              )}
              {content.room_number && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Số phòng:</strong> {content.room_number}
                  </Typography>
                </Grid>
              )}
              {content.referred_by && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Giới thiệu bởi:</strong> {
                      content.referred_by === 'medical_facility' ? 'Cơ sở y tế' :
                        content.referred_by === 'self' ? 'Tự đến' :
                          content.referred_by === 'other' ? 'Khác' :
                            content.referred_by
                    }
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Vital Signs */}
        {content.vital_signs && typeof content.vital_signs === 'object' && Object.keys(content.vital_signs).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Dấu hiệu Sinh tồn
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(content.vital_signs).map(([key, value]) => {
                if (!value || value === '') return null;
                const vitalSignsMap = {
                  'blood_pressure_systolic': 'Huyết áp Tâm thu',
                  'blood_pressure_diastolic': 'Huyết áp Tâm trương',
                  'pulse': 'Mạch',
                  'temperature': 'Nhiệt độ',
                  'respiratory_rate': 'Nhịp thở',
                  'oxygen_saturation': 'SpO2',
                  'weight': 'Cân nặng',
                  'height': 'Chiều cao'
                };
                const displayKey = vitalSignsMap[key] || formatKey(key);
                return (
                  <Grid item xs={6} key={key}>
                    <Typography variant="body2">
                      <strong>{displayKey}:</strong> {value}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Medical History */}
        {(content.personal_history || content.family_history || content.allergies_detail) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Tiền sử Bệnh
            </Typography>
            {content.personal_history && content.personal_history !== 's' && content.personal_history !== 'ss' && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Tiền sử Cá nhân:</strong> {content.personal_history}
              </Typography>
            )}
            {content.family_history && content.family_history !== 's' && content.family_history !== 'ss' && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Tiền sử Gia đình:</strong> {content.family_history}
              </Typography>
            )}
            {content.allergies_detail && content.allergies_detail !== 's' && content.allergies_detail !== 'ss' && (
              <Typography variant="body2">
                <strong>Dị ứng:</strong> {content.allergies_detail}
              </Typography>
            )}
          </Box>
        )}

        {/* Screening Checklist */}
        {content.screening_checklist && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Danh sách Kiểm tra
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(content.screening_checklist).map(([key, value]) => {
                const checklistMap = {
                  'vital_signs_complete': 'Dấu hiệu Sinh tồn Hoàn thành',
                  'medical_history_complete': 'Tiền sử Bệnh Hoàn thành',
                  'allergies_documented': 'Dị ứng Đã ghi nhận',
                  'medications_documented': 'Thuốc Đã ghi nhận',
                  'social_history_complete': 'Tiền sử Xã hội Hoàn thành'
                };
                const displayKey = checklistMap[key] || formatKey(key);
                return (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="body2">
                      <strong>{displayKey}:</strong> {value ? 'Có' : 'Không'}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  // Format Lab Processing Record
  const formatLabRecord = (content) => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Xử lý Xét nghiệm
        </Typography>

        {/* Sample Collection */}
        {(content.sample_collection_date || content.sample_type) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Thu thập Mẫu
            </Typography>
            <Grid container spacing={2}>
              {content.sample_collection_date && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Ngày:</strong> {content.sample_collection_date}
                  </Typography>
                </Grid>
              )}
              {content.sample_collection_time && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Giờ:</strong> {content.sample_collection_time}
                  </Typography>
                </Grid>
              )}
              {content.sample_type && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Loại mẫu:</strong> {content.sample_type}
                  </Typography>
                </Grid>
              )}
              {content.sample_id && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Mã mẫu:</strong> {content.sample_id}
                  </Typography>
                </Grid>
              )}
              {content.sample_quality && (
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Chất lượng:</strong> {content.sample_quality}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Lab Notes */}
        {content.lab_notes && content.lab_notes !== 's' && content.lab_notes !== 'ss' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Ghi chú
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {content.lab_notes}
            </Typography>
          </Box>
        )}

        {/* Results */}
        {(content.lab_results || content.imaging_results) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Kết quả
            </Typography>
            {content.lab_results && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Kết quả Xét nghiệm:</strong> {
                  Array.isArray(content.lab_results)
                    ? (content.lab_results.length > 0 ? content.lab_results.join(', ') : 'Chưa có kết quả')
                    : (content.lab_results !== '' ? content.lab_results : 'Chưa có kết quả')
                }
              </Typography>
            )}
            {content.imaging_results && (
              <Typography variant="body2">
                <strong>Kết quả Chẩn đoán hình ảnh:</strong> {
                  Array.isArray(content.imaging_results)
                    ? (content.imaging_results.length > 0 ? content.imaging_results.join(', ') : 'Chưa có kết quả')
                    : (content.imaging_results !== '' ? content.imaging_results : 'Chưa có kết quả')
                }
              </Typography>
            )}
          </Box>
        )}

        {/* Processor Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          {content.processed_by && (
            <Typography variant="body2" color="text.secondary">
              <strong>Người xử lý:</strong> {content.processed_by}
            </Typography>
          )}
          {content.processed_at && (
            <Typography variant="body2" color="text.secondary">
              <strong>Thời gian xử lý:</strong> {formatDateTime(content.processed_at)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Format generic record (fallback)
  const formatGenericRecord = (content) => {
    const formatObject = (obj, indent = 0) => {
      let result = [];
      const indentStr = '  '.repeat(indent);

      for (const [key, value] of Object.entries(obj)) {
        // Bỏ qua các field rỗng hoặc placeholder
        if (value === null || value === undefined || value === '' || value === 's' || value === 'ss') {
          continue;
        }

        const formattedKey = formatKey(key);

        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          // Nested object
          const nestedContent = formatObject(value, indent + 1);
          if (nestedContent.length > 0) {
            result.push(`${indentStr}${formattedKey}:`);
            result.push(...nestedContent);
          }
        } else if (Array.isArray(value)) {
          // Array
          if (value.length > 0) {
            result.push(`${indentStr}${formattedKey}: ${value.join(', ')}`);
          }
        } else if (typeof value === 'boolean') {
          // Boolean
          result.push(`${indentStr}${formattedKey}: ${value ? 'Có' : 'Không'}`);
        } else {
          // String or number
          result.push(`${indentStr}${formattedKey}: ${value}`);
        }
      }
      return result;
    };

    const formatted = formatObject(content);
    return formatted.length > 0 ? formatted.join('\n') : 'Không có nội dung.';
  };

  // Render medical record content theo loại
  const renderMedicalRecordContent = (record) => {
    // Chỉ hiển thị thông báo mã hóa nếu:
    // 1. is_encrypted = true VÀ
    // 2. can_decrypt = false (không có quyền giải mã)
    if (record.is_encrypted && !record.can_decrypt) {
      return (
        <Alert severity="info">
          Nội dung đã được mã hóa. Cần quyền quản trị viên để giải mã.
        </Alert>
      );
    }

    // Nếu đã được giải mã tự động (can_decrypt = true) hoặc chưa mã hóa
    // thì hiển thị nội dung bình thường

    let content;
    try {
      content = typeof record.content === 'string'
        ? JSON.parse(record.content)
        : record.content;
    } catch {
      return (
        <Typography variant="body2" color="text.secondary">
          Không thể phân tích nội dung.
        </Typography>
      );
    }

    if (!content || typeof content !== 'object') {
      return (
        <Typography variant="body2" color="text.secondary">
          Không có nội dung.
        </Typography>
      );
    }

    const recordType = detectRecordType(record);

    switch (recordType) {
      case 'doctor_review':
        return formatDoctorReviewRecord(content);
      case 'review':
        return formatReviewRecord(content);
      case 'screening':
        return formatScreeningRecord(content);
      case 'lab':
        return formatLabRecord(content);
      default:
        // Fallback: format generic
        const genericContent = formatGenericRecord(content);
        return (
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>
            {genericContent}
          </Typography>
        );
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Hồ sơ Bệnh án
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Số ngày gần đây"
            type="number"
            value={daysFilter}
            onChange={(e) => {
              setDaysFilter(parseInt(e.target.value) || 30);
              setDateFilter('');
              setPage(0);
            }}
            size="small"
            sx={{ width: 150 }}
          />
          <TextField
            label="Ngày cụ thể (YYYY-MM-DD)"
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setDaysFilter(0);
              setPage(0);
            }}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Ngày hẹn</strong></TableCell>
              <TableCell><strong>Giờ hẹn</strong></TableCell>
              <TableCell><strong>Mã bệnh nhân</strong></TableCell>
              <TableCell><strong>Tên bệnh nhân</strong></TableCell>
              <TableCell><strong>Khoa</strong></TableCell>
              <TableCell><strong>Lý do</strong></TableCell>
              <TableCell><strong>Ngày Hoàn thành</strong></TableCell>
              <TableCell><strong>Hành động</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {isDoctor
                      ? 'Chưa có bệnh nhân nào được khám'
                      : 'Chưa có hồ sơ bệnh án'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => (
                <TableRow key={apt.id} hover>
                  <TableCell>{formatDate(apt.appointment_date)}</TableCell>
                  <TableCell>{formatTime(apt.appointment_time)}</TableCell>
                  <TableCell>{apt.patient_code}</TableCell>
                  <TableCell><strong>{apt.patient_name}</strong></TableCell>
                  <TableCell>
                    <Chip
                      label={apt.department_name}
                      color={apt.department_name === 'Internal Medicine' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{apt.reason_text || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(apt.completed_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewRecord(apt)}
                      >
                        XEM HỒ SƠ
                      </Button>
                      {isDoctor && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCreatePrescription(apt)}
                        >
                          KÊ ĐƠN
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
        />
      </TableContainer>

      {/* Record View Dialog */}
      <Dialog
        open={openRecordDialog}
        onClose={handleCloseRecordDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Hồ sơ Bệnh án - {selectedAppointment?.patient_name}
            </Typography>
            <Chip
              label={selectedAppointment?.department_name}
              color={selectedAppointment?.department_name === 'Internal Medicine' ? 'primary' : 'default'}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingRecord ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedAppointment?.department_name === 'Internal Medicine' ? (
            // Internal Medicine Record View
            selectedRecord && selectedRecord.record ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Thông tin Bệnh nhân
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Mã bệnh nhân:</strong> {selectedRecord.patient?.patient_code || selectedAppointment?.patient_code || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Họ và tên:</strong> {selectedRecord.patient?.full_name || selectedAppointment?.patient_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Ngày sinh:</strong> {
                        (selectedRecord.patient?.date_of_birth && selectedRecord.patient.date_of_birth !== 'N/A' && selectedRecord.patient.date_of_birth !== 'null' && selectedRecord.patient.date_of_birth !== 'undefined')
                          ? formatDate(selectedRecord.patient.date_of_birth)
                          : (selectedAppointment?.patient_dob && selectedAppointment.patient_dob !== 'N/A' && selectedAppointment.patient_dob !== 'null' && selectedAppointment.patient_dob !== 'undefined'
                            ? formatDate(selectedAppointment.patient_dob)
                            : 'N/A')
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Giới tính:</strong> {
                        selectedRecord.patient?.gender
                          ? (selectedRecord.patient.gender === 'male' ? 'Nam' : selectedRecord.patient.gender === 'female' ? 'Nữ' : selectedRecord.patient.gender.charAt(0).toUpperCase() + selectedRecord.patient.gender.slice(1))
                          : (selectedAppointment?.patient_gender
                            ? (selectedAppointment.patient_gender === 'male' ? 'Nam' : selectedAppointment.patient_gender === 'female' ? 'Nữ' : selectedAppointment.patient_gender.charAt(0).toUpperCase() + selectedAppointment.patient_gender.slice(1))
                            : 'N/A')
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Điện thoại:</strong> {selectedRecord.patient?.phone || selectedAppointment?.patient_phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedRecord.patient?.email || selectedAppointment?.patient_email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Ngày hẹn:</strong> {formatDate(selectedRecord.appointment?.appointment_date || selectedAppointment?.appointment_date)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Lý do khám:</strong> {selectedRecord.appointment?.reason_text || selectedAppointment?.reason_text || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Hồ sơ Bệnh án Nội khoa
                </Typography>

                {/* Display key information from Internal Medicine record */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1"><strong>I. Hành chính</strong></Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Lý do Nhập viện:</strong></Typography>
                        <Typography variant="body2">{String(selectedRecord.record.reason_for_admission || selectedRecord.record.screening?.reason_for_admission || 'N/A')}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Loại Nhập viện:</strong></Typography>
                        <Typography variant="body2">
                          {selectedRecord.record.admission_type === 'emergency' ? 'Cấp cứu' :
                            selectedRecord.record.admission_type === 'outpatient' ? 'Ngoại trú' :
                              selectedRecord.record.admission_type === 'department' ? 'Nội trú' : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Giới thiệu bởi:</strong></Typography>
                        <Typography variant="body2">
                          {selectedRecord.record.referred_by === 'medical_facility' ? 'Cơ sở y tế' :
                            selectedRecord.record.referred_by === 'self' ? 'Tự đến' :
                              selectedRecord.record.referred_by === 'other' ? 'Khác' : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1"><strong>II. Dấu hiệu Sinh tồn Ban đầu</strong></Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Huyết áp:</strong> {String(selectedRecord.record.blood_pressure_systolic || selectedRecord.record.screening?.blood_pressure_systolic || '')}/{String(selectedRecord.record.blood_pressure_diastolic || selectedRecord.record.screening?.blood_pressure_diastolic || '')} mmHg</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Mạch:</strong> {String(selectedRecord.record.pulse || selectedRecord.record.screening?.pulse || 'N/A')} bpm</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Nhiệt độ:</strong> {String(selectedRecord.record.temperature || selectedRecord.record.screening?.temperature || 'N/A')} °C</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Nhịp thở:</strong> {String(selectedRecord.record.respiratory_rate || selectedRecord.record.screening?.respiratory_rate || 'N/A')} /phút</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>SpO2:</strong> {String(selectedRecord.record.oxygen_saturation || selectedRecord.record.screening?.oxygen_saturation || 'N/A')} %</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Cân nặng:</strong> {String(selectedRecord.record.weight || selectedRecord.record.screening?.weight || 'N/A')} kg</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2"><strong>Chiều cao:</strong> {String(selectedRecord.record.height || selectedRecord.record.screening?.height || 'N/A')} cm</Typography>
                      </Grid>
                      {selectedRecord.record.bmi && (
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2"><strong>BMI:</strong> {selectedRecord.record.bmi.toFixed(2)}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {selectedRecord.record.case_summary && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1"><strong>III. Tóm tắt Ca bệnh</strong></Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {selectedRecord.record.case_summary}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {(selectedRecord.record.diagnosis_on_admission_primary ||
                  selectedRecord.record.discharge_diagnosis_primary) && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1"><strong>IV. Chẩn đoán</strong></Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {selectedRecord.record.diagnosis_on_admission_primary && (
                            <Grid item xs={12}>
                              <Typography variant="body2"><strong>Chẩn đoán khi Nhập viện:</strong></Typography>
                              <Typography variant="body2">
                                {String(selectedRecord.record.diagnosis_on_admission_primary || '')}
                                {selectedRecord.record.diagnosis_on_admission_primary_code &&
                                  ` (Mã: ${String(selectedRecord.record.diagnosis_on_admission_primary_code)})`}
                              </Typography>
                            </Grid>
                          )}
                          {selectedRecord.record.discharge_diagnosis_primary && (
                            <Grid item xs={12}>
                              <Typography variant="body2"><strong>Chẩn đoán khi Xuất viện:</strong></Typography>
                              <Typography variant="body2">
                                {String(selectedRecord.record.discharge_diagnosis_primary || '')}
                                {selectedRecord.record.discharge_diagnosis_primary_code &&
                                  ` (Mã: ${String(selectedRecord.record.discharge_diagnosis_primary_code)})`}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}

                {selectedRecord.record.treatment_methods && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1"><strong>V. Phương pháp Điều trị</strong></Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {typeof selectedRecord.record.treatment_methods === 'string'
                          ? selectedRecord.record.treatment_methods
                          : String(selectedRecord.record.treatment_methods || '')}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Hiển thị các medical records (Doctor Review, Review, Screening, Lab) dưới dạng format đẹp */}
                {selectedRecord.individualRecords && selectedRecord.individualRecords.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1"><strong>VI. Chi tiết Hồ sơ</strong></Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {selectedRecord.individualRecords.map((record, index) => (
                        <Box key={record.id || index} sx={{ mb: 3, pb: 2, borderBottom: index < selectedRecord.individualRecords.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {record.title || 'Hồ sơ Bệnh án'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Tạo lúc: {formatDateTime(record.created_at)}
                          </Typography>
                          {renderMedicalRecordContent(record)}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  Để xem và chỉnh sửa hồ sơ chi tiết đầy đủ, vui lòng truy cập trang "Khám Nội khoa".
                </Alert>
              </Box>
            ) : (
              <Alert severity="warning">
                Không tìm thấy hồ sơ bệnh án cho bệnh nhân này.
              </Alert>
            )
          ) : (
            // Regular Medical Records View
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin Bệnh nhân
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Mã bệnh nhân:</strong> {selectedRecord?.[0]?.patient_code || selectedAppointment?.patient_code || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Họ và tên:</strong> {selectedRecord?.[0]?.patient_name || selectedAppointment?.patient_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Ngày sinh:</strong> {formatDate(selectedRecord?.[0]?.patient_date_of_birth || selectedAppointment?.patient_dob) || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Giới tính:</strong> {
                    selectedRecord?.[0]?.patient_gender
                      ? (selectedRecord[0].patient_gender === 'male' ? 'Nam' : selectedRecord[0].patient_gender === 'female' ? 'Nữ' : selectedRecord[0].patient_gender)
                      : (selectedAppointment?.patient_gender
                        ? (selectedAppointment.patient_gender === 'male' ? 'Nam' : selectedAppointment.patient_gender === 'female' ? 'Nữ' : selectedAppointment.patient_gender)
                        : 'N/A')
                  }</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Điện thoại:</strong> {selectedRecord?.[0]?.patient_phone || selectedAppointment?.patient_phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Email:</strong> {selectedRecord?.[0]?.patient_email || selectedAppointment?.patient_email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Ngày hẹn:</strong> {formatDate(selectedAppointment?.appointment_date)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Lý do khám:</strong> {selectedAppointment?.reason_text || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Medical Records
              </Typography>
              {selectedRecord && Array.isArray(selectedRecord) && selectedRecord.length > 0 ? (
                <Box>
                  {selectedRecord.map((record, index) => (
                    <Accordion key={record.id || index} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ flex: 1 }}>
                            {record.title || 'Không có tiêu đề'}
                          </Typography>
                          <Chip
                            label={record.record_type === 'diagnosis' ? 'Chẩn đoán' :
                              record.record_type === 'prescription' ? 'Đơn thuốc' :
                                record.record_type === 'lab_test' ? 'Xét nghiệm' :
                                  record.record_type === 'imaging' ? 'Chẩn đoán hình ảnh' :
                                    record.record_type === 'surgery' ? 'Phẫu thuật' : 'Ghi chú'}
                            size="small"
                            color={record.record_type === 'diagnosis' ? 'error' :
                              record.record_type === 'prescription' ? 'primary' :
                                record.record_type === 'lab_test' ? 'info' : 'default'}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            {renderMedicalRecordContent(record)}
                          </Grid>
                          {record.diagnosis_code && (
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                <strong>Diagnosis Code (ICD-10):</strong> {record.diagnosis_code}
                              </Typography>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatDateTime(record.created_at)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  Chưa có hồ sơ bệnh án nào cho bệnh nhân này.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecordDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MedicalRecords;
