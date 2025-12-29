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
  TablePagination,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import api from '../services/api';

dayjs.extend(customParseFormat);

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current username from token
  const getCurrentUsername = () => {
    try {
      const token = localStorage.getItem('keycloak_token') || localStorage.getItem('keycloak-token');
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return payload.preferred_username || payload.username || payload.sub || '';
        }
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
    return '';
  };

  const currentUsername = getCurrentUsername();
  const canAddPatient = currentUsername !== 'dd.ha';

  // All users can only view, cannot edit
  const [formData, setFormData] = useState({
    patient_code: '',
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    cccd: '', // Căn cước công dân - 12 số
    bhyt: ''  // Bảo hiểm y tế - 10 số (mẫu mới) hoặc 15 số (mẫu cũ)
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPatients, setTotalPatients] = useState(0);
  const [dialogTab, setDialogTab] = useState(0);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    confirm_password: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [cccdError, setCccdError] = useState('');
  const [checkingCccd, setCheckingCccd] = useState(false);
  const [bhytError, setBhytError] = useState('');
  const [checkingBhyt, setCheckingBhyt] = useState(false);
  const [dateOfBirthError, setDateOfBirthError] = useState('');

  // Convert string dd/mm/yyyy to dayjs object
  const stringToDayjs = (dateString) => {
    if (!dateString) return null;
    // If in dd/mm/yyyy format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dayjs(dateString, 'DD/MM/YYYY');
    }
    // If in yyyy-mm-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dayjs(dateString, 'YYYY-MM-DD');
    }
    return null;
  };

  // Convert dayjs object to dd/mm/yyyy string
  const dayjsToString = (dateObj) => {
    if (!dateObj || !dayjs.isDayjs(dateObj) || !dateObj.isValid()) return '';
    return dateObj.format('DD/MM/YYYY');
  };

  // Format date to dd/mm/yyyy (for display)
  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    // If already in dd/mm/yyyy format, return as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    // If in yyyy-mm-dd format (from date input), convert to dd/mm/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  // Parse dd/mm/yyyy to yyyy-mm-dd for API
  const parseDateToAPI = (dateString) => {
    if (!dateString) return '';
    // If in dd/mm/yyyy format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    // If already in yyyy-mm-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    return '';
  };

  // Handle date picker change
  const handleDatePickerChange = (newValue) => {
    if (!newValue || !dayjs.isDayjs(newValue) || !newValue.isValid()) {
      setFormData({ ...formData, date_of_birth: '' });
      setDateOfBirthError('');
      return;
    }

    const today = dayjs().endOf('day');

    // Check if date is in future
    if (newValue.isAfter(today)) {
      setDateOfBirthError('Ngày sinh không được vượt quá ngày hiện tại');
      setFormData({ ...formData, date_of_birth: dayjsToString(newValue) });
      return;
    }

    setDateOfBirthError('');
    setFormData({ ...formData, date_of_birth: dayjsToString(newValue) });
  };

  // Generate random patient code: BNYYMMDDXX (không có dấu gạch ngang)
  const generatePatientCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `BN${year}${month}${day}${random}`;
  };

  const handleGenerateCode = () => {
    const newCode = generatePatientCode();
    setFormData({ ...formData, patient_code: newCode });
    // Tự động tạo username từ mã bệnh nhân (chuyển thành chữ thường)
    setUserFormData({ ...userFormData, username: newCode.toLowerCase() });
  };

  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage]);

  // Check duplicate CCCD
  const checkDuplicateCCCD = async (cccd) => {
    if (!cccd || cccd.trim() === '') {
      setCccdError('');
      return false;
    }

    // Skip check if editing existing patient
    if (editingPatient) {
      setCccdError('');
      return false;
    }

    // Validate format first
    if (!/^\d{12}$/.test(cccd)) {
      setCccdError('');
      return false; // Don't check if format is invalid
    }

    setCheckingCccd(true);
    try {
      // Use search endpoint to find patients by CCCD
      const cccdToCheck = cccd.trim();
      const res = await api.get(`/admin/patients/search?q=${encodeURIComponent(cccdToCheck)}`);
      const searchResults = Array.isArray(res.data) ? res.data : (res.data.data || res.data.patients || []);

      // Find exact match
      const duplicate = searchResults.find(p =>
        p.cccd && p.cccd.trim() === cccdToCheck
      );

      if (duplicate) {
        setCccdError(`Căn cước công dân này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
        return true;
      } else {
        setCccdError('');
        return false;
      }
    } catch (error) {
      console.error('Error checking duplicate CCCD:', error);
      // Fallback: try to fetch all patients in batches
      try {
        let allPatients = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
          const res = await api.get(`/admin/patients?page=${page}&page_size=1000`);
          const patients = res.data.data || res.data.patients || [];
          allPatients = [...allPatients, ...patients];

          const total = res.data.pagination?.total || 0;
          hasMore = patients.length === 1000 && allPatients.length < total;
          page++;
        }

        const cccdToCheck = cccd.trim();
        const duplicate = allPatients.find(p =>
          p.cccd && p.cccd.trim() === cccdToCheck
        );

        if (duplicate) {
          setCccdError(`Căn cước công dân này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
          return true;
        } else {
          setCccdError('');
          return false;
        }
      } catch (fallbackError) {
        console.error('Fallback check also failed:', fallbackError);
        setCccdError('');
        return false;
      }
    } finally {
      setCheckingCccd(false);
    }
  };

  // Normalize BHYT: Extract 10 digits (last 10 if 15 digits, or all if 10 digits)
  const normalizeBhyt = (bhyt) => {
    if (!bhyt) return '';
    const digits = bhyt.replace(/\D/g, '');
    if (digits.length === 15) {
      return digits.slice(-10); // Last 10 digits
    } else if (digits.length === 10) {
      return digits;
    }
    return '';
  };

  // Check duplicate BHYT
  const checkDuplicateBHYT = async (bhyt) => {
    if (!bhyt || bhyt.trim() === '') {
      setBhytError('');
      return false;
    }

    // Skip check if editing existing patient
    if (editingPatient) {
      setBhytError('');
      return false;
    }

    // Validate format first (10 or 15 digits)
    const digits = bhyt.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 15) {
      setBhytError('');
      return false; // Don't check if format is invalid
    }

    setCheckingBhyt(true);
    try {
      // Normalize to 10 digits for comparison
      const normalizedBhyt = normalizeBhyt(bhyt);

      // Use search endpoint to find patients by BHYT
      const res = await api.get(`/admin/patients/search?q=${encodeURIComponent(bhyt)}`);
      const searchResults = Array.isArray(res.data) ? res.data : (res.data.data || res.data.patients || []);

      // Find exact match (compare normalized values)
      const duplicate = searchResults.find(p => {
        if (!p.bhyt) return false;
        const pNormalized = normalizeBhyt(p.bhyt);
        return pNormalized === normalizedBhyt && pNormalized !== '';
      });

      if (duplicate) {
        setBhytError(`Mã số BHYT này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
        return true;
      } else {
        setBhytError('');
        return false;
      }
    } catch (error) {
      console.error('Error checking duplicate BHYT:', error);
      // Fallback: try to fetch all patients in batches
      try {
        let allPatients = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
          const res = await api.get(`/admin/patients?page=${page}&page_size=1000`);
          const patients = res.data.data || res.data.patients || [];
          allPatients = [...allPatients, ...patients];

          const total = res.data.pagination?.total || 0;
          hasMore = patients.length === 1000 && allPatients.length < total;
          page++;
        }

        const normalizedBhyt = normalizeBhyt(bhyt);
        const duplicate = allPatients.find(p => {
          if (!p.bhyt) return false;
          const pNormalized = normalizeBhyt(p.bhyt);
          return pNormalized === normalizedBhyt && pNormalized !== '';
        });

        if (duplicate) {
          setBhytError(`Mã số BHYT này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
          return true;
        } else {
          setBhytError('');
          return false;
        }
      } catch (fallbackError) {
        console.error('Fallback check also failed:', fallbackError);
        setBhytError('');
        return false;
      }
    } finally {
      setCheckingBhyt(false);
    }
  };

  // Check duplicate phone number
  const checkDuplicatePhone = async (phone) => {
    if (!phone || phone.trim() === '') {
      setPhoneError('');
      return false;
    }

    // Skip check if editing existing patient
    if (editingPatient) {
      setPhoneError('');
      return false;
    }

    setCheckingPhone(true);
    try {
      // Use search endpoint to find patients by phone number
      const phoneToCheck = phone.trim();
      const res = await api.get(`/admin/patients/search?q=${encodeURIComponent(phoneToCheck)}`);
      const searchResults = Array.isArray(res.data) ? res.data : (res.data.data || res.data.patients || []);

      // Find exact match (case-insensitive, trimmed)
      const duplicate = searchResults.find(p =>
        p.phone && p.phone.trim().toLowerCase() === phoneToCheck.toLowerCase()
      );

      if (duplicate) {
        setPhoneError(`Số điện thoại này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
        return true;
      } else {
        setPhoneError('');
        return false;
      }
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      // Fallback: try to fetch all patients in batches
      try {
        let allPatients = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) { // Limit to 10 pages (10,000 patients max)
          const res = await api.get(`/admin/patients?page=${page}&page_size=1000`);
          const patients = res.data.data || res.data.patients || [];
          allPatients = [...allPatients, ...patients];

          const total = res.data.pagination?.total || 0;
          hasMore = patients.length === 1000 && allPatients.length < total;
          page++;
        }

        const phoneToCheck = phone.trim().toLowerCase();
        const duplicate = allPatients.find(p =>
          p.phone && p.phone.trim().toLowerCase() === phoneToCheck
        );

        if (duplicate) {
          setPhoneError(`Số điện thoại này đã được sử dụng bởi bệnh nhân: ${duplicate.full_name} (${duplicate.patient_code})`);
          return true;
        } else {
          setPhoneError('');
          return false;
        }
      } catch (fallbackError) {
        console.error('Fallback check also failed:', fallbackError);
        setPhoneError('');
        return false;
      }
    } finally {
      setCheckingPhone(false);
    }
  };

  // Debounce phone check
  useEffect(() => {
    if (!formData.phone || editingPatient) {
      setPhoneError('');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkDuplicatePhone(formData.phone);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.phone, editingPatient]);

  // Debounce CCCD check
  useEffect(() => {
    if (!formData.cccd || editingPatient) {
      setCccdError('');
      return;
    }

    // Only check if format is valid (12 digits)
    if (!/^\d{12}$/.test(formData.cccd)) {
      setCccdError('');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkDuplicateCCCD(formData.cccd);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cccd, editingPatient]);

  // Debounce BHYT check
  useEffect(() => {
    if (!formData.bhyt || editingPatient) {
      setBhytError('');
      return;
    }

    // Only check if format is valid (10 or 15 digits)
    const digits = formData.bhyt.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 15) {
      setBhytError('');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkDuplicateBHYT(formData.bhyt);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.bhyt, editingPatient]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      let res;
      if (searchQuery) {
        // Use search endpoint if query is present
        // Note: The search endpoint might return a list directly or wrapped in data/patients
        res = await api.get(`/admin/patients/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        res = await api.get(`/admin/patients?page=${page + 1}&page_size=${rowsPerPage}`);
      }

      // Handle different response structures
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.patients || []);
      setPatients(data);

      // Update total: if search, total is length of result (approximation as search usually returns all matches)
      // otherwise use pagination total
      const total = searchQuery ? data.length : (res.data.pagination?.total || 0);
      setTotalPatients(total);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]); // Clear list on error
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage, searchQuery]);

  const handleAddPatient = async () => {
    try {
      // Validate date of birth
      if (!formData.date_of_birth) {
        alert('Vui lòng chọn ngày sinh');
        return;
      }
      const dateObj = stringToDayjs(formData.date_of_birth);
      if (!dateObj || !dateObj.isValid()) {
        alert('Ngày sinh không hợp lệ');
        return;
      }
      if (dateObj.isAfter(dayjs().endOf('day'))) {
        alert('Ngày sinh không được vượt quá ngày hiện tại');
        return;
      }

      // Validate CCCD (12 số)
      if (formData.cccd && !/^\d{12}$/.test(formData.cccd)) {
        alert('Căn cước công dân phải có đúng 12 số');
        return;
      }

      // Validate BHYT (10 hoặc 15 số)
      if (formData.bhyt) {
        const digits = formData.bhyt.replace(/\D/g, '');
        if (digits.length !== 10 && digits.length !== 15) {
          alert('Bảo hiểm y tế phải có đúng 10 số (mẫu mới) hoặc 15 số (mẫu cũ)');
          return;
        }
      }

      // Check duplicate BHYT before submitting
      if (formData.bhyt && formData.bhyt.trim() !== '') {
        // Check if there's already an error
        if (bhytError) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicateBHYT(formData.bhyt);
        if (isDuplicate) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      // Check duplicate CCCD before submitting
      if (formData.cccd && formData.cccd.trim() !== '') {
        // Check if there's already an error
        if (cccdError) {
          alert('Căn cước công dân này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicateCCCD(formData.cccd);
        if (isDuplicate) {
          alert('Căn cước công dân này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      // Check duplicate phone before submitting
      if (formData.phone && formData.phone.trim() !== '') {
        // Check if there's already an error
        if (phoneError) {
          alert('Số điện thoại này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicatePhone(formData.phone);
        if (isDuplicate) {
          alert('Số điện thoại này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      // Create patient first
      const patientResponse = await api.post('/admin/patients', {
        patient_code: formData.patient_code,
        full_name: formData.full_name,
        date_of_birth: parseDateToAPI(formData.date_of_birth),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        cccd: formData.cccd,
        bhyt: formData.bhyt
      });

      const newPatient = patientResponse.data;
      setSuccessMessage(`Bệnh nhân "${newPatient.full_name}" đã được thêm thành công!`);

      setOpenDialog(false);
      resetForm();
      fetchPatients();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to add patient:', error);
      alert(error.response?.data?.detail || 'Thêm bệnh nhân thất bại');
    }
  };

  const handleAddPatientWithUser = async () => {
    try {
      if (userFormData.password !== userFormData.confirm_password) {
        alert('Mật khẩu không khớp!');
        return;
      }

      // Validate date of birth
      if (!formData.date_of_birth) {
        alert('Vui lòng chọn ngày sinh');
        return;
      }
      const dateObj = stringToDayjs(formData.date_of_birth);
      if (!dateObj || !dateObj.isValid()) {
        alert('Ngày sinh không hợp lệ');
        return;
      }
      if (dateObj.isAfter(dayjs().endOf('day'))) {
        alert('Ngày sinh không được vượt quá ngày hiện tại');
        return;
      }

      // Validate CCCD (12 số)
      if (formData.cccd && !/^\d{12}$/.test(formData.cccd)) {
        alert('Căn cước công dân phải có đúng 12 số');
        return;
      }

      // Validate BHYT (10 hoặc 15 số)
      if (formData.bhyt) {
        const digits = formData.bhyt.replace(/\D/g, '');
        if (digits.length !== 10 && digits.length !== 15) {
          alert('Bảo hiểm y tế phải có đúng 10 số (mẫu mới) hoặc 15 số (mẫu cũ)');
          return;
        }
      }

      // Check duplicate BHYT before submitting
      if (formData.bhyt && formData.bhyt.trim() !== '') {
        // Check if there's already an error
        if (bhytError) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicateBHYT(formData.bhyt);
        if (isDuplicate) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      // Check duplicate CCCD before submitting
      if (formData.cccd && formData.cccd.trim() !== '') {
        // Check if there's already an error
        if (cccdError) {
          alert('Căn cước công dân này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicateCCCD(formData.cccd);
        if (isDuplicate) {
          alert('Căn cước công dân này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      // Check duplicate phone before submitting
      if (formData.phone && formData.phone.trim() !== '') {
        // Check if there's already an error
        if (phoneError) {
          alert('Số điện thoại này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicatePhone(formData.phone);
        if (isDuplicate) {
          alert('Số điện thoại này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      const payload = {
        patient_code: formData.patient_code,
        full_name: formData.full_name,
        date_of_birth: parseDateToAPI(formData.date_of_birth),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        cccd: formData.cccd,
        bhyt: formData.bhyt,
        username: userFormData.username,
        password: userFormData.password
      };

      const response = await api.post('/admin/patients-with-user', payload);
      const newPatient = response.data.patient;
      const createdUsername = response.data.user?.username || userFormData.username;
      setSuccessMessage(`Bệnh nhân "${newPatient.full_name}" và tài khoản "${createdUsername}" đã được tạo thành công!`);

      setOpenDialog(false);
      resetForm();
      setUserFormData({ username: '', password: '', confirm_password: '' });
      fetchPatients();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to add patient with user:', error);
      alert(error.response?.data?.detail || 'Thêm bệnh nhân và tài khoản thất bại');
    }
  };

  const handleEditClick = async (patient) => {
    // Mở dialog ngay với dữ liệu hiện có để trải nghiệm mượt mà
    setEditingPatient(patient);
    setFormData({
      patient_code: patient.patient_code,
      full_name: patient.full_name,
      date_of_birth: formatDateDDMMYYYY(patient.date_of_birth || ''),
      gender: patient.gender,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      cccd: patient.cccd || '',
      bhyt: patient.bhyt || ''
    });
    setOpenDialog(true);

    // Gọi API lấy chi tiết để đảm bảo hành động được ghi log và dữ liệu luôn mới nhất
    try {
      const res = await api.get(`/admin/patients/${patient.id}`);
      const details = res.data || {};
      setEditingPatient(details);
      setFormData({
        patient_code: details.patient_code || '',
        full_name: details.full_name || '',
        date_of_birth: formatDateDDMMYYYY(details.date_of_birth || ''),
        gender: details.gender || 'male',
        phone: details.phone || '',
        email: details.email || '',
        address: details.address || '',
        emergency_contact_name: details.emergency_contact_name || '',
        emergency_contact_phone: details.emergency_contact_phone || '',
        cccd: details.cccd || '',
        bhyt: details.bhyt || ''
      });
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
    }
  };

  const handleUpdatePatient = async () => {
    try {
      // Validate date of birth
      if (!formData.date_of_birth) {
        alert('Vui lòng chọn ngày sinh');
        return;
      }
      const dateObj = stringToDayjs(formData.date_of_birth);
      if (!dateObj || !dateObj.isValid()) {
        alert('Ngày sinh không hợp lệ');
        return;
      }
      if (dateObj.isAfter(dayjs().endOf('day'))) {
        alert('Ngày sinh không được vượt quá ngày hiện tại');
        return;
      }

      // Validate CCCD (12 số)
      if (formData.cccd && !/^\d{12}$/.test(formData.cccd)) {
        alert('Căn cước công dân phải có đúng 12 số');
        return;
      }

      // Validate BHYT (10 hoặc 15 số)
      if (formData.bhyt) {
        const digits = formData.bhyt.replace(/\D/g, '');
        if (digits.length !== 10 && digits.length !== 15) {
          alert('Bảo hiểm y tế phải có đúng 10 số (mẫu mới) hoặc 15 số (mẫu cũ)');
          return;
        }
      }

      // Check duplicate BHYT before submitting
      if (formData.bhyt && formData.bhyt.trim() !== '') {
        // Check if there's already an error
        if (bhytError) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
        // Force check again before submit
        const isDuplicate = await checkDuplicateBHYT(formData.bhyt);
        if (isDuplicate) {
          alert('Mã số BHYT này đã được sử dụng. Vui lòng kiểm tra lại.');
          return;
        }
      }

      const updatePayload = {
        ...formData,
        date_of_birth: parseDateToAPI(formData.date_of_birth)
      };
      await api.put(`/admin/patients/${editingPatient.id}`, updatePayload);
      setOpenDialog(false);
      resetForm();
      fetchPatients();
      alert('Cập nhật thông tin bệnh nhân thành công!');
    } catch (error) {
      console.error('Failed to update patient:', error);
      alert('Cập nhật thông tin bệnh nhân thất bại');
    }
  };

  const handleSavePatient = () => {
    if (!formData.patient_code || !formData.full_name || !formData.date_of_birth || !formData.gender) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    if (!formData.cccd || !/^\d{12}$/.test(formData.cccd)) {
      alert('Vui lòng nhập đúng Căn cước công dân (12 số)');
      return;
    }
    if (editingPatient) {
      handleUpdatePatient();
    } else {
      if (dialogTab === 0) {
        handleAddPatient();
      } else {
        handleSavePatientWithUser();
      }
    }
  };

  const handleSavePatientWithUser = () => {
    if (!formData.patient_code || !formData.full_name || !formData.date_of_birth || !formData.gender) {
      alert('Vui lòng điền đầy đủ thông tin bệnh nhân');
      return;
    }
    if (!formData.cccd || !/^\d{12}$/.test(formData.cccd)) {
      alert('Vui lòng nhập đúng Căn cước công dân (12 số)');
      return;
    }
    if (!userFormData.username || !userFormData.password) {
      alert('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    if (userFormData.password !== userFormData.confirm_password) {
      alert('Mật khẩu không khớp!');
      return;
    }
    handleAddPatientWithUser();
  };


  const resetForm = () => {
    setFormData({
      patient_code: '',
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      phone: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      cccd: '',
      bhyt: ''
    });
    setUserFormData({
      username: '',
      password: '',
      confirm_password: ''
    });
    setEditingPatient(null);
    setDialogTab(0);
    setPhoneError('');
    setCheckingPhone(false);
    setCccdError('');
    setCheckingCccd(false);
    setBhytError('');
    setCheckingBhyt(false);
    setDateOfBirthError('');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // REMOVED early return for loading to keep header mounted

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý bệnh nhân
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Tìm kiếm bệnh nhân"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchPatients();
              }
            }}
            placeholder="Nhập tên, mã BN, SĐT..."
            sx={{ width: 300 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={fetchPatients} edge="end" color="primary">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {canAddPatient && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              THÊM BỆNH NHÂN
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Container>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Mã bệnh nhân</strong></TableCell>
                  <TableCell><strong>Họ và tên</strong></TableCell>
                  <TableCell><strong>Ngày sinh</strong></TableCell>

                  <TableCell><strong>Giới tính</strong></TableCell>
                  <TableCell><strong>Số điện thoại</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!loading && patients.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Không tìm thấy kết quả phù hợp.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.patient_code}</TableCell>
                    <TableCell>{patient.full_name}</TableCell>
                    <TableCell>{patient.date_of_birth}</TableCell>
                    <TableCell>
                      {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                    </TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditClick(patient)}
                        sx={{ mr: 1 }}
                      >
                        XEM
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalPatients}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>

          {/* View/Add Dialog */}
          <Dialog open={openDialog} onClose={() => {
            setOpenDialog(false);
            setPhoneError('');
            setCheckingPhone(false);
            setCccdError('');
            setCheckingCccd(false);
            setBhytError('');
            setCheckingBhyt(false);
          }} maxWidth="md" fullWidth>
            <DialogTitle>{editingPatient ? 'Chi tiết bệnh nhân' : 'Thêm bệnh nhân'}</DialogTitle>
            {!editingPatient && (
              <Tabs value={dialogTab} onChange={(e, newValue) => setDialogTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label="THÔNG TIN BỆNH NHÂN" />
                <Tab label="THÔNG TIN BỆNH NHÂN + TẠO TÀI KHOẢN" />
              </Tabs>
            )}
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {/* Tab 1: Patient Info Only */}
                {(dialogTab === 0 || editingPatient) && (
                  <>
                    <TextField
                      fullWidth
                      label="Mã bệnh nhân *"
                      value={formData.patient_code}
                      onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })}
                      disabled={!!editingPatient}
                      InputProps={{
                        endAdornment: !editingPatient && (
                          <InputAdornment position="end">
                            <Tooltip title="Tự động tạo mã">
                              <IconButton onClick={handleGenerateCode} edge="end">
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      helperText={!editingPatient ? "Nhấn biểu tượng để tự động tạo mã" : ""}
                    />
                    <TextField
                      fullWidth
                      label="Họ và tên *"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!!editingPatient}
                    />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Ngày sinh *"
                        value={stringToDayjs(formData.date_of_birth)}
                        onChange={handleDatePickerChange}
                        format="DD/MM/YYYY"
                        disabled={!!editingPatient}
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!dateOfBirthError,
                            helperText: dateOfBirthError || 'Chọn ngày sinh (dd/mm/yyyy)',
                            placeholder: 'dd/mm/yyyy'
                          }
                        }}
                      />
                    </LocalizationProvider>
                    <TextField
                      fullWidth
                      label="Giới tính *"
                      select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!!editingPatient}
                    >
                      <MenuItem value="male">Nam</MenuItem>
                      <MenuItem value="female">Nữ</MenuItem>
                      <MenuItem value="other">Khác</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Căn cước công dân (CCCD) *"
                      value={formData.cccd}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setFormData({ ...formData, cccd: value });
                        setCccdError(''); // Clear error when user starts typing
                      }}
                      disabled={!!editingPatient}
                      inputProps={{ maxLength: 12 }}
                      helperText={cccdError || (checkingCccd ? 'Đang kiểm tra...' : 'Nhập đúng 12 số')}
                      error={!!cccdError || (formData.cccd && !/^\d{12}$/.test(formData.cccd))}
                      InputProps={{
                        endAdornment: checkingCccd && (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        setPhoneError(''); // Clear error when user starts typing
                      }}
                      disabled={!!editingPatient}
                      error={!!phoneError}
                      helperText={phoneError || (checkingPhone ? 'Đang kiểm tra...' : '')}
                      InputProps={{
                        endAdornment: checkingPhone && (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingPatient}
                    />
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!!editingPatient}
                    />
                    <TextField
                      fullWidth
                      label="Bảo hiểm y tế (BHYT)"
                      value={formData.bhyt}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                        setFormData({ ...formData, bhyt: value });
                        setBhytError(''); // Clear error when user starts typing
                      }}
                      disabled={!!editingPatient}
                      inputProps={{ maxLength: 15 }}
                      helperText={bhytError || (checkingBhyt ? 'Đang kiểm tra...' : 'Nhập 10 số (mẫu mới) hoặc 15 số (mẫu cũ) - tùy chọn')}
                      error={!!bhytError || (formData.bhyt && !/^\d{10}$|^\d{15}$/.test(formData.bhyt))}
                      InputProps={{
                        endAdornment: checkingBhyt && (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Tên người liên hệ khẩn cấp"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      disabled={!!editingPatient}
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại người liên hệ khẩn cấp"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      disabled={!!editingPatient}
                    />
                  </>
                )}

                {/* Tab 2: Patient + User Account */}
                {dialogTab === 1 && !editingPatient && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1 }}>Thông tin bệnh nhân</Typography>
                    <TextField
                      fullWidth
                      label="Mã bệnh nhân *"
                      value={formData.patient_code}
                      onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Tự động tạo mã">
                              <IconButton onClick={handleGenerateCode} edge="end">
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Nhấn biểu tượng để tự động tạo mã"
                    />
                    <TextField
                      fullWidth
                      label="Họ và tên *"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Ngày sinh *"
                        value={stringToDayjs(formData.date_of_birth)}
                        onChange={handleDatePickerChange}
                        format="DD/MM/YYYY"
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!dateOfBirthError,
                            helperText: dateOfBirthError || 'Chọn ngày sinh (dd/mm/yyyy)',
                            placeholder: 'dd/mm/yyyy'
                          }
                        }}
                      />
                    </LocalizationProvider>
                    <TextField
                      fullWidth
                      label="Giới tính *"
                      select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="male">Nam</MenuItem>
                      <MenuItem value="female">Nữ</MenuItem>
                      <MenuItem value="other">Khác</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Căn cước công dân (CCCD) *"
                      value={formData.cccd}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setFormData({ ...formData, cccd: value });
                      }}
                      disabled={!!editingPatient}
                      inputProps={{ maxLength: 12 }}
                      helperText="Nhập đúng 12 số"
                      error={formData.cccd && !/^\d{12}$/.test(formData.cccd)}
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        setPhoneError(''); // Clear error when user starts typing
                      }}
                      error={!!phoneError}
                      helperText={phoneError || (checkingPhone ? 'Đang kiểm tra...' : '')}
                      InputProps={{
                        endAdornment: checkingPhone && (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Bảo hiểm y tế (BHYT)"
                      value={formData.bhyt}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, bhyt: value });
                      }}
                      inputProps={{ maxLength: 10 }}
                      helperText="Nhập đúng 10 số (tùy chọn)"
                      error={formData.bhyt && !/^\d{10}$/.test(formData.bhyt)}
                    />
                    <TextField
                      fullWidth
                      label="Tên người liên hệ khẩn cấp"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại người liên hệ khẩn cấp"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    />

                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Thông tin tài khoản</Typography>
                    <TextField
                      fullWidth
                      label="Tên đăng nhập *"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      helperText="Tên đăng nhập tự động tạo từ mã bệnh nhân"
                      disabled
                    />
                    <TextField
                      fullWidth
                      label="Mật khẩu *"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Xác nhận mật khẩu *"
                      type="password"
                      value={userFormData.confirm_password}
                      onChange={(e) => setUserFormData({ ...userFormData, confirm_password: e.target.value })}
                    />
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenDialog(false);
                setPhoneError('');
                setCheckingPhone(false);
                setCccdError('');
                setCheckingCccd(false);
                setBhytError('');
                setCheckingBhyt(false);
              }}>{editingPatient ? 'ĐÓNG' : 'HỦY'}</Button>
              {!editingPatient && (
                <Button onClick={handleSavePatient} variant="contained" color="primary">
                  THÊM
                </Button>
              )}
            </DialogActions>
          </Dialog>

        </>
      )}
    </Container>
  );
}

export default Patients;
