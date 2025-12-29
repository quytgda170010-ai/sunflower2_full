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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  TransferWithinAStation as TransferIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useKeycloak } from '../context/KeycloakContext';

// Permission mapping: which doctor can edit which clinical exam fields
// bs.dakhoa: can VIEW all but CANNOT EDIT clinical exam (Tab 1)
// Specialist doctors: can only edit/view their specialty fields
const DOCTOR_FIELD_PERMISSIONS = {
  'bs.dakhoa': {
    canEditClinicalExam: false,
    viewAll: true,
    fields: [] // Cannot edit any clinical exam fields
  },
  'bs.mat': {
    fields: ['eye_exam'],
    fieldLabels: { 'eye_exam': 'Mắt' }
  },
  'bs.taimuihong': {
    fields: ['ent_exam'],
    fieldLabels: { 'ent_exam': 'Tai - Mũi - Họng' }
  },
  'bs.ranghammat': {
    fields: ['dental_exam'],
    fieldLabels: { 'dental_exam': 'Răng hàm mặt' }
  },
  'bs.noikhoa': {
    fields: ['cardiovascular_exam', 'respiratory_exam', 'digestive_exam', 'endocrine_exam', 'neurological_exam'],
    fieldLabels: {
      'cardiovascular_exam': 'Tim mạch',
      'respiratory_exam': 'Hô hấp',
      'digestive_exam': 'Tiêu hóa',
      'endocrine_exam': 'Nội tiết, Dinh dưỡng và các bệnh khác',
      'neurological_exam': 'Thần kinh'
    }
  },
  'bs.ngoaikhoa': {
    fields: ['musculoskeletal_exam', 'genitourinary_exam'],
    fieldLabels: {
      'musculoskeletal_exam': 'Cơ xương khớp',
      'genitourinary_exam': 'Tiết niệu - Sinh dục'
    }
  },
  'bs.chanthuong': {
    fields: ['musculoskeletal_exam'],
    fieldLabels: { 'musculoskeletal_exam': 'Cơ xương khớp' }
  },
  'bs.sanphukhoa': {
    fields: ['genitourinary_exam'],
    fieldLabels: { 'genitourinary_exam': 'Tiết niệu - Sinh dục' }
  },
  'bs.nhikhoa': {
    editAll: true,
    viewAll: true,
    fields: ['cardiovascular_exam', 'respiratory_exam', 'digestive_exam', 'genitourinary_exam',
      'neurological_exam', 'musculoskeletal_exam', 'ent_exam', 'dental_exam', 'eye_exam', 'endocrine_exam']
  },
};

// List of specialist doctors for transfer
const SPECIALIST_DOCTORS = [
  { username: 'bs.noikhoa', label: 'BS. Nội Khoa' },
  { username: 'bs.mat', label: 'BS. Mắt' },
  { username: 'bs.taimuihong', label: 'BS. Tai-Mũi-Họng' },
  { username: 'bs.ranghammat', label: 'BS. Răng Hàm Mặt' },
  { username: 'bs.sanphukhoa', label: 'BS. Sản Phụ Khoa' },
  { username: 'bs.nhikhoa', label: 'BS. Nhi Khoa' },
];

