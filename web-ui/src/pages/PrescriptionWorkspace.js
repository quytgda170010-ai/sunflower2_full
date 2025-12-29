import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Divider,
  Tabs,
  Tab,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import api from '../services/api';
import { useKeycloak } from '../context/KeycloakContext';
import { useLocation } from 'react-router-dom';

const DEFAULT_MEDICATION = {
  drug_name: '',
  drug_code: '',
  drug_group: '',
  dose_amount: '',
  dose_unit: 'viên',
  frequency_per_day: '',
  route: 'UỐNG',
  duration_days: '',
  quantity: '',
  start_date: '',
  end_date: '',
  notes: '',
};

const DEPARTMENT_MEDICATION_LIBRARY = {
  'Đa khoa': [
    {
      drug_name: 'Paracetamol 500mg',
      drug_code: 'DK-PARA500',
      drug_group: 'Giảm đau - Hạ sốt',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '3',
      route: 'UỐNG',
      duration_days: '3',
      notes: 'Uống sau ăn',
    },
    {
      drug_name: 'Amoxicillin 500mg',
      drug_code: 'DK-AMOX500',
      drug_group: 'Kháng sinh',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '3',
      route: 'UỐNG',
      duration_days: '7',
      notes: 'Uống đủ liều',
    },
    {
      drug_name: 'Omeprazole 20mg',
      drug_code: 'DK-OMEP20',
      drug_group: 'Dạ dày',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '14',
      notes: 'Uống trước ăn 30 phút',
    },
  ],
  'Nội khoa': [
    {
      drug_name: 'Atorvastatin 10mg',
      drug_code: 'NOI-ATOR10',
      drug_group: 'Tim mạch',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '30',
      notes: 'Uống buổi tối',
    },
    {
      drug_name: 'Bisoprolol 2.5mg',
      drug_code: 'NOI-BISO25',
      drug_group: 'Tim mạch',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '30',
      notes: 'Theo dõi nhịp tim',
    },
    {
      drug_name: 'Amlodipin 5mg',
      drug_code: 'NOI-AMLO5',
      drug_group: 'Huyết áp',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '30',
    },
  ],
  'Tim mạch': [
    {
      drug_name: 'Clopidogrel 75mg',
      drug_code: 'CARD-CLOP75',
      drug_group: 'Chống kết tập tiểu cầu',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '28',
    },
    {
      drug_name: 'Nitroglycerin 6.4mg',
      drug_code: 'CARD-NITRO',
      drug_group: 'Giãn mạch',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '2',
      route: 'NGẬM',
      duration_days: '14',
    },
  ],
  'Ngoại khoa': [
    {
      drug_name: 'Ceftriaxone 1g',
      drug_code: 'SURG-CEFTRI',
      drug_group: 'Kháng sinh',
      dose_amount: '1',
      dose_unit: 'ống',
      frequency_per_day: '2',
      route: 'TIÊM',
      duration_days: '7',
    },
    {
      drug_name: 'Paracetamol 1g',
      drug_code: 'SURG-PARA1G',
      drug_group: 'Giảm đau',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '3',
      route: 'UỐNG',
      duration_days: '5',
    },
  ],
  'Nhi khoa': [
    {
      drug_name: 'Amoxicillin 250mg',
      drug_code: 'PED-AMOX250',
      drug_group: 'Kháng sinh',
      dose_amount: '1',
      dose_unit: 'gói',
      frequency_per_day: '3',
      route: 'UỐNG',
      duration_days: '7',
    },
    {
      drug_name: 'Vitamin D3 400IU',
      drug_code: 'PED-VITD',
      drug_group: 'Vitamin',
      dose_amount: '1',
      dose_unit: 'giọt',
      frequency_per_day: '1',
      route: 'UỐNG',
      duration_days: '30',
    },
  ],
  'Nội tiết': [
    {
      drug_name: 'Metformin 500mg',
      drug_code: 'ENDO-METF500',
      drug_group: 'Đái tháo đường',
      dose_amount: '1',
      dose_unit: 'viên',
      frequency_per_day: '2',
      route: 'UỐNG',
      duration_days: '30',
    },
    {
      drug_name: 'Insulin glargine 100IU',
      drug_code: 'ENDO-GLAR',
      drug_group: 'Đái tháo đường',
      dose_amount: '10',
      dose_unit: 'UI',
      frequency_per_day: '1',
      route: 'TIÊM',
      duration_days: '30',
    },
  ],
};

