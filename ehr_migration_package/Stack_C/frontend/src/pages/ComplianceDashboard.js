import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  TablePagination,
  Menu,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Rule as RuleIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Computer as ComputerIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as AutoAwesomeIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = window.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8003';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('keycloak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('keycloak_token');
      console.error('Unauthorized: Token expired or invalid');
    }
    return Promise.reject(error);
  }
);

const ComplianceDashboard = () => {
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Bulk Actions
  const [selectedViolations, setSelectedViolations] = useState([]);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // Timeline & Risk Score Data
  const [timelineData, setTimelineData] = useState([]);
  const [riskScoreData, setRiskScoreData] = useState([]);
  
  // Notifications
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchData();
    if (activeTab === 1) fetchTimelineData();
    if (activeTab === 2) fetchRiskScoreData();
  }, [activeTab]);

  useEffect(() => {
    filterViolations();
    setSelectedViolations([]); // Clear selection when filtering
  }, [violations, searchQuery, severityFilter, typeFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResponse, violationsResponse] = await Promise.all([
        api.get('/api/compliance/stats'),
        api.get('/api/compliance/violations', { 
          params: { limit: 500, include_rules: true } 
        })
      ]);
      
      setStats(statsResponse.data.stats);
      // Ensure mapped_rules is always an array
      const violationsData = violationsResponse.data.violations || [];
      violationsData.forEach(v => {
        if (!v.mapped_rules) {
          v.mapped_rules = [];
        }
      });
      setViolations(violationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterViolations = () => {
    let filtered = [...violations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        (v.log_user || v.user_id || '').toLowerCase().includes(query) ||
        (v.violation_type || '').toLowerCase().includes(query) ||
        (v.description || '').toLowerCase().includes(query)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(v => v.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.violation_type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => (v.status || 'open') === statusFilter);
    }

    setFilteredViolations(filtered);
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  const handleViewDetails = async (violation) => {
    setSelectedViolation(violation);
    setDetailDialogOpen(true);
    
    // Fetch mapped rules for this violation
    try {
      const response = await api.get(`/api/compliance/violations/${violation.id}/rules`);
      if (response.data.success && response.data.rules) {
        // Update the violation with fetched rules
        setSelectedViolation({
          ...violation,
          mapped_rules: response.data.rules
        });
        // Also update in the violations list
        setViolations(prevViolations => 
          prevViolations.map(v => 
            v.id === violation.id 
              ? { ...v, mapped_rules: response.data.rules }
              : v
          )
        );
      }
    } catch (error) {
      console.error('Error fetching violation rules:', error);
      // If error (e.g., table doesn't exist), set empty array
      setSelectedViolation({
        ...violation,
        mapped_rules: []
      });
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedViolations(filteredViolations.map(v => v.id));
    } else {
      setSelectedViolations([]);
    }
  };

  const handleSelectOne = (violationId) => {
    const selectedIndex = selectedViolations.indexOf(violationId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedViolations, violationId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedViolations.slice(1));
    } else if (selectedIndex === selectedViolations.length - 1) {
      newSelected = newSelected.concat(selectedViolations.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedViolations.slice(0, selectedIndex),
        selectedViolations.slice(selectedIndex + 1)
      );
    }

    setSelectedViolations(newSelected);
  };

  const handleBulkAction = async (action) => {
    if (selectedViolations.length === 0) {
      showNotification('Please select at least one violation', 'warning');
      return;
    }

    try {
      if (action === 'resolve') {
        await api.post('/api/compliance/violations/bulk-update', {
          violation_ids: selectedViolations,
          status: 'resolved'
        });
        showNotification(`Resolved ${selectedViolations.length} violations`, 'success');
      } else if (action === 'export') {
        const ids = selectedViolations.join(',');
        window.open(`${API_BASE_URL}/api/compliance/violations/export?format=excel&violation_ids=${ids}`, '_blank');
        showNotification('Exporting file...', 'info');
      } else if (action === 'auto-map') {
        let mapped = 0;
        for (const id of selectedViolations) {
          try {
            await api.post('/api/compliance/violations/auto-map-rules', null, {
              params: { violation_id: id }
            });
            mapped++;
          } catch (e) {
            console.error(`Error auto-mapping violation ${id}:`, e);
          }
        }
        showNotification(`Auto-mapped ${mapped}/${selectedViolations.length} violations`, 'success');
      }
      
      setSelectedViolations([]);
      setBulkMenuAnchor(null);
      fetchData();
    } catch (error) {
      showNotification(`Lỗi: ${error.response?.data?.detail || error.message}`, 'error');
    }
  };

  const handleExport = async (format = 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        limit: '10000'
      });
      
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedViolations.length > 0) {
        params.append('violation_ids', selectedViolations.join(','));
      }
      
      window.open(`${API_BASE_URL}/api/compliance/violations/export?${params.toString()}`, '_blank');
      showNotification('Exporting file...', 'info');
    } catch (error) {
      showNotification(`Export error: ${error.message}`, 'error');
    }
  };

  const handleAutoMap = async (violationId) => {
    try {
      const response = await api.post('/api/compliance/violations/auto-map-rules', null, {
        params: { violation_id: violationId }
      });
      if (response.data.success) {
        showNotification(`Mapped ${response.data.matched_rules.length} rules`, 'success');
        fetchData();
      }
    } catch (error) {
      showNotification(`Lỗi: ${error.response?.data?.detail || error.message}`, 'error');
    }
  };

  const handleAutoMapAll = async () => {
    if (!window.confirm('Are you sure you want to auto-map all violations without mapping? This process may take several minutes.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/api/compliance/violations/auto-map-all', null, {
        params: { limit: 1000 }
      });
      if (response.data.success) {
        showNotification(
          `Mapped ${response.data.violations_mapped} violations with ${response.data.total_mappings} rule mappings`, 
          'success'
        );
        fetchData();
      } else {
        showNotification(response.data.message || 'An error occurred', 'warning');
      }
    } catch (error) {
      showNotification(`Lỗi: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineData = async () => {
    try {
      const response = await api.get('/api/compliance/violations/timeline', {
        params: { days: 30 }
      });
      if (response.data.success) {
        setTimelineData(response.data.timeline);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const fetchRiskScoreData = async () => {
    try {
      const response = await api.get('/api/compliance/violations/risk-score', {
        params: { days: 30 }
      });
      if (response.data.success) {
        setRiskScoreData(response.data.risk_scores);
      }
    } catch (error) {
      console.error('Error fetching risk score:', error);
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated violations
  const paginatedViolations = filteredViolations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getSeverityChip = (severity) => {
    const severityConfig = {
      critical: { label: 'Critical', color: 'error' },
      high: { label: 'High', color: 'error' },
      medium: { label: 'Medium', color: 'warning' },
      low: { label: 'Low', color: 'info' }
    };
    
    const config = severityConfig[severity] || severityConfig.low;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getViolationTypeLabel = (type) => {
    const typeLabels = {
      unauthorized_access: 'Unauthorized Access',
      data_breach: 'Data Breach',
      policy_violation: 'Policy Violation',
      missing_consent: 'Missing Consent',
      excessive_access: 'Excessive Access',
      no_audit_log: 'Missing Audit Log',
      after_hours_access: 'After Hours Access',
      suspicious_pattern: 'Suspicious Pattern'
    };
    return typeLabels[type] || type;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    try {
      const date = new Date(ts);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
        📊 Dashboard Tuân thủ Pháp luật VN
      </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Tổng vi phạm</Typography>
              </Box>
              <Typography variant="h3">{stats?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">Critical</Typography>
              </Box>
              <Typography variant="h3" color="error">
                {stats?.critical_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Mới</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {stats?.new_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Đã giải quyết</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats?.by_status?.resolved || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Violations by Severity and Type */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Violations by Severity
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Critical</TableCell>
                  <TableCell align="right">{stats?.by_severity?.critical || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>High</TableCell>
                  <TableCell align="right">{stats?.by_severity?.high || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Medium</TableCell>
                  <TableCell align="right">{stats?.by_severity?.medium || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Low</TableCell>
                  <TableCell align="right">{stats?.by_severity?.low || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Violations by Type
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Violation Type</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.by_type?.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{getViolationTypeLabel(item.violation_type)}</TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by user, violation type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Violation Type</InputLabel>
              <Select
                value={typeFilter}
                label="Violation Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unauthorized_access">Unauthorized Access</MenuItem>
                <MenuItem value="data_breach">Data Breach</MenuItem>
                <MenuItem value="after_hours_access">After Hours Access</MenuItem>
                <MenuItem value="excessive_access">Excessive Access</MenuItem>
                <MenuItem value="policy_violation">Policy Violation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Violations List" icon={<VisibilityIcon />} />
          <Tab label="Timeline" icon={<TimelineIcon />} />
          <Tab label="Risk Score" icon={<BarChartIcon />} />
        </Tabs>
      </Paper>

      {/* Simplified Violations Table */}
      {activeTab === 0 && (
      <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Violations List
              {filteredViolations.length !== violations.length && (
                <Chip 
                  label={`${filteredViolations.length}/${violations.length}`} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
        </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectedViolations.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<MoreVertIcon />}
                    onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                  >
                    Actions ({selectedViolations.length})
                  </Button>
                  <Menu
                    anchorEl={bulkMenuAnchor}
                    open={Boolean(bulkMenuAnchor)}
                    onClose={() => setBulkMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => handleBulkAction('resolve')}>
                      <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                      Mark as Resolved
                    </MenuItem>
                    <MenuItem onClick={() => handleBulkAction('auto-map')}>
                      <AutoAwesomeIcon sx={{ mr: 1 }} />
                      Auto-map Rules
                    </MenuItem>
                    <MenuItem onClick={() => handleBulkAction('export')}>
                      <DownloadIcon sx={{ mr: 1 }} />
                      Export Selected
                    </MenuItem>
                  </Menu>
                </>
              )}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('excel')}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleAutoMapAll}
                disabled={loading}
              >
                Auto-map All
              </Button>
            </Box>
          </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedViolations.length > 0 && selectedViolations.length < filteredViolations.length}
                    checked={filteredViolations.length > 0 && selectedViolations.length === filteredViolations.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell><strong>Time</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Violation Type</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Related Rules</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedViolations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {violations.length === 0 ? 'No violations' : 'No violations found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedViolations.map((violation) => (
                  <TableRow key={violation.id} hover selected={selectedViolations.indexOf(violation.id) !== -1}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedViolations.indexOf(violation.id) !== -1}
                        onChange={() => handleSelectOne(violation.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimestamp(violation.log_timestamp || violation.detected_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {violation.log_user || violation.user_id || 'N/A'}
                        </Typography>
                        {violation.log_role && (
                          <Chip label={violation.log_role} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getViolationTypeLabel(violation.violation_type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getSeverityChip(violation.severity)}
                    </TableCell>
                    <TableCell>
                      {violation.mapped_rules && violation.mapped_rules.length > 0 ? (
                        <Badge badgeContent={violation.mapped_rules.length} color="primary">
                          <Chip 
                            icon={<RuleIcon />}
                            label={`${violation.mapped_rules.length} rules`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Badge>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            No mapping
                          </Typography>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleAutoMap(violation.id)}
                            title="Auto-map rules"
                          >
                            <AutoAwesomeIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(violation)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredViolations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Rows per page:"
        />
      </Paper>
      )}

      {/* Timeline View */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Violations Timeline (Last 30 Days)
          </Typography>
          {timelineData.length === 0 ? (
            <Alert severity="info">No timeline data</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Violation Type</strong></TableCell>
                    <TableCell align="right"><strong>Count</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timelineData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{getSeverityChip(item.severity)}</TableCell>
                      <TableCell>{getViolationTypeLabel(item.violation_type)}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Risk Score View */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risk Score (30 ngày gần nhất)
          </Typography>
          {riskScoreData.length === 0 ? (
            <Alert severity="info">Không có dữ liệu risk score</Alert>
          ) : (
            <Grid container spacing={2}>
              {riskScoreData.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {item.date}
                      </Typography>
                      <Typography variant="h4" color="error">
                        {item.risk_score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.total_violations} vi phạm
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Violation Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedViolation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">
                    Violation Details #{selectedViolation.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getViolationTypeLabel(selectedViolation.violation_type)}
                  </Typography>
                </Box>
                {getSeverityChip(selectedViolation.severity)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                {/* Basic Information */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Basic Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">User</Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedViolation.log_user || selectedViolation.user_id || 'N/A'}
                        </Typography>
                        {selectedViolation.log_role && (
                          <Chip label={selectedViolation.log_role} size="small" sx={{ mt: 0.5 }} />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">Time</Typography>
                        </Box>
                        <Typography variant="body1">
                          {formatTimestamp(selectedViolation.log_timestamp || selectedViolation.detected_at)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                        </Box>
                        <Typography variant="body1">
                          {selectedViolation.description || 'No description'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Technical Details */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Technical Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Method</Typography>
                        <Typography variant="body1">{selectedViolation.log_method || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedViolation.log_status || 'N/A'} 
                          size="small"
                          color={selectedViolation.log_status === '200' ? 'success' : 'error'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">IP Client</Typography>
                        </Box>
                        <Typography variant="body1">{selectedViolation.log_client_ip || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">IP Server</Typography>
                        </Box>
                        <Typography variant="body1">{selectedViolation.log_remote_ip || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <ComputerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" color="text.secondary">Device</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {selectedViolation.log_device || 'Unknown'}
                        </Typography>
                      </Grid>
                      {selectedViolation.log_patient_code && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                          <Typography variant="body1">{selectedViolation.log_patient_code}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Mapped Rules */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <RuleIcon />
                      <Typography variant="h6">Related Rules</Typography>
                      {selectedViolation.mapped_rules && selectedViolation.mapped_rules.length > 0 && (
                        <Chip 
                          label={selectedViolation.mapped_rules.length} 
                          size="small" 
                          color="primary"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedViolation.mapped_rules && selectedViolation.mapped_rules.length > 0 ? (
                      <List>
                        {selectedViolation.mapped_rules.map((rule, idx) => (
                          <React.Fragment key={idx}>
                            <ListItem>
                              <ListItemIcon>
                                <RuleIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                      {rule.rule_code}
                                    </Typography>
                                    {rule.match_score && (
                                      <Chip 
                                        label={`${rule.match_score}% match`} 
                                        size="small" 
                                        color="success"
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {rule.rule_name}
                                    </Typography>
                                    {rule.matched_fields && Array.isArray(rule.matched_fields) && rule.matched_fields.length > 0 && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Matched fields: {rule.matched_fields.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {rule.legal_basis && (
                                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <GavelIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          {rule.legal_basis}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                            {idx < selectedViolation.mapped_rules.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="info">
                        No rules have been mapped to this violation. You can manually map in the "Rules Management" page.
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Legal Reference */}
                {selectedViolation.legal_reference && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GavelIcon />
                        <Typography variant="h6">Legal Basis</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1">
                        {selectedViolation.legal_reference}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => {
                  handleAutoMap(selectedViolation.id);
                  setDetailDialogOpen(false);
                }}
              >
                Auto-map Rules
              </Button>
              <Button variant="contained" onClick={() => {
                window.location.href = '/rules';
              }}>
                Map với Quy tắc
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComplianceDashboard;