function InternalMedicineDoctorReview() {
  // Get current user from Keycloak
  const { keycloak } = useKeycloak();
  const currentUsername = keycloak?.tokenParsed?.preferred_username || '';

  // Check if current user can edit a specific clinical exam field
  const canEditField = (fieldName) => {
    const userPermission = DOCTOR_FIELD_PERMISSIONS[currentUsername];

    // If no specific permission defined, allow editing (for admin/other roles)
    if (!userPermission) return true;

    // bs.dakhoa cannot edit any clinical exam fields
    if (userPermission.canEditClinicalExam === false) return false;

    // If user has editAll permission
    if (userPermission.editAll) return true;

    // Check if field is in allowed fields list
    return userPermission.fields?.includes(fieldName) || false;
  };

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Doctor dialog state
  const [openDoctorDialog, setOpenDoctorDialog] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [maskedFields, setMaskedFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const isFieldMasked = (field) => maskedFields.includes(field);

  // Form state - Clinical examination of organ systems
  const [cardiovascularExam, setCardiovascularExam] = useState('');
  const [respiratoryExam, setRespiratoryExam] = useState('');
  const [digestiveExam, setDigestiveExam] = useState('');
  const [genitourinaryExam, setGenitourinaryExam] = useState('');
  const [neurologicalExam, setNeurologicalExam] = useState('');
  const [musculoskeletalExam, setMusculoskeletalExam] = useState('');
  const [entExam, setEntExam] = useState('');
  const [dentalExam, setDentalExam] = useState('');
  const [eyeExam, setEyeExam] = useState('');
  const [endocrineExam, setEndocrineExam] = useState('');
  const [requiredParaclinicalTests, setRequiredParaclinicalTests] = useState('');
  const [caseSummary, setCaseSummary] = useState('');

  // Form state - Diagnosis
  const [diagnosisOnAdmissionPrimary, setDiagnosisOnAdmissionPrimary] = useState('');
  const [diagnosisOnAdmissionPrimaryCode, setDiagnosisOnAdmissionPrimaryCode] = useState('');
  const [diagnosisOnAdmissionSecondary, setDiagnosisOnAdmissionSecondary] = useState('');
  const [diagnosisOnAdmissionSecondaryCode, setDiagnosisOnAdmissionSecondaryCode] = useState('');
  const [diagnosisOnAdmissionDifferential, setDiagnosisOnAdmissionDifferential] = useState('');
  const [diagnosisOnAdmissionDifferentialCode, setDiagnosisOnAdmissionDifferentialCode] = useState('');

  // Form state - Tiên lượng và điều trị
  const [prognosis, setPrognosis] = useState('');
  const [treatmentDirection, setTreatmentDirection] = useState('');

  // Form state - Tổng kết bệnh án
  const [clinicalCourseSummary, setClinicalCourseSummary] = useState('');
  const [paraclinicalResultsSummary, setParaclinicalResultsSummary] = useState('');
  const [treatmentMethods, setTreatmentMethods] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('');
  const [followUpTreatment, setFollowUpTreatment] = useState('');

  // Form state - Final diagnosis
  const [referredFrom, setReferredFrom] = useState('');
  const [referredFromCode, setReferredFromCode] = useState('');
  const [outpatientDiagnosis, setOutpatientDiagnosis] = useState('');
  const [outpatientDiagnosisCode, setOutpatientDiagnosisCode] = useState('');
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState('');
  const [admissionDiagnosisCode, setAdmissionDiagnosisCode] = useState('');
  const [admissionProcedure, setAdmissionProcedure] = useState('');
  const [admissionSurgery, setAdmissionSurgery] = useState('');
  const [dischargeDiagnosisPrimary, setDischargeDiagnosisPrimary] = useState('');
  const [dischargeDiagnosisPrimaryCode, setDischargeDiagnosisPrimaryCode] = useState('');
  const [dischargeDiagnosisSecondary, setDischargeDiagnosisSecondary] = useState('');
  const [dischargeDiagnosisSecondaryCode, setDischargeDiagnosisSecondaryCode] = useState('');
  const [dischargeComplication, setDischargeComplication] = useState('');
  const [dischargeSequela, setDischargeSequela] = useState('');

  // Form state - Tình trạng ra viện
  const [treatmentOutcome, setTreatmentOutcome] = useState('improved');
  const [pathologyResult, setPathologyResult] = useState('');
  const [deathTime, setDeathTime] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathCause, setDeathCause] = useState('');
  const [deathTiming, setDeathTiming] = useState('');
  const [primaryDeathCause, setPrimaryDeathCause] = useState('');
  const [primaryDeathCauseCode, setPrimaryDeathCauseCode] = useState('');
  const [autopsyPerformed, setAutopsyPerformed] = useState(false);
  const [autopsyDiagnosis, setAutopsyDiagnosis] = useState('');
  const [autopsyDiagnosisCode, setAutopsyDiagnosisCode] = useState('');

  // Form state - Discharge
  const [dischargeDate, setDischargeDate] = useState('');
  const [dischargeTime, setDischargeTime] = useState('');
  const [dischargeType, setDischargeType] = useState('discharged');
  const [totalTreatmentDays, setTotalTreatmentDays] = useState('');

  // Fetch queue
  const fetchQueue = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/admin/queues/internal-med/doctor');

      // Ensure we always set patients array, even if empty
      if (response.data && Array.isArray(response.data.appointments)) {
        setPatients(response.data.appointments);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
      setError('Unable to load patient list');
      setPatients([]); // Set empty array on error
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial load with loading indicator
    fetchQueue(true);

    // Auto refresh every 30 seconds without showing loading indicator
    const interval = setInterval(() => {
      if (isMounted) {
        fetchQueue(false); // Don't show loading for auto-refresh
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open doctor dialog
  const handleOpenDoctor = async (appointment) => {
    try {
      setError('');
      setSuccess('');
      setCurrentAppointment(appointment);

      // Fetch detailed information
      const response = await api.get(`/admin/queues/internal-med/${appointment.id}/doctor`);
      const data = response.data;

      setCurrentPatient(data.patient);
      setCurrentRecord(data.record || {});

      const masked = Array.isArray(data.record?._masked_fields) ? data.record._masked_fields : [];
      setMaskedFields(masked);
      const getFieldValue = (fieldName, value) => {
        // Check if field is masked (either in _masked_fields array or value is MASK_PLACEHOLDER '***')
        if (masked.includes(fieldName) || value === '***') {
          return 'No permission to view';
        }
        return value || '';
      };

      // Load existing data if record exists
      if (data.record) {
        setCardiovascularExam(getFieldValue('cardiovascular_exam', data.record.cardiovascular_exam));
        setRespiratoryExam(getFieldValue('respiratory_exam', data.record.respiratory_exam));
        setDigestiveExam(getFieldValue('digestive_exam', data.record.digestive_exam));
        setGenitourinaryExam(getFieldValue('genitourinary_exam', data.record.genitourinary_exam));
        setNeurologicalExam(getFieldValue('neurological_exam', data.record.neurological_exam));
        setMusculoskeletalExam(getFieldValue('musculoskeletal_exam', data.record.musculoskeletal_exam));
        setEntExam(getFieldValue('ent_exam', data.record.ent_exam));
        setDentalExam(getFieldValue('dental_exam', data.record.dental_exam));
        setEyeExam(getFieldValue('eye_exam', data.record.eye_exam));
        setEndocrineExam(getFieldValue('endocrine_exam', data.record.endocrine_exam));
        setRequiredParaclinicalTests(data.record.required_paraclinical_tests || '');
        setCaseSummary(data.record.case_summary || '');

        setDiagnosisOnAdmissionPrimary(getFieldValue('diagnosis_on_admission_primary', data.record.diagnosis_on_admission_primary));
        setDiagnosisOnAdmissionPrimaryCode(getFieldValue('diagnosis_on_admission_primary_code', data.record.diagnosis_on_admission_primary_code));
        setDiagnosisOnAdmissionSecondary(getFieldValue('diagnosis_on_admission_secondary', data.record.diagnosis_on_admission_secondary));
        setDiagnosisOnAdmissionSecondaryCode(getFieldValue('diagnosis_on_admission_secondary_code', data.record.diagnosis_on_admission_secondary_code));
        setDiagnosisOnAdmissionDifferential(getFieldValue('diagnosis_on_admission_differential', data.record.diagnosis_on_admission_differential));
        setDiagnosisOnAdmissionDifferentialCode(getFieldValue('diagnosis_on_admission_differential_code', data.record.diagnosis_on_admission_differential_code));

        setPrognosis(getFieldValue('prognosis', data.record.prognosis));
        setTreatmentDirection(getFieldValue('treatment_direction', data.record.treatment_direction));

        setClinicalCourseSummary(getFieldValue('clinical_course_summary', data.record.clinical_course_summary));
        setParaclinicalResultsSummary(getFieldValue('paraclinical_results_summary', data.record.paraclinical_results_summary));
        setTreatmentMethods(getFieldValue('treatment_methods', data.record.treatment_methods));
        setDischargeCondition(getFieldValue('discharge_condition', data.record.discharge_condition));
        setFollowUpTreatment(getFieldValue('follow_up_treatment', data.record.follow_up_treatment));

        setReferredFrom(data.record.referred_from || '');
        setReferredFromCode(data.record.referred_from_code || '');
        setOutpatientDiagnosis(data.record.outpatient_diagnosis || '');
        setOutpatientDiagnosisCode(data.record.outpatient_diagnosis_code || '');
        setAdmissionDiagnosis(data.record.admission_diagnosis || '');
        setAdmissionDiagnosisCode(data.record.admission_diagnosis_code || '');
        setAdmissionProcedure(data.record.admission_procedure || '');
        setAdmissionSurgery(data.record.admission_surgery || '');
        setDischargeDiagnosisPrimary(data.record.discharge_diagnosis_primary || '');
        setDischargeDiagnosisPrimaryCode(data.record.discharge_diagnosis_primary_code || '');
        setDischargeDiagnosisSecondary(data.record.discharge_diagnosis_secondary || '');
        setDischargeDiagnosisSecondaryCode(data.record.discharge_diagnosis_secondary_code || '');
        setDischargeComplication(data.record.discharge_complication || '');
        setDischargeSequela(data.record.discharge_sequela || '');

        setTreatmentOutcome(data.record.treatment_outcome || 'improved');
        setPathologyResult(data.record.pathology_result || '');
        setDeathTime(data.record.death_time || '');
        setDeathDate(data.record.death_date || '');
        setDeathCause(data.record.death_cause || '');
        setDeathTiming(data.record.death_timing || '');
        setPrimaryDeathCause(data.record.primary_death_cause || '');
        setPrimaryDeathCauseCode(data.record.primary_death_cause_code || '');
        setAutopsyPerformed(data.record.autopsy_performed || false);
        setAutopsyDiagnosis(data.record.autopsy_diagnosis || '');
        setAutopsyDiagnosisCode(data.record.autopsy_diagnosis_code || '');

        setDischargeDate(data.record.discharge_date || '');
        setDischargeTime(data.record.discharge_time || '');
        setDischargeType(data.record.discharge_type || 'discharged');
        setTotalTreatmentDays(data.record.total_treatment_days || '');
      }

      setOpenDoctorDialog(true);
      setTabValue(0);
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      setError('Unable to load patient information');
    }
  };

  // Close doctor dialog
  const handleCloseDoctorDialog = () => {
    setOpenDoctorDialog(false);
    setCurrentAppointment(null);
    setCurrentPatient(null);
    setCurrentRecord(null);
    setMaskedFields([]);
    setTabValue(0);
    // Reset all form fields
    setCardiovascularExam('');
    setRespiratoryExam('');
    setDigestiveExam('');
    setGenitourinaryExam('');
    setNeurologicalExam('');
    setMusculoskeletalExam('');
    setEntExam('');
    setDentalExam('');
    setEyeExam('');
    setEndocrineExam('');
    setRequiredParaclinicalTests('');
    setCaseSummary('');
    setDiagnosisOnAdmissionPrimary('');
    setDiagnosisOnAdmissionPrimaryCode('');
    setDiagnosisOnAdmissionSecondary('');
    setDiagnosisOnAdmissionSecondaryCode('');
    setDiagnosisOnAdmissionDifferential('');
    setDiagnosisOnAdmissionDifferentialCode('');
    setPrognosis('');
    setTreatmentDirection('');
    setClinicalCourseSummary('');
    setParaclinicalResultsSummary('');
    setTreatmentMethods('');
    setDischargeCondition('');
    setFollowUpTreatment('');
    setReferredFrom('');
    setReferredFromCode('');
    setOutpatientDiagnosis('');
    setOutpatientDiagnosisCode('');
    setAdmissionDiagnosis('');
    setAdmissionDiagnosisCode('');
    setAdmissionProcedure('');
    setAdmissionSurgery('');
    setDischargeDiagnosisPrimary('');
    setDischargeDiagnosisPrimaryCode('');
    setDischargeDiagnosisSecondary('');
    setDischargeDiagnosisSecondaryCode('');
    setDischargeComplication('');
    setDischargeSequela('');
    setTreatmentOutcome('improved');
    setPathologyResult('');
    setDeathTime('');
    setDeathDate('');
    setDeathCause('');
    setDeathTiming('');
    setPrimaryDeathCause('');
    setPrimaryDeathCauseCode('');
    setAutopsyPerformed(false);
    setAutopsyDiagnosis('');
    setAutopsyDiagnosisCode('');
    setDischargeDate('');
    setDischargeTime('');
    setDischargeType('discharged');
    setTotalTreatmentDays('');
  };

  // Save doctor review
  const handleSaveDoctorReview = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const doctorData = {
        // Clinical examination of organ systems
        cardiovascular_exam: cardiovascularExam,
        respiratory_exam: respiratoryExam,
        digestive_exam: digestiveExam,
        genitourinary_exam: genitourinaryExam,
        neurological_exam: neurologicalExam,
        musculoskeletal_exam: musculoskeletalExam,
        ent_exam: entExam,
        dental_exam: dentalExam,
        eye_exam: eyeExam,
        endocrine_exam: endocrineExam,
        required_paraclinical_tests: requiredParaclinicalTests,
        case_summary: caseSummary,

        // Diagnosis on admission
        diagnosis_on_admission_primary: diagnosisOnAdmissionPrimary,
        diagnosis_on_admission_primary_code: diagnosisOnAdmissionPrimaryCode,
        diagnosis_on_admission_secondary: diagnosisOnAdmissionSecondary,
        diagnosis_on_admission_secondary_code: diagnosisOnAdmissionSecondaryCode,
        diagnosis_on_admission_differential: diagnosisOnAdmissionDifferential,
        diagnosis_on_admission_differential_code: diagnosisOnAdmissionDifferentialCode,

        // Tiên lượng và điều trị
        prognosis: prognosis,
        treatment_direction: treatmentDirection,

        // Tổng kết bệnh án
        clinical_course_summary: clinicalCourseSummary,
        paraclinical_results_summary: paraclinicalResultsSummary,
        treatment_methods: treatmentMethods,
        discharge_condition: dischargeCondition,
        follow_up_treatment: followUpTreatment,

        // Final diagnosis
        referred_from: referredFrom,
        referred_from_code: referredFromCode,
        outpatient_diagnosis: outpatientDiagnosis,
        outpatient_diagnosis_code: outpatientDiagnosisCode,
        admission_diagnosis: admissionDiagnosis,
        admission_diagnosis_code: admissionDiagnosisCode,
        admission_procedure: admissionProcedure,
        admission_surgery: admissionSurgery,
        discharge_diagnosis_primary: dischargeDiagnosisPrimary,
        discharge_diagnosis_primary_code: dischargeDiagnosisPrimaryCode,
        discharge_diagnosis_secondary: dischargeDiagnosisSecondary,
        discharge_diagnosis_secondary_code: dischargeDiagnosisSecondaryCode,
        discharge_complication: dischargeComplication,
        discharge_sequela: dischargeSequela,

        // Tình trạng ra viện
        treatment_outcome: treatmentOutcome,
        pathology_result: pathologyResult || null,
        death_time: deathTime || null,
        death_date: deathDate || null,
        death_cause: deathCause || null,
        death_timing: deathTiming || null,
        primary_death_cause: primaryDeathCause,
        primary_death_cause_code: primaryDeathCauseCode,
        autopsy_performed: autopsyPerformed,
        autopsy_diagnosis: autopsyDiagnosis,
        autopsy_diagnosis_code: autopsyDiagnosisCode,

        // Discharge
        discharge_date: dischargeDate,
        discharge_time: dischargeTime,
        discharge_type: dischargeType,
        total_treatment_days: totalTreatmentDays ? parseInt(totalTreatmentDays) : null,
      };

      const maskedSet = new Set(maskedFields);
      Object.keys(doctorData).forEach((key) => {
        if (maskedSet.has(key)) {
          delete doctorData[key];
        } else if (doctorData[key] === 'No permission to view') {
          doctorData[key] = '';
        }
      });

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, doctorData);

      setSuccess('Examination completed');
      handleCloseDoctorDialog();
      fetchQueue(false); // Refresh without loading indicator

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving doctor review:', err);
      setError(err.response?.data?.detail || 'Unable to save examination information');
    } finally {
      setSaving(false);
    }
  };

  // Forward patient to Lab Technician for testing
  const handleForwardToLab = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const doctorData = {
        forward_to_lab: true, // This tells backend to update status to waiting_lab_processing
        required_paraclinical_tests: requiredParaclinicalTests,
        case_summary: caseSummary,
      };

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, doctorData);

      setSuccess('Đã chuyển bệnh nhân đến Xét nghiệm');
      handleCloseDoctorDialog();
      fetchQueue(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error forwarding to lab:', err);
      setError(err.response?.data?.detail || 'Không thể chuyển xét nghiệm');
    } finally {
      setSaving(false);
    }
  };

  // State for specialist transfer menu
  const [specialistMenuAnchor, setSpecialistMenuAnchor] = useState(null);

  // Transfer patient to specialist doctor
  const handleTransferToSpecialist = async (specialistUsername) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      setSpecialistMenuAnchor(null);

      const doctorData = {
        transfer_to_specialist: specialistUsername,
        case_summary: caseSummary,
      };

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, doctorData);

      const specialist = SPECIALIST_DOCTORS.find(s => s.username === specialistUsername);
      setSuccess(`Đã chuyển bệnh nhân đến ${specialist?.label || specialistUsername}`);
      handleCloseDoctorDialog();
      fetchQueue(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error transferring to specialist:', err);
      setError(err.response?.data?.detail || 'Không thể chuyển bác sĩ chuyên khoa');
    } finally {
      setSaving(false);
    }
  };

  // Return patient to general doctor (bs.dakhoa) - for specialist doctors
  const handleReturnToGeneralDoctor = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Include all clinical exam data so specialist's work is saved when transferring
      const doctorData = {
        return_to_general: true,
        // Clinical examination of organ systems
        cardiovascular_exam: cardiovascularExam,
        respiratory_exam: respiratoryExam,
        digestive_exam: digestiveExam,
        genitourinary_exam: genitourinaryExam,
        neurological_exam: neurologicalExam,
        musculoskeletal_exam: musculoskeletalExam,
        ent_exam: entExam,
        dental_exam: dentalExam,
        eye_exam: eyeExam,
        endocrine_exam: endocrineExam,
        required_paraclinical_tests: requiredParaclinicalTests,
        case_summary: caseSummary,
      };

      await api.put(`/admin/queues/internal-med/${currentAppointment.id}/doctor`, doctorData);

      setSuccess('Đã chuyển bệnh nhân về BS. Đa Khoa');
      handleCloseDoctorDialog();
      fetchQueue(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error returning to general doctor:', err);
      setError(err.response?.data?.detail || 'Không thể chuyển về BS. Đa Khoa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Khám Bệnh & Điều Trị - Bác Sĩ
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchQueue(true)}
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
            Danh Sách Bệnh Nhân - Bác Sĩ
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
                          {(() => {
                            const statusMap = {
                              'waiting_doctor_first_review': 'Chờ khám lần 1',
                              'waiting_doctor_final_review': 'Chờ kết luận',
                              'in_progress': 'Đang điều trị'
                            };
                            return (
                              <Chip
                                label={statusMap[patient.status] || 'Chờ khám'}
                                color={patient.status === 'in_progress' ? 'success' : 'primary'}
                                size="small"
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDoctor(patient)}
                          >
                            Khám Bệnh
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

      {/* Doctor Dialog */}
      <Dialog
        open={openDoctorDialog}
        onClose={handleCloseDoctorDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HospitalIcon />
            <Typography variant="h6">
              Khám & Điều Trị - Bệnh Án Nội Khoa
            </Typography>
          </Box>
          {currentPatient && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Bệnh nhân: <strong>{currentPatient.full_name}</strong> - Mã BN: {currentPatient.patient_code}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {currentRecord && (
            <Box>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                <Tab label="Xem Thông Tin" />
                <Tab label="Khám Lâm Sàng" />
                <Tab label="Chẩn Đoán" />
                <Tab label="Điều Trị" />
                <Tab label="Ra Viện" />
              </Tabs>

              {/* Tab 0: View information from previous steps */}
              {tabValue === 0 && (
                <Box>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Thông Tin Sàng Lọc</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2"><strong>Lý do khám:</strong></Typography>
                          <Typography variant="body2">{currentRecord.reason_for_admission || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2"><strong>Sinh hiệu:</strong></Typography>
                          <Typography variant="body2">
                            Mạch: {currentRecord.pulse || 'N/A'} lần/phút |
                            Nhiệt độ: {currentRecord.temperature || 'N/A'} °C |
                            Huyết áp: {currentRecord.blood_pressure_systolic || 'N/A'}/{currentRecord.blood_pressure_diastolic || 'N/A'} mmHg
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Kết Quả Xét Nghiệm</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {currentRecord.lab_results && Array.isArray(currentRecord.lab_results) && currentRecord.lab_results.length > 0 ? (
                        currentRecord.lab_results.map((result, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2"><strong>{result.test_name}:</strong> {result.result} {result.unit} ({result.status})</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">Chưa có kết quả xét nghiệm</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}

              {/* Tab 1: Clinical examination of organ systems */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    III. KHÁM LÂM SÀNG - CÁC CƠ QUAN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tim mạch"
                        multiline
                        rows={3}
                        value={cardiovascularExam}
                        onChange={(e) => setCardiovascularExam(e.target.value)}
                        disabled={isFieldMasked('cardiovascular_exam') || !canEditField('cardiovascular_exam')}
                        InputProps={{ readOnly: isFieldMasked('cardiovascular_exam') || !canEditField('cardiovascular_exam') }}
                        helperText={!canEditField('cardiovascular_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('cardiovascular_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hô hấp"
                        multiline
                        rows={3}
                        value={respiratoryExam}
                        onChange={(e) => setRespiratoryExam(e.target.value)}
                        disabled={isFieldMasked('respiratory_exam') || !canEditField('respiratory_exam')}
                        InputProps={{ readOnly: isFieldMasked('respiratory_exam') || !canEditField('respiratory_exam') }}
                        helperText={!canEditField('respiratory_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('respiratory_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tiêu hóa"
                        multiline
                        rows={3}
                        value={digestiveExam}
                        onChange={(e) => setDigestiveExam(e.target.value)}
                        disabled={isFieldMasked('digestive_exam') || !canEditField('digestive_exam')}
                        InputProps={{ readOnly: isFieldMasked('digestive_exam') || !canEditField('digestive_exam') }}
                        helperText={!canEditField('digestive_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('digestive_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tiết niệu - Sinh dục"
                        multiline
                        rows={3}
                        value={genitourinaryExam}
                        onChange={(e) => setGenitourinaryExam(e.target.value)}
                        disabled={isFieldMasked('genitourinary_exam') || !canEditField('genitourinary_exam')}
                        InputProps={{ readOnly: isFieldMasked('genitourinary_exam') || !canEditField('genitourinary_exam') }}
                        helperText={!canEditField('genitourinary_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('genitourinary_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Thần kinh"
                        multiline
                        rows={3}
                        value={neurologicalExam}
                        onChange={(e) => setNeurologicalExam(e.target.value)}
                        disabled={isFieldMasked('neurological_exam') || !canEditField('neurological_exam')}
                        InputProps={{ readOnly: isFieldMasked('neurological_exam') || !canEditField('neurological_exam') }}
                        helperText={!canEditField('neurological_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('neurological_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Cơ xương khớp"
                        multiline
                        rows={3}
                        value={musculoskeletalExam}
                        onChange={(e) => setMusculoskeletalExam(e.target.value)}
                        disabled={isFieldMasked('musculoskeletal_exam') || !canEditField('musculoskeletal_exam')}
                        InputProps={{ readOnly: isFieldMasked('musculoskeletal_exam') || !canEditField('musculoskeletal_exam') }}
                        helperText={!canEditField('musculoskeletal_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('musculoskeletal_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tai - Mũi - Họng"
                        multiline
                        rows={2}
                        value={entExam}
                        onChange={(e) => setEntExam(e.target.value)}
                        disabled={isFieldMasked('ent_exam') || !canEditField('ent_exam')}
                        InputProps={{ readOnly: isFieldMasked('ent_exam') || !canEditField('ent_exam') }}
                        helperText={!canEditField('ent_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('ent_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Răng hàm mặt"
                        multiline
                        rows={2}
                        value={dentalExam}
                        onChange={(e) => setDentalExam(e.target.value)}
                        disabled={isFieldMasked('dental_exam') || !canEditField('dental_exam')}
                        InputProps={{ readOnly: isFieldMasked('dental_exam') || !canEditField('dental_exam') }}
                        helperText={!canEditField('dental_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('dental_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mắt"
                        multiline
                        rows={2}
                        value={eyeExam}
                        onChange={(e) => setEyeExam(e.target.value)}
                        disabled={isFieldMasked('eye_exam') || !canEditField('eye_exam')}
                        InputProps={{ readOnly: isFieldMasked('eye_exam') || !canEditField('eye_exam') }}
                        helperText={!canEditField('eye_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('eye_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nội tiết, Dinh dưỡng và các bệnh khác"
                        multiline
                        rows={2}
                        value={endocrineExam}
                        onChange={(e) => setEndocrineExam(e.target.value)}
                        disabled={isFieldMasked('endocrine_exam') || !canEditField('endocrine_exam')}
                        InputProps={{ readOnly: isFieldMasked('endocrine_exam') || !canEditField('endocrine_exam') }}
                        helperText={!canEditField('endocrine_exam') ? 'Không có quyền chỉnh sửa' : (isFieldMasked('endocrine_exam') ? 'Không có quyền truy cập' : undefined)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Xét nghiệm cận lâm sàng cần làm"
                        multiline
                        rows={2}
                        value={requiredParaclinicalTests}
                        onChange={(e) => setRequiredParaclinicalTests(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tóm tắt bệnh án"
                        multiline
                        rows={4}
                        value={caseSummary}
                        onChange={(e) => setCaseSummary(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 2: Diagnosis */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    IV. CHẨN ĐOÁN KHI NHẬP VIỆN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán chính"
                        value={diagnosisOnAdmissionPrimary}
                        onChange={(e) => setDiagnosisOnAdmissionPrimary(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_primary')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_primary') }}
                        helperText={isFieldMasked('diagnosis_on_admission_primary') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10 (Chính)"
                        value={diagnosisOnAdmissionPrimaryCode}
                        onChange={(e) => setDiagnosisOnAdmissionPrimaryCode(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_primary_code')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_primary_code') }}
                        helperText={isFieldMasked('diagnosis_on_admission_primary_code') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán phụ"
                        value={diagnosisOnAdmissionSecondary}
                        onChange={(e) => setDiagnosisOnAdmissionSecondary(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_secondary')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_secondary') }}
                        helperText={isFieldMasked('diagnosis_on_admission_secondary') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10 (Phụ)"
                        value={diagnosisOnAdmissionSecondaryCode}
                        onChange={(e) => setDiagnosisOnAdmissionSecondaryCode(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_secondary_code')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_secondary_code') }}
                        helperText={isFieldMasked('diagnosis_on_admission_secondary_code') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán phân biệt"
                        value={diagnosisOnAdmissionDifferential}
                        onChange={(e) => setDiagnosisOnAdmissionDifferential(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_differential')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_differential') }}
                        helperText={isFieldMasked('diagnosis_on_admission_differential') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10 (Phân biệt)"
                        value={diagnosisOnAdmissionDifferentialCode}
                        onChange={(e) => setDiagnosisOnAdmissionDifferentialCode(e.target.value)}
                        disabled={isFieldMasked('diagnosis_on_admission_differential_code')}
                        InputProps={{ readOnly: isFieldMasked('diagnosis_on_admission_differential_code') }}
                        helperText={isFieldMasked('diagnosis_on_admission_differential_code') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    V. TIÊN LƯỢNG
                  </Typography>
                  <TextField
                    fullWidth
                    label="Tiên lượng"
                    multiline
                    rows={3}
                    value={prognosis}
                    onChange={(e) => setPrognosis(e.target.value)}
                    disabled={isFieldMasked('prognosis')}
                    InputProps={{ readOnly: isFieldMasked('prognosis') }}
                    helperText={isFieldMasked('prognosis') ? 'No permission to access' : undefined}
                  />

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    VI. HƯỚNG ĐIỀU TRỊ
                  </Typography>
                  <TextField
                    fullWidth
                    label="Hướng điều trị"
                    multiline
                    rows={3}
                    value={treatmentDirection}
                    onChange={(e) => setTreatmentDirection(e.target.value)}
                    disabled={isFieldMasked('treatment_direction')}
                    InputProps={{ readOnly: isFieldMasked('treatment_direction') }}
                    helperText={isFieldMasked('treatment_direction') ? 'No permission to access' : undefined}
                  />
                </Box>
              )}

              {/* Tab 3: Treatment */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    B. TÓM TẮT BỆNH ÁN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Diễn biến lâm sàng"
                        multiline
                        rows={4}
                        value={clinicalCourseSummary}
                        onChange={(e) => setClinicalCourseSummary(e.target.value)}
                        disabled={isFieldMasked('clinical_course_summary')}
                        InputProps={{ readOnly: isFieldMasked('clinical_course_summary') }}
                        helperText={isFieldMasked('clinical_course_summary') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tóm tắt kết quả cận lâm sàng có giá trị chẩn đoán"
                        multiline
                        rows={4}
                        value={paraclinicalResultsSummary}
                        onChange={(e) => setParaclinicalResultsSummary(e.target.value)}
                        disabled={isFieldMasked('paraclinical_results_summary')}
                        InputProps={{ readOnly: isFieldMasked('paraclinical_results_summary') }}
                        helperText={isFieldMasked('paraclinical_results_summary') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phương pháp điều trị"
                        multiline
                        rows={4}
                        value={treatmentMethods}
                        onChange={(e) => setTreatmentMethods(e.target.value)}
                        disabled={isFieldMasked('treatment_methods')}
                        InputProps={{ readOnly: isFieldMasked('treatment_methods') }}
                        helperText={isFieldMasked('treatment_methods') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tình trạng người bệnh khi ra viện"
                        multiline
                        rows={3}
                        value={dischargeCondition}
                        onChange={(e) => setDischargeCondition(e.target.value)}
                        disabled={isFieldMasked('discharge_condition')}
                        InputProps={{ readOnly: isFieldMasked('discharge_condition') }}
                        helperText={isFieldMasked('discharge_condition') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hướng điều trị và chế độ tiếp theo"
                        multiline
                        rows={3}
                        value={followUpTreatment}
                        onChange={(e) => setFollowUpTreatment(e.target.value)}
                        disabled={isFieldMasked('follow_up_treatment')}
                        InputProps={{ readOnly: isFieldMasked('follow_up_treatment') }}
                        helperText={isFieldMasked('follow_up_treatment') ? 'No permission to access' : undefined}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 4: Discharge */}
              {tabValue === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    CHẨN ĐOÁN CUỐI CÙNG
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán khi nhập viện"
                        value={admissionDiagnosis}
                        onChange={(e) => setAdmissionDiagnosis(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10"
                        value={admissionDiagnosisCode}
                        onChange={(e) => setAdmissionDiagnosisCode(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán chính (Ra viện)"
                        value={dischargeDiagnosisPrimary}
                        onChange={(e) => setDischargeDiagnosisPrimary(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10 (Chính)"
                        value={dischargeDiagnosisPrimaryCode}
                        onChange={(e) => setDischargeDiagnosisPrimaryCode(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Chẩn đoán phụ (Ra viện)"
                        value={dischargeDiagnosisSecondary}
                        onChange={(e) => setDischargeDiagnosisSecondary(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mã ICD-10 (Phụ)"
                        value={dischargeDiagnosisSecondaryCode}
                        onChange={(e) => setDischargeDiagnosisSecondaryCode(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    TÌNH TRẠNG RA VIỆN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Ngày ra viện"
                        type="date"
                        value={dischargeDate}
                        onChange={(e) => setDischargeDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Giờ ra viện"
                        type="time"
                        value={dischargeTime}
                        onChange={(e) => setDischargeTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Hình thức ra viện</InputLabel>
                        <Select
                          value={dischargeType}
                          onChange={(e) => setDischargeType(e.target.value)}
                          label="Hình thức ra viện"
                        >
                          <MenuItem value="discharged">Ra viện</MenuItem>
                          <MenuItem value="requested">Xin về</MenuItem>
                          <MenuItem value="left">Trốn viện</MenuItem>
                          <MenuItem value="transferred">Chuyển viện</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Tổng số ngày điều trị"
                        type="number"
                        value={totalTreatmentDays}
                        onChange={(e) => setTotalTreatmentDays(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Kết quả điều trị</InputLabel>
                        <Select
                          value={treatmentOutcome}
                          onChange={(e) => setTreatmentOutcome(e.target.value)}
                          label="Kết quả điều trị"
                        >
                          <MenuItem value="cured">Khỏi bệnh</MenuItem>
                          <MenuItem value="improved">Đỡ hơn</MenuItem>
                          <MenuItem value="unchanged">Không thay đổi</MenuItem>
                          <MenuItem value="worsened">Nặng hơn</MenuItem>
                          <MenuItem value="deceased">Tử vong</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDoctorDialog}>
            Hủy
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScienceIcon />}
            onClick={handleForwardToLab}
            disabled={saving}
            color="warning"
          >
            {saving ? 'Đang chuyển...' : 'Chuyển Xét Nghiệm'}
          </Button>
          {/* Transfer to Specialist dropdown - only show for bs.dakhoa */}
          {currentUsername === 'bs.dakhoa' && (
            <>
              <Button
                variant="outlined"
                startIcon={<TransferIcon />}
                onClick={(e) => setSpecialistMenuAnchor(e.currentTarget)}
                disabled={saving}
                color="secondary"
              >
                Chuyển Chuyên Khoa
              </Button>
              <Menu
                anchorEl={specialistMenuAnchor}
                open={Boolean(specialistMenuAnchor)}
                onClose={() => setSpecialistMenuAnchor(null)}
              >
                {SPECIALIST_DOCTORS.map((specialist) => (
                  <MenuItem
                    key={specialist.username}
                    onClick={() => handleTransferToSpecialist(specialist.username)}
                  >
                    {specialist.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {/* Return to General Doctor button - only show for specialist doctors */}
          {currentUsername !== 'bs.dakhoa' && currentUsername.startsWith('bs.') && (
            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={handleReturnToGeneralDoctor}
              disabled={saving}
              color="info"
            >
              {saving ? 'Đang chuyển...' : 'Chuyển BS Đa Khoa'}
            </Button>
          )}
          {/* LƯU HỒ SƠ button - only show for bs.dakhoa, specialists use CHUYỂN BS ĐA KHOA */}
          {currentUsername === 'bs.dakhoa' && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveDoctorReview}
              disabled={saving}
              color="success"
            >
              {saving ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default InternalMedicineDoctorReview;