const FALLBACK_DEPARTMENTS = Object.keys(DEPARTMENT_MEDICATION_LIBRARY).map((name, index) => ({
  id: `fallback-${index + 1}`,
  name,
}));

const getRolesFromToken = (tokenParsed) => {
  if (!tokenParsed) return [];
  const realmRoles = tokenParsed.realm_access?.roles || [];
  const directRoles = tokenParsed.roles || [];
  const resourceRoles = Object.values(tokenParsed.resource_access || {}).flatMap(
    (client) => client.roles || []
  );
  return [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];
};

const inferDepartmentNameFromToken = (tokenParsed) => {
  const attrDepartment =
    tokenParsed?.department ||
    tokenParsed?.dept ||
    tokenParsed?.department_name ||
    (Array.isArray(tokenParsed?.attributes?.department)
      ? tokenParsed.attributes.department[0]
      : null);
  if (attrDepartment) return attrDepartment;

  const username = (tokenParsed?.preferred_username || '').toLowerCase();
  if (username.includes('dakhoa')) return 'Đa khoa';
  if (username.includes('tim')) return 'Tim mạch';
  if (username.includes('noi') && !username.includes('noitiet')) return 'Nội khoa';
  if (username.includes('ngoai')) return 'Ngoại khoa';
  if (username.includes('nhi')) return 'Nhi khoa';
  if (username.includes('noitiet') || username.includes('tieuduong') || username.includes('endo')) return 'Nội tiết';
  return null;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
};

