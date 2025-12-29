import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Tooltip from '@mui/material/Tooltip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import api from '../services/api';

const CATALOG_ITEM_TYPES = ['medication', 'service', 'lab_test', 'imaging'];

function Billing() {
  const [bills, setBills] = useState([]);
  const [medications, setMedications] = useState([]);
  const [services, setServices] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [imagingProcedures, setImagingProcedures] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    patient: null, // Store selected patient object
    items: [],
  });
  
  // Patient search states
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Date filter states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [page, fromDate, toDate]);

  useEffect(() => {
    fetchMedications();
    fetchServices();
    fetchLabTests();
    fetchImaging();
  }, []);

  const fetchBills = async () => {
    try {
      const params = { page, page_size: 10 };
      if (fromDate) {
        params.from_date = dayjs(fromDate).format('YYYY-MM-DD');
      }
      if (toDate) {
        params.to_date = dayjs(toDate).format('YYYY-MM-DD');
      }
      const res = await api.get('/admin/bills', { params });
      setBills(res.data.bills || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      setError('Không thể tải danh sách hóa đơn');
    }
  };

  const handleClearDateFilter = () => {
    setFromDate(null);
    setToDate(null);
    setPage(1); // Reset to first page when clearing filter
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
      // User selected a patient
      const displayText = newValue.phone || newValue.cccd || '';
      setPatientSearchQuery(displayText);
      setFormData((prev) => ({
        ...prev,
        patient_id: newValue.id || '',
        patient: newValue,
      }));
      setPatientSearchOpen(false);
    } else if (newValue === null) {
      // User cleared selection
      setFormData((prev) => ({
        ...prev,
        patient_id: '',
        patient: null,
      }));
      setPatientSearchQuery('');
      setPatientSearchResults([]);
    }
  };

  const fetchMedications = async () => {
    try {
      const res = await api.get('/admin/medications', { params: { page: 1, page_size: 100 } });
      setMedications(res.data.medications || []);
    } catch (error) {
      console.error('Failed to fetch medications:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      setServices(res.data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchLabTests = async () => {
    try {
      const res = await api.get('/admin/lab-tests');
      setLabTests(res.data.lab_tests || []);
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
    }
  };

  const fetchImaging = async () => {
    try {
      const res = await api.get('/admin/imaging');
      setImagingProcedures(res.data.imaging || []);
    } catch (error) {
      console.error('Failed to fetch imaging catalog:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      patient_id: '',
      patient: null,
      items: [],
    });
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setPatientSearchOpen(false);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_type: 'medication',
          item_id: '',
          item_name: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const catalogMap = {
        medication: medications,
        service: services,
        lab_test: labTests,
        imaging: imagingProcedures,
      };

      if (field === 'item_type') {
        newItems[index] = {
          ...newItems[index],
          item_type: value,
          item_id: '',
          item_name: '',
          unit_price: 0,
          total_price: 0,
        };
      } else {
        newItems[index][field] = value;
      }

      if (field === 'item_id') {
        const itemType = newItems[index].item_type || 'medication';
        const catalog = catalogMap[itemType] || [];
        const selected = catalog.find((entry) => entry.id === value);
        if (selected) {
          newItems[index].item_name = selected.name;
          newItems[index].unit_price = selected.unit_price;
          newItems[index].total_price = selected.unit_price * newItems[index].quantity;
        }
      }

      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
      }

      return { ...prev, items: newItems };
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const deriveBillType = () => {
    if (formData.items.length === 0) {
      return 'medication';
    }
    const uniqueTypes = [...new Set(formData.items.map((item) => item.item_type || 'medication'))];
    if (uniqueTypes.length === 1) {
      const soleType = uniqueTypes[0];
      switch (soleType) {
        case 'medication':
        case 'service':
        case 'lab_test':
        case 'imaging':
          return soleType;
        default:
          return 'custom';
      }
    }
    // When multiple types exist, prioritize by importance:
    // 1. service (consultation) - highest priority
    // 2. lab_test
    // 3. imaging
    // 4. medication - lowest priority
    if (uniqueTypes.includes('service')) {
      return 'service'; // Map to 'consultation' in backend
    } else if (uniqueTypes.includes('lab_test')) {
      return 'lab_test';
    } else if (uniqueTypes.includes('imaging')) {
      return 'imaging'; // Map to 'consultation' in backend
    } else {
      return 'medication'; // Default fallback
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        setError('Vui lòng chọn bệnh nhân');
        return;
      }
      if (formData.items.length === 0) {
        setError('Vui lòng thêm ít nhất một mục vào hóa đơn');
        return;
      }

      const { patient, ...payload } = formData;
      payload.bill_type = deriveBillType();

      await api.post('/admin/bills', payload);
      setSuccess('Tạo hóa đơn thành công!');
      handleCloseDialog();
      fetchBills();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to create bill:', error);
      setError('Không thể tạo hóa đơn');
    }
  };

  const handleViewBill = async (billId) => {
    try {
      const res = await api.get(`/admin/bills/${billId}`);
      setSelectedBill(res.data);
      setOpenViewDialog(true);
    } catch (error) {
      console.error('Failed to fetch bill details:', error);
      setError('Không thể tải chi tiết hóa đơn');
    }
  };

  const handleOpenPayment = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount('');
    setOpenPaymentDialog(true);
  };

  const handleProcessPayment = async () => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Số tiền thanh toán không hợp lệ');
        return;
      }

      await api.put(`/admin/bills/${selectedBill.id}/pay`, { amount });
      setSuccess('Thanh toán thành công!');
      setOpenPaymentDialog(false);
      fetchBills();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to process payment:', error);
      setError(error.response?.data?.detail || 'Không thể xử lý thanh toán');
    }
  };

  const handleCancelBill = async (billId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy hóa đơn này?')) return;

    try {
      await api.put(`/admin/bills/${billId}/cancel`);
      setSuccess('Hủy hóa đơn thành công!');
      fetchBills();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to cancel bill:', error);
      setError(error.response?.data?.detail || 'Không thể hủy hóa đơn');
    }
  };

  const handleDelete = async (billId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;

    try {
      await api.delete(`/admin/bills/${billId}`);
      setSuccess('Xóa hóa đơn thành công!');
      fetchBills();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete bill:', error);
      setError(error.response?.data?.detail || 'Không thể xóa hóa đơn');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'partial':
        return 'Thanh toán một phần';
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getBillTypeLabel = (type) => {
    switch (type) {
      case 'consultation':
        return 'Tư vấn';
      case 'medication':
        return 'Thuốc';
      case 'lab_test':
        return 'Xét nghiệm';
      case 'surgery':
        return 'Phẫu thuật';
      case 'hospitalization':
        return 'Nằm viện';
      default:
        return type;
    }
  };

  const getItemTypeLabel = (itemType) => {
    switch (itemType) {
      case 'medication':
        return 'Thuốc';
      case 'service':
        return 'Dịch vụ';
      case 'lab_test':
        return 'Xét nghiệm';
      case 'imaging':
        return 'Chẩn đoán hình ảnh';
      default:
        return itemType;
    }
  };

  const getBillTypesDisplay = (bill) => {
    // If bill has item_types array, use it to show all types
    if (bill.item_types && bill.item_types.length > 0) {
      return bill.item_types.map(getItemTypeLabel).join(' - ');
    }
    // Fallback to bill_type if item_types not available
    return getBillTypeLabel(bill.bill_type);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý thanh toán</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          TẠO HÓA ĐƠN
        </Button>
      </Box>

      {/* Date Filter */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FilterListIcon color="action" />
          <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '60px' }}>
            Lọc theo ngày:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Từ ngày"
              value={fromDate}
              onChange={(newValue) => {
                setFromDate(newValue);
                setPage(1); // Reset to first page when filter changes
              }}
              slotProps={{ textField: { size: 'small', sx: { width: '180px' } } }}
              format="DD/MM/YYYY"
            />
            <DatePicker
              label="Đến ngày"
              value={toDate}
              onChange={(newValue) => {
                setToDate(newValue);
                setPage(1); // Reset to first page when filter changes
              }}
              slotProps={{ textField: { size: 'small', sx: { width: '180px' } } }}
              format="DD/MM/YYYY"
              minDate={fromDate}
            />
          </LocalizationProvider>
          {(fromDate || toDate) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearDateFilter}
              sx={{ ml: 'auto' }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', width: '100%' }}>
        <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '130px', padding: '12px 8px' }}>Số hóa đơn</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '140px', padding: '12px 8px' }}>Bệnh nhân</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '280px', padding: '12px 8px' }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px', textAlign: 'right', padding: '12px 8px' }}>Tổng tiền</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px', textAlign: 'right', padding: '12px 8px' }}>Đã thanh toán</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px', padding: '12px 8px' }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '110px', padding: '12px 8px' }}>Ngày tạo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '100px', padding: '12px 4px' }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => {
              const typesDisplay = getBillTypesDisplay(bill);
              const typesArray = bill.item_types && bill.item_types.length > 0 
                ? bill.item_types.map(getItemTypeLabel) 
                : [getBillTypeLabel(bill.bill_type)];
              
              return (
                <TableRow key={bill.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 8px' }}>{bill.bill_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 8px' }}>{bill.patient_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.4,
                      alignItems: 'center',
                      maxWidth: '100%'
                    }}>
                      {typesArray.map((type, idx) => (
                        <Chip 
                          key={idx} 
                          label={type} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: '22px',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 'medium', fontSize: '0.95rem', padding: '12px 8px' }}>
                    {Number(bill.total_amount).toLocaleString('vi-VN')} ₫
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontSize: '0.95rem', padding: '12px 8px' }}>
                    {Number(bill.paid_amount).toLocaleString('vi-VN')} ₫
                  </TableCell>
                  <TableCell sx={{ padding: '12px 8px' }}>
                    <Chip 
                      label={getStatusLabel(bill.status)} 
                      color={getStatusColor(bill.status)} 
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.9rem', padding: '12px 8px' }}>
                    {new Date(bill.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell sx={{ padding: '12px 4px' }}>
                    <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleViewBill(bill.id)}
                          sx={{ padding: '4px', fontSize: '1rem' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                        <>
                          <Tooltip title="Thanh toán">
                            <IconButton 
                              color="success" 
                              size="small"
                              onClick={() => handleOpenPayment(bill)}
                              sx={{ padding: '4px', fontSize: '1rem' }}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy hóa đơn">
                            <IconButton 
                              color="warning" 
                              size="small"
                              onClick={() => handleCancelBill(bill.id)}
                              sx={{ padding: '4px', fontSize: '1rem' }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Xóa">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDelete(bill.id)}
                          sx={{ padding: '4px', fontSize: '1rem' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Create Bill Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Tạo hóa đơn mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              open={patientSearchOpen}
              onOpen={() => {
                const numericOnly = /^\d+$/.test(patientSearchQuery);
                const isValidLength =
                  patientSearchQuery.length === 10 || patientSearchQuery.length === 12;
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
                  // User is typing - clear previous selection if they start typing
                  if (formData.patient && displayValue !== patientSearchQuery) {
                    // User is typing something different, clear selection
                    setFormData((prev) => ({
                      ...prev,
                      patient_id: '',
                      patient: null,
                    }));
                  }
                  setPatientSearchQuery(displayValue);
                  const numericOnly = /^\d+$/.test(displayValue);
                  const isValidLength = displayValue.length === 10 || displayValue.length === 12;

                  if (numericOnly && isValidLength) {
                    setPatientSearchOpen(true);
                    debouncedSearchPatients(displayValue);
                  } else {
                    setPatientSearchResults([]);
                    setPatientSearchOpen(false);
                    // Clear selection if input is cleared or invalid
                    if (displayValue.length === 0) {
                      setFormData((prev) => ({
                        ...prev,
                        patient_id: '',
                        patient: null,
                      }));
                    }
                  }
                } else if (reason === 'clear') {
                  // User clicked clear button
                  setPatientSearchQuery('');
                  setPatientSearchResults([]);
                  setFormData((prev) => ({
                    ...prev,
                    patient_id: '',
                    patient: null,
                  }));
                } else if (reason === 'reset') {
                  // Reset to selected patient's display text
                  if (formData.patient) {
                    const cccd = formData.patient.cccd ? ` - CCCD: ${formData.patient.cccd}` : '';
                    const displayText = `${formData.patient.full_name || ''} - ${formData.patient.phone || ''}${cccd}`;
                    setPatientSearchQuery(displayText);
                  }
                }
              }}
              filterOptions={(x) => x} // Disable default filtering, we use server-side search
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              noOptionsText={
                patientSearchQuery.length === 0
                  ? 'Nhập đủ 10 số điện thoại hoặc 12 số CCCD để tìm kiếm'
                  : !/^\d+$/.test(patientSearchQuery)
                  ? 'Chỉ cho phép nhập số'
                  : patientSearchQuery.length === 10 || patientSearchQuery.length === 12
                  ? patientSearchLoading
                  ? 'Đang tìm kiếm...'
                  : 'Không tìm thấy bệnh nhân'
                  : 'Nhập đủ 10 số điện thoại hoặc 12 số CCCD để tìm kiếm'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tìm kiếm bệnh nhân"
                  placeholder="Chỉ nhập số: SĐT (10 số) hoặc CCCD (12 số)"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {patientSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.full_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SĐT: {option.phone || 'N/A'}
                      {option.cccd && ` | CCCD: ${option.cccd}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            <Typography variant="caption" color="text.secondary">
              Chỉ hỗ trợ tìm kiếm chính xác: nhập đủ 10 số điện thoại hoặc 12 số CCCD.
            </Typography>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Chi tiết hóa đơn</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddItem}>
                Thêm mục
              </Button>
            </Box>

            {formData.items.map((item, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Loại</InputLabel>
                      <Select
                        value={item.item_type}
                        onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                        label="Loại"
                      >
                        <MenuItem value="medication">Thuốc</MenuItem>
                        <MenuItem value="service">Dịch vụ</MenuItem>
                        <MenuItem value="lab_test">Xét nghiệm</MenuItem>
                        <MenuItem value="imaging">Chẩn đoán hình ảnh</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {item.item_type === 'medication' ? (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Thuốc</InputLabel>
                        <Select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          label="Thuốc"
                        >
                          {medications.map((med) => (
                            <MenuItem key={med.id} value={med.id}>
                              {med.name} - {Number(med.unit_price).toLocaleString('vi-VN')} ₫
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ) : item.item_type === 'service' ? (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Dịch vụ</InputLabel>
                        <Select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          label="Dịch vụ"
                        >
                          {services.map((service) => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name} - {Number(service.unit_price).toLocaleString('vi-VN')} ₫
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ) : item.item_type === 'lab_test' ? (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Xét nghiệm</InputLabel>
                        <Select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          label="Xét nghiệm"
                        >
                          {labTests.map((test) => (
                            <MenuItem key={test.id} value={test.id}>
                              {test.name} - {Number(test.unit_price).toLocaleString('vi-VN')} ₫
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ) : item.item_type === 'imaging' ? (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Chẩn đoán hình ảnh</InputLabel>
                        <Select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          label="Chẩn đoán hình ảnh"
                        >
                          {imagingProcedures.map((procedure) => (
                            <MenuItem key={procedure.id} value={procedure.id}>
                              {procedure.name} - {Number(procedure.unit_price).toLocaleString('vi-VN')} ₫
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Tên mục"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Số lượng"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Đơn giá"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      disabled={CATALOG_ITEM_TYPES.includes(item.item_type)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tổng tiền"
                      value={Number(item.total_price).toLocaleString('en-US')}
                      disabled
                    />
                  </Grid>

                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => handleRemoveItem(index)}>
                      <RemoveIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h6">
                Tổng cộng: {calculateTotal().toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết hóa đơn: {selectedBill?.bill_number}</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin bệnh nhân
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Số hóa đơn:</Typography>
                  <Typography variant="body1">{selectedBill.bill_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tên bệnh nhân:</Typography>
                  <Typography variant="body1">{selectedBill.patient_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Mã bệnh nhân:</Typography>
                  <Typography variant="body1">{selectedBill.patient_code || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                  <Typography variant="body1">{selectedBill.patient_phone || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Thông tin hóa đơn
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Loại hóa đơn:</Typography>
                  <Typography variant="body1">{getBillTypesDisplay(selectedBill)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                  <Chip label={getStatusLabel(selectedBill.status)} color={getStatusColor(selectedBill.status)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Người tạo:</Typography>
                  <Typography variant="body1">{selectedBill.created_by || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                  <Typography variant="body1">{new Date(selectedBill.created_at).toLocaleString('vi-VN')}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Danh sách mục
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên mục</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Tổng tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBill.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.item_type}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{Number(item.unit_price).toLocaleString('en-US')} ₫</TableCell>
                        <TableCell align="right">{Number(item.total_price).toLocaleString('en-US')} ₫</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Typography variant="h6">Tổng cộng: {Number(selectedBill.total_amount).toLocaleString('vi-VN')} ₫</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Typography variant="h6">Đã thanh toán: {Number(selectedBill.paid_amount).toLocaleString('vi-VN')} ₫</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Typography variant="h6" color="error">
                  Còn lại: {(Number(selectedBill.total_amount) - Number(selectedBill.paid_amount)).toLocaleString('vi-VN')} ₫
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xử lý thanh toán cho hóa đơn {selectedBill?.bill_number}</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Số hóa đơn: {selectedBill.bill_number}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng tiền: {Number(selectedBill.total_amount).toLocaleString('vi-VN')} ₫
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đã thanh toán: {Number(selectedBill.paid_amount).toLocaleString('vi-VN')} ₫
              </Typography>
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                Còn lại: {(Number(selectedBill.total_amount) - Number(selectedBill.paid_amount)).toLocaleString('vi-VN')} ₫
              </Typography>

              <TextField
                fullWidth
                label="Số tiền thanh toán"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Hủy</Button>
          <Button onClick={handleProcessPayment} variant="contained" color="success">
            Xử lý thanh toán
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Billing;