const parseContent = (content) => {
  if (!content) return {};
  if (typeof content === 'object') return content;
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

const PrescriptionWorkspace = () => {
  const { keycloak } = useKeycloak();
  const location = useLocation();
  const token = keycloak?.tokenParsed || {};
  const userRoles = useMemo(() => getRolesFromToken(token), [token]);
  const inferredRole = useMemo(() => {
    const username = (token?.preferred_username || token?.name || '').toLowerCase();
    if (username.includes('bacsi') || username.includes('doctor') || username.includes('bs')) return 'doctor';
    if (username.includes('dieuduong') || username.includes('nurse') || username.includes('head_nurse') || username.includes('truongyd'))
      return username.includes('head') ? 'head_nurse' : 'nurse';
    return null;
  }, [token]);
  const inferredDepartmentName = useMemo(() => inferDepartmentNameFromToken(token), [token]);

  const isDoctor = userRoles.includes('doctor') || inferredRole === 'doctor';
  const isNurse = userRoles.includes('nurse') || userRoles.includes('head_nurse') || inferredRole === 'nurse' || inferredRole === 'head_nurse';

  const [activeTab, setActiveTab] = useState(isDoctor ? 'doctor' : 'nurse');
  useEffect(() => {
    if (!isDoctor && isNurse) {
      setActiveTab('nurse');
    }
  }, [isDoctor, isNurse]);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefillPatient = useMemo(() => {
    const patientId = searchParams.get('patient_id');
    if (!patientId) return null;
    return {
      id: patientId,
      patient_code: searchParams.get('patient_code') || '',
      full_name: searchParams.get('patient_name') || '',
    };
  }, [searchParams]);
  const prefillDepartmentName = searchParams.get('department_name');

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentLocked, setDepartmentLocked] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientDiagnoses, setPatientDiagnoses] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const [medications, setMedications] = useState([DEFAULT_MEDICATION]);
  const [presetSelections, setPresetSelections] = useState({ 0: '' });
  const [medicationsEdited, setMedicationsEdited] = useState(false);
  const [title, setTitle] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const allowedTabs = useMemo(() => {
    const tabs = [];
    if (isDoctor) {
      tabs.push({ value: 'doctor', label: 'Doctor Prescribe', icon: <LocalPharmacyIcon fontSize="small" /> });
    }
    if (isNurse) {
      tabs.push({ value: 'nurse', label: 'Nurse Monitor', icon: <PlaylistAddCheckIcon fontSize="small" /> });
    }
    return tabs;
  }, [isDoctor, isNurse]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/admin/departments');
        const deptData = Array.isArray(res.data) && res.data.length ? res.data : FALLBACK_DEPARTMENTS;
        setDepartments(deptData);
      } catch (error) {
        console.error('Failed to fetch departments', error);
        setDepartments(FALLBACK_DEPARTMENTS);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (prefillPatient) {
      setSelectedPatient(prefillPatient);
      loadPatientContext(prefillPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPatient?.id]);

  const selectedDepartmentName = useMemo(() => {
    if (!selectedDepartment) return '';
    const matched = departments.find((dept) => String(dept.id) === String(selectedDepartment));
    if (matched?.name) return matched.name;
    const fallback = FALLBACK_DEPARTMENTS.find((dept) => String(dept.id) === String(selectedDepartment));
    return fallback?.name || '';
  }, [departments, selectedDepartment]);

  const medicationSuggestions = useMemo(() => {
    if (!selectedDepartmentName) return [];
    return DEPARTMENT_MEDICATION_LIBRARY[selectedDepartmentName] || [];
  }, [selectedDepartmentName]);

  useEffect(() => {
    if (!selectedDepartmentName) {
      setMedications([DEFAULT_MEDICATION]);
      setPresetSelections({ 0: '' });
      setMedicationsEdited(false);
      return;
    }
    const suggestions = DEPARTMENT_MEDICATION_LIBRARY[selectedDepartmentName] || [];
    if (!suggestions.length) {
      if (!medicationsEdited) {
        setMedications([DEFAULT_MEDICATION]);
        setPresetSelections({ 0: '' });
      }
      return;
    }
    if (!medicationsEdited) {
      setMedications(suggestions.map((item) => ({ ...DEFAULT_MEDICATION, ...item })));
      const selectionInit = {};
      suggestions.forEach((_, idx) => {
        selectionInit[idx] = '';
      });
      setPresetSelections(selectionInit);
    }
  }, [selectedDepartmentName, medicationsEdited]);

  useEffect(() => {
    if (!departments.length) return;
    const fallbackName = (departments[0]?.name || '').toLowerCase();
    const targetDeptName = (
      prefillDepartmentName ||
      inferredDepartmentName ||
      fallbackName
    )?.toLowerCase();
    if (!targetDeptName) return;
    const matched =
      departments.find((dept) => (dept.name || '').toLowerCase() === targetDeptName) ||
      departments[0];
    if (matched) {
      setSelectedDepartment(matched.id);
      setMedicationsEdited(false);
      if (prefillDepartmentName) {
        setDepartmentLocked(true);
      }
    }
  }, [departments, prefillDepartmentName, inferredDepartmentName]);

  useEffect(() => {
    if (!patientQuery || patientQuery.length < 3) {
      setPatientOptions([]);
      return;
    }
    setSearchingPatients(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/admin/patients/search?q=${encodeURIComponent(patientQuery)}`);
        setPatientOptions(res.data || []);
      } catch (error) {
        console.error('Failed to search patients', error);
        setPatientOptions([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [patientQuery]);

  const loadPatientContext = async (patient) => {
    if (!patient?.id) return;
    setPatientLoading(true);
    setPageError('');
    try {
      const [detailsRes, diagnosesRes, prescriptionsRes] = await Promise.all([
        api.get(`/admin/patients/${patient.id}`),
        api.get(`/admin/patients/${patient.id}/diagnoses`).catch(() => []),
        api.get(`/admin/patients/${patient.id}/prescriptions`).catch(() => []),
      ]);
      setSelectedPatient(patient);
      setPatientDetails(detailsRes.data || patient);
      setPatientDiagnoses(Array.isArray(diagnosesRes.data) ? diagnosesRes.data.slice(0, 5) : []);

      const normalized = (Array.isArray(prescriptionsRes.data) ? prescriptionsRes.data : []).map((record) => {
        const content = parseContent(record.content);
        const medicationItems =
          content.medications ||
          content.items ||
          content.medication_log?.items ||
          content.medication_log ||
          [];
        return {
          ...record,
          content,
          medications: Array.isArray(medicationItems) ? medicationItems : [],
        };
      });
      setPatientPrescriptions(normalized);
    } catch (error) {
      console.error('Failed to load patient context', error);
      setPageError(error.response?.data?.detail || 'Unable to load patient information');
      setPatientPrescriptions([]);
    } finally {
      setPatientLoading(false);
    }
  };

  const handleAddMedication = () => {
    setMedications((prev) => {
      const updated = [...prev, { ...DEFAULT_MEDICATION }];
      setPresetSelections((prevSel) => ({ ...prevSel, [updated.length - 1]: '' }));
      return updated;
    });
    setMedicationsEdited(true);
  };

  const handleRemoveMedication = (index) => {
    setMedications((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setPresetSelections(() => {
        const nextSelections = {};
        updated.forEach((_, idx) => {
          nextSelections[idx] = '';
        });
        return nextSelections;
      });
      return updated;
    });
    setMedicationsEdited(true);
  };

  const handleMedicationChange = (index, field, value) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
    setMedicationsEdited(true);
  };

  const handlePresetSelect = (index, drugCode) => {
    if (!drugCode) {
      setPresetSelections((prevSel) => ({ ...prevSel, [index]: '' }));
      return;
    }
    const preset = medicationSuggestions.find((item) => item.drug_code === drugCode);
    if (preset) {
      setMedications((prev) =>
        prev.map((med, i) => (i === index ? { ...med, ...preset } : med))
      );
      setMedicationsEdited(true);
    }
    setPresetSelections((prevSel) => ({ ...prevSel, [index]: '' }));
  };

  const validateForm = () => {
    if (!selectedPatient) {
      setFormError('Please select a patient before prescribing.');
      return false;
    }
    if (!selectedDepartment) {
      setFormError('Please select a department for prescribing.');
      return false;
    }
    const invalid = medications.some((med) => !med.drug_name || !med.dose_amount || !med.frequency_per_day);
    if (invalid) {
      setFormError('Each medication line requires Drug Name, Dose, and Frequency.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmitPrescription = async () => {
    if (!isDoctor) return;
    if (!validateForm()) return;

    setSaving(true);
    setSuccessMessage('');
    try {
      const departmentInfo = departments.find((dept) => String(dept.id) === String(selectedDepartment));
      const doctorInfo = {
        id: token?.sub,
        username: token?.preferred_username,
        full_name: token?.name || token?.preferred_username || 'Doctor',
        department: departmentInfo?.name || '',
      };

      const payload = {
        patient_id: selectedPatient.id,
        record_type: 'prescription',
        title:
          title ||
          `Prescription ${departmentInfo?.name || ''} - ${selectedPatient.full_name || selectedPatient.patient_code}`,
        diagnosis_code: diagnosisCode || null,
        sensitivity_level: 'normal',
        content: {
          department_id: selectedDepartment,
          department_name: departmentInfo?.name,
          doctor: doctorInfo,
          notes: generalNotes,
          follow_up: followUp,
          start_date: startDate || null,
          end_date: endDate || null,
          medications: medications,
          generated_at: new Date().toISOString(),
        },
      };

      await api.post('/admin/medical-records', payload);
      setSuccessMessage('Prescription saved successfully and medical record updated.');
      setMedications([DEFAULT_MEDICATION]);
      setPresetSelections({ 0: '' });
      setTitle('');
      setDiagnosisCode('');
      setGeneralNotes('');
      setFollowUp('');
      setStartDate('');
      setEndDate('');
      if (selectedPatient) {
        await loadPatientContext(selectedPatient);
      }
    } catch (error) {
      console.error('Failed to save prescription', error);
      setFormError(error.response?.data?.detail || 'Unable to save prescription, please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderPatientSummary = () => {
    if (!selectedPatient || patientLoading) {
      return (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          {patientLoading ? <CircularProgress size={24} /> : <Typography variant="body2">Chọn bệnh nhân để xem chi tiết</Typography>}
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Bệnh nhân
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              {patientDetails?.full_name} ({patientDetails?.patient_code})
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Ngày sinh
            </Typography>
            <Typography variant="subtitle1">
              {patientDetails?.date_of_birth
                ? new Date(patientDetails.date_of_birth).toLocaleDateString('vi-VN')
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Liên lạc
            </Typography>
            <Typography variant="subtitle1">
              {patientDetails?.phone || 'N/A'} / {patientDetails?.email || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
        {patientDiagnoses.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Chẩn đoán gần đây
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {patientDiagnoses.map((diag) => (
                <Chip
                  key={diag.id}
                  label={`${diag.title || 'Chẩn đoán'} - ${diag.diagnosis_code || 'N/A'}`}
                  size="small"
                  color="default"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderMedicationRow = (medication, index) => (
    <Grid container spacing={2} key={`med-${index}`} sx={{ mb: 1 }}>
      <Grid item xs={12} md={4}>
        <TextField
          label="Tên thuốc *"
          fullWidth
          value={medication.drug_name}
          onChange={(e) => handleMedicationChange(index, 'drug_name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="Drug Code / Group"
          fullWidth
          value={medication.drug_code}
          onChange={(e) => handleMedicationChange(index, 'drug_code', e.target.value)}
          helperText="Có thể dùng mã hoặc nhóm thuốc"
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          label="Liều lượng *"
          fullWidth
          value={medication.dose_amount}
          onChange={(e) => handleMedicationChange(index, 'dose_amount', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={1.5}>
        <TextField
          label="Đơn vị"
          fullWidth
          value={medication.dose_unit}
          onChange={(e) => handleMedicationChange(index, 'dose_unit', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={1.5}>
        <TextField
          label="Lần/ngày *"
          fullWidth
          value={medication.frequency_per_day}
          onChange={(e) => handleMedicationChange(index, 'frequency_per_day', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="Đường dùng"
          fullWidth
          value={medication.route}
          onChange={(e) => handleMedicationChange(index, 'route', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          label="Số ngày"
          type="number"
          fullWidth
          value={medication.duration_days}
          onChange={(e) => handleMedicationChange(index, 'duration_days', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          label="Số lượng"
          fullWidth
          value={medication.quantity}
          onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          label="Ngày bắt đầu"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={medication.start_date}
          onChange={(e) => handleMedicationChange(index, 'start_date', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          label="Ngày kết thúc"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={medication.end_date}
          onChange={(e) => handleMedicationChange(index, 'end_date', e.target.value)}
        />
      </Grid>
      <Grid item xs={11}>
        <TextField
          label="Ghi chú / Hướng dẫn thêm"
          fullWidth
          multiline
          rows={2}
          value={medication.notes}
          onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
        />
      </Grid>
      {medicationSuggestions.length > 0 && (
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel>Chọn nhanh thuốc theo Khoa</InputLabel>
            <Select
              label="Chọn nhanh thuốc theo Khoa"
              value={presetSelections[index] || ''}
              onChange={(e) => handlePresetSelect(index, e.target.value)}
            >
              <MenuItem value="">
                <em>-- Chọn Thuốc --</em>
              </MenuItem>
              {medicationSuggestions.map((option) => (
                <MenuItem key={option.drug_code} value={option.drug_code}>
                  {option.drug_name} ({option.dose_amount} {option.dose_unit} · {option.frequency_per_day} lần/ngày)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {medications.length > 1 && (
          <Tooltip title="Xóa dòng thuốc">
            <IconButton color="error" onClick={() => handleRemoveMedication(index)}>
              <RemoveCircleOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );

  const renderPrescriptionHistory = () => {
    if (!selectedPatient) {
      return (
        <Alert severity="info" icon={<HistoryEduIcon />}>
          Select a patient to view prescribed prescriptions.
        </Alert>
      );
    }
    if (patientLoading) {
      return (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    if (patientPrescriptions.length === 0) {
      return (
        <Alert severity="info" icon={<HistoryEduIcon />}>
          Chưa có đơn thuốc nào trong hồ sơ bệnh án của bệnh nhân này.
        </Alert>
      );
    }
    return patientPrescriptions.map((record) => (
      <Card variant="outlined" sx={{ mb: 2 }} key={record.id}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">{record.title || 'Prescription'}</Typography>
            <Chip label={formatDateTime(record.created_at)} size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Prescribed by: {record.content?.doctor?.full_name || record.created_by || 'Unknown'}{' '}
            {record.content?.department_name ? ` | Department: ${record.content.department_name}` : ''}
          </Typography>
          {record.medications.length > 0 ? (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Drug</TableCell>
                  <TableCell>Dose</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {record.medications.map((med, idx) => (
                  <TableRow key={`${record.id}-med-${idx}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {med.drug_name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {med.drug_code || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {med.dose_amount} {med.dose_unit}
                    </TableCell>
                    <TableCell>{med.frequency_per_day || '-'}</TableCell>
                    <TableCell>{med.route || '-'}</TableCell>
                    <TableCell>
                      {med.start_date ? new Date(med.start_date).toLocaleDateString('vi-VN') : '-'}{' '}
                      {med.end_date ? `→ ${new Date(med.end_date).toLocaleDateString('vi-VN')}` : ''}
                    </TableCell>
                    <TableCell>{med.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Prescription does not have detailed medication list
            </Alert>
          )}
          {record.content?.notes && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Notes: {record.content.notes}
            </Alert>
          )}
        </CardContent>
      </Card>
    ));
  };

  if (!isDoctor && !isNurse) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">You do not have permission to access the prescription / medication tracking page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Theo dõi & Kê đơn thuốc</Typography>
        {allowedTabs.length > 1 && (
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            {allowedTabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        )}
      </Box>

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError('')}>
          {pageError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            1. Chọn Bệnh Nhân
          </Typography>
          {prefillPatient && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Đang chuẩn bị đơn thuốc cho bệnh nhân <strong>{prefillPatient.full_name || prefillPatient.patient_code}</strong>
              {prefillDepartmentName ? ` - Khoa ${prefillDepartmentName}` : ''}. Bạn vẫn có thể chọn bệnh nhân khác nếu cần.
            </Alert>
          )}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={patientOptions}
                getOptionLabel={(option) =>
                  option.full_name ? `${option.full_name} (${option.patient_code})` : ''
                }
                loading={searchingPatients}
                onInputChange={(event, value) => setPatientQuery(value)}
                onChange={(event, value) => {
                  if (value) {
                    loadPatientContext(value);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tìm kiếm Bệnh nhân (Mã hoặc SĐT)"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searchingPatients ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md="auto">
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => selectedPatient && loadPatientContext(selectedPatient)}
                disabled={!selectedPatient}
              >
                Tải Hồ Sơ
              </Button>
            </Grid>
          </Grid>
          {renderPatientSummary()}
        </CardContent>
      </Card>

      {isDoctor && activeTab === 'doctor' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              2. Nhập Thông tin Đơn thuốc
            </Typography>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Khoa Kê đơn *</InputLabel>
                  <Select
                    label="Khoa Kê đơn *"
                    value={selectedDepartment}
                    onChange={(e) => {
                      setMedicationsEdited(false);
                      setSelectedDepartment(e.target.value);
                    }}
                    disabled={departmentLocked}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {departmentLocked ? (
                  <Typography variant="caption" color="text.secondary">
                    Khoa được cố định theo hồ sơ bệnh án.
                  </Typography>
                ) : selectedDepartmentName ? (
                  <Typography variant="caption" color="text.secondary">
                    Hệ thống tự động xác nhận bác sĩ thuộc khoa {selectedDepartmentName}. Bạn có thể thay đổi nếu cần.
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Chọn khoa để hệ thống gợi ý danh mục thuốc phù hợp.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tiêu đề Đơn thuốc"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Vd: Đơn thuốc huyết áp"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Mã ICD-10 / Chẩn đoán"
                  fullWidth
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Ngày bắt đầu dùng thuốc"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Ngày dự kiến kết thúc"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              Danh sách Thuốc
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {medicationSuggestions.length > 0 && selectedDepartmentName
                ? `Đã tải ${medicationSuggestions.length} thuốc mẫu cho khoa ${selectedDepartmentName}. Sử dụng "Chọn nhanh thuốc theo Khoa" trên mỗi dòng để điền nhanh.`
                : 'Chọn khoa kê đơn để hiển thị danh mục thuốc mẫu và gợi ý nhanh.'}
            </Typography>
            {medications.map((medication, index) => renderMedicationRow(medication, index))}
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddMedication}
            >
              Thêm dòng thuốc
            </Button>

            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ghi chú chung / Hướng dẫn"
                  fullWidth
                  multiline
                  rows={3}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Hẹn tái khám"
                  fullWidth
                  multiline
                  rows={3}
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitPrescription}
                disabled={saving}
                startIcon={<LocalPharmacyIcon />}
              >
                {saving ? 'Đang lưu...' : 'Lưu Đơn thuốc'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryEduIcon color="primary" />
            <Typography variant="h6">3. Lịch sử đơn thuốc trong hồ sơ EMR</Typography>
          </Box>
          {renderPrescriptionHistory()}
        </CardContent>
      </Card>

      {isNurse && (!isDoctor || activeTab === 'nurse') && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notes for Nurse
            </Typography>
            <Typography variant="body2">
              - Select a patient to view prescription details prescribed by the doctor. <br />
              - Verify medications before dispensing or update medication status in treatment records. <br />
              - If errors are detected, contact the responsible doctor to adjust the prescription immediately.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default PrescriptionWorkspace;


